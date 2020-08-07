const express = require('express')
const process = require('process')
const { resolve } = require('path');
const { readdir, writeFile } = require('fs').promises;
const fs = require('fs');
const sha1 = require('sha1')
const path = require('path')
const imageThumbnail = require('image-thumbnail');


//
// File i/o
//
async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}


//
// Photos
//
const PHOTO_REGEX = new RegExp("^(?<year>[\\d]{4})\\/(?<month>[\\d]{1,2})\\/(?<day>[\\d]{1,2})\\/(?<filename>.*\.(jpg|png))$", 'i')

class Photo {
    static get PATH_PATTERN() {
        return PHOTO_REGEX
    }

    constructor(relativePath) {
        const match = Photo.PATH_PATTERN.exec(relativePath)

        if (!match) {
            throw new Error(`Photo file path does not match expected pattern`)
        }
        
        this.year = parseInt(match.groups.year)
        this.month = parseInt(match.groups.month)
        this.day = parseInt(match.groups.day)
        this.filename = match.groups.filename

        this.relativePath = relativePath

        const hash = sha1(relativePath)
        const ext = path.extname(relativePath)
        this.thumbnailRelativePath = `${hash}${ext}`
    }
}


//
// Thumbnails
//
const getThumbnailAbsolutePath = (thumbnailsPath, photo) => {
    return path.join(thumbnailsPath, photo.thumbnailRelativePath)
}

const generateThumbnailFile = async (galleryPath, thumbnailsPath, photo) => {
    const finalPath = getThumbnailAbsolutePath(thumbnailsPath, photo)
    if (fs.existsSync(finalPath)) {
        return Promise.resolve()
    }

    const imagePath = path.join(galleryPath, photo.relativePath)
    const options = { percentage: 25 }

    try {
        const thumbnail = await imageThumbnail(imagePath, options)
        return writeFile(finalPath, thumbnail)
    } catch(err) {
        console.log(`Error with ${imagePath}: ${err.message}`)
        return Promise.resolve()
    }
}


//
// Application state
//
const loadApplicationState = async (galleryPath, thumbnailsPath) => {
    const files = await getFiles(galleryPath)

    const photos =
        files
            .map(absPath => absPath.substring(galleryPath.length))
            .sort()
            .reverse()
            .filter(path => PHOTO_REGEX.test(path))
            .map(path => new Photo(path))

    console.log(`Found ${photos.length} photos, generating thumbnails...`)

    await Promise.all(photos.map(p => generateThumbnailFile(galleryPath, thumbnailsPath, p)))
    console.log('Thumbnails generated')

    return Promise.resolve({ photos, galleryPath, thumbnailsPath })
}


//
// Application
//
const buildApplication = (app, { galleryPath, thumbnailsPath, photos }) => {
    app.use('/raw', express.static(galleryPath))

    app.use('/thumbnail', express.static(thumbnailsPath))

    app.get('/api/photos', (req, res) => {
        const photoJson = photos.map(p => {
            return {
                filename: p.filename,
                rawUrl: `/raw/${p.relativePath}`,
                thumbnailUrl: `/thumbnail/${p.thumbnailRelativePath}`,
                date: { year: p.year, month: p.month, day: p.day }
            }
        })

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(photoJson))
    })

    app.use('/', express.static(path.join(__dirname, '../frontend/build/')))
}


//
// Configuration
//
const galleryPath = process.env.GALLERY_PATH
const thumbnailsPath = process.env.THUMBNAILS_PATH
const PORT = process.env.PORT || 3001;


//
// Bootstrap the application
//
loadApplicationState(galleryPath, thumbnailsPath)
    .then(state => {
        const app = express()

        buildApplication(app, state)

        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`)
        })
    })
    .catch(err => {
        console.log(`ERROR loading application: ${err.message}`)
    })
