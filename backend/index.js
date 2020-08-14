const express = require('express')
const process = require('process')
const {resolve, relative} = require('path');
const {readdir, mkdir} = require('fs').promises;
const fs = require('fs');
const path = require('path')
const sharp = require('sharp');


//
// File i/o
//
async function getFiles(dir) {
  const dirents = await readdir(dir, {withFileTypes: true});
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
  }
}


//
// Thumbnails
//
const getThumbnailAbsolutePath = (thumbnailsRootPath, photo) => {
  return path.join(thumbnailsRootPath, photo.relativePath)
}

const generateThumbnailFile = async (photosRootPath, thumbnailsRootPath, photo) => {
  const finalPath = getThumbnailAbsolutePath(thumbnailsRootPath, photo)
  if (fs.existsSync(finalPath)) {
    return Promise.resolve()
  }

  await mkdir(path.dirname(finalPath), { recursive: true})

  const imagePath = path.join(photosRootPath, photo.relativePath)

  try {
    await sharp(imagePath)
      .resize(400, 400, {fit: 'outside', withoutEnlargement: true})
      .withMetadata()
      .toFile(finalPath)
  } catch (err) {
    console.log(`Error with ${imagePath}: ${err.message}`)
    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath)
    }
  }
  return Promise.resolve()
}


//
// Application state
//
const loadApplicationState = async (photosRootPath, thumbnailsRootPath) => {
  const files = await getFiles(photosRootPath)

  const photos =
    files
      .map(absPath => relative(photosRootPath, absPath))
      .sort()
      .reverse()
      .filter(path => PHOTO_REGEX.test(path))
      .map(path => new Photo(path))

  console.log(`Found ${photos.length} photos, generating thumbnails...`)

  await Promise.all(photos.map(p => generateThumbnailFile(photosRootPath, thumbnailsRootPath, p)))
  console.log('Thumbnails generated')

  return Promise.resolve({photos, photosRootPath, thumbnailsRootPath})
}


//
// Application
//
const buildApplication = ({photosRootPath, thumbnailsRootPath, photos}, app) => {
  app.use('/photos', express.static(photosRootPath))

  app.use('/thumbnails', express.static(thumbnailsRootPath))

  app.get('/api/photos', (req, res) => {
    const photoJson = photos.map(p => {
      return p.relativePath
    })

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(photoJson))
  })

  app.use('/', express.static(path.join(__dirname, '../frontend/build/')))
}


//
// Configuration
//
const photosRootPath = process.env.PHOTOS_ROOT_PATH
const thumbnailsRootPath = process.env.THUMBNAILS_ROOT_PATH
const PORT = process.env.PORT || 3001;


//
// Bootstrap the application
//
loadApplicationState(photosRootPath, thumbnailsRootPath)
  .then(state => {
    const app = express()

    buildApplication(state, app)

    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`)
    })
  })
  .catch(err => {
    console.log(`ERROR loading application: ${err.message}`)
  })
