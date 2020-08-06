const express = require('express')
const cors = require('cors')
const process = require('process')
const { resolve } = require('path');
const { readdir, writeFile } = require('fs').promises;
const fs = require('fs');
const sha1 = require('sha1')
const path = require('path')
const imageThumbnail = require('image-thumbnail');

const app = express()

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
    constructor(relativePath) {
        const match = PHOTO_REGEX.exec(relativePath)
        
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


const galleryPath = process.env.GALLERY_PATH

let photos = []
getFiles(galleryPath)
    .then(filePaths => {
        photos = filePaths
            .map(absPath => absPath.substring(galleryPath.length))
            .sort()
            .reverse()
            .filter(path => PHOTO_REGEX.test(path))
            .map(path => new Photo(path))

        console.log(`Found ${photos.length} photos, generating thumbnails...`)

        // TODO: handle the async return from this properly...
        photos.forEach(generateThumbnail)

        console.log('Thumbnails generated')
    })

//
// Thumbnails
//
const thumbnailsPath = process.env.THUMBNAILS_PATH

function thumbnailPath(photo) {
    return path.join(thumbnailsPath, photo.thumbnailRelativePath)
}

async function generateThumbnail(photo) {
    const finalPath = thumbnailPath(photo)
    if (fs.existsSync(finalPath)) {
        return
    }

    const imagePath = path.join(galleryPath, photo.relativePath)
    // const options = { height: 200, width: 200 }
    const options = { percentage: 25 }
    const thumbnail = await imageThumbnail(imagePath, options)
    await writeFile(finalPath, thumbnail)
}

//
// Web
//
const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
}

// Serve raw gallery
app.use('/raw', express.static(galleryPath))

// Serve thumbnail images
app.use('/thumbnail', express.static(thumbnailsPath))

// Photos API
app.get('/api/photos', cors(corsOptions), (req, res) => {
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

// Serve front end
app.use('/', express.static(path.join(__dirname, '../frontend/build/')))

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`)
})