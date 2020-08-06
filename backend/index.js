const express = require('express')
const cors = require('cors')
const app = express()
const { resolve } = require('path');
const { readdir, writeFile } = require('fs').promises;
const fs = require('fs');
const sha1 = require('sha1')
const path = require('path')
const imageThumbnail = require('image-thumbnail');

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

const PHOTO_REGEX = new RegExp("^(?<year>[\\d]{4})\\/(?<month>[\\d]{1,2})\\/(?<day>[\\d]{1,2})\\/(?<filename>.*)$", '')

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

// const galleryPath = '/Users/adam.neumann/workspace/fotos/example-gallery/'
const galleryPath = '/home/adam/Pictures/iCloud_Photos/'
let photosBy = []
getFiles(galleryPath)
    .then(filePaths => {
        photos = filePaths
            .map(absPath => absPath.substring(galleryPath.length))
            .sort()
            .reverse()
            .filter(path => PHOTO_REGEX.test(path))
            .map(path => new Photo(path))
            .filter((_, i) => i < 200)

        console.log(`Found ${photos.length} photos, generating thumbnails...`)

        // TODO: handle the async return from this properly...
        photos.forEach(generateThumbnail)

        console.log('Thumbnails generated')
    })

// Thumbnails
const thumbnailsPath = '/home/adam/workspace/fotos/thumbnails/'

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

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
}

app.get('/', (req, res) => {
  res.send(`You have ${photos.length} photos`)
})

// Serve raw gallery
app.use('/raw', express.static(galleryPath))

// Serve thumbnail images
app.use('/thumbnail', express.static(thumbnailsPath))

app.get('/api/photos', cors(corsOptions), (req, res) => {
    const photoJson = photos.map(p => {
        return {
            filename: p.filename,
            rawUrl: `http://localhost:3001/raw/${p.relativePath}`,
            thumbnailUrl: `http://localhost:3001/thumbnail/${p.thumbnailRelativePath}`,
            date: { year: p.year, month: p.month, day: p.day }
        }
    })

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(photoJson))
})
 
app.listen(3001)