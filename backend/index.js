const express = require('express')
const cors = require('cors')
const app = express()
const { resolve } = require('path');
const { readdir } = require('fs').promises;

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
    }
}

const galleryPath = '/Users/adam.neumann/workspace/fotos/example-gallery/'
let photos = []
getFiles(galleryPath)
    .then(filePaths => {
        photos = filePaths
            .map(absPath => absPath.substring(galleryPath.length))
            .filter(path => PHOTO_REGEX.test(path))
            .map(path => new Photo(path))
            // TODO: sort
    })

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
}

app.get('/', (req, res) => {
  res.send(`You have ${photos.length} photos`)
})

// Serve raw gallery
app.use('/raw', express.static(galleryPath))

app.get('/api/photos', cors(corsOptions), (req, res) => {
    const photoJson = photos.map(p => {
        return {
            filename: p.filename,
            rawUrl: `http://localhost:3001/raw/${p.relativePath}`,
            date: { year: p.year, month: p.month, day: p.day }
        }
    })

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(photoJson))
})
 
app.listen(3001)