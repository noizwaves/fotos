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

// Albums
const ALBUM_REGEX = new RegExp("\.json$")

class Album {
  constructor(id, name, relativePhotoPaths) {
    this.id = id;
    this.name = name;
    this.relativePhotoPaths = relativePhotoPaths.filter(p => PHOTO_REGEX.test(p));
  }

  verifyContents(photosRootPath) {
    this.relativePhotoPaths.forEach(p => {
      const absPath = path.join(photosRootPath, p)
      if (!fs.existsSync(absPath)) {
        console.log(`Error in Album ${this.id}: Cannot find ${p}`)
      }
    })
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

class PhotoLibrary {
  constructor(photosRootPath, thumbnailsRootPath, albumsRootPath) {
    this.photosRootPath = photosRootPath
    this.thumbnailsRootPath = thumbnailsRootPath
    this.albumsRootPath = albumsRootPath

    this._photos = null
    this._albums = null
  }

  get photos() {
    return this._photos;
  }

  get albums() {
    return this._albums;
  }



  async init() {
    const files = await getFiles(this.photosRootPath)

    this._photos =
      files
        .map(absPath => relative(this.photosRootPath, absPath))
        .sort()
        .reverse()
        .filter(path => PHOTO_REGEX.test(path))
        .map(path => new Photo(path))

    console.log(`Found ${this.photos.length} photos, generating thumbnails...`)

    await Promise.all(this.photos.map(p => generateThumbnailFile(photosRootPath, thumbnailsRootPath, p)))
    console.log('Thumbnails generated')

    console.log('Loading albums...')
    const albumFiles = await getFiles(albumsRootPath)
    this._albums =
      albumFiles
        .filter(path => ALBUM_REGEX.test(path))
        .map(path => [relative(albumsRootPath, path), fs.readFileSync(path)])
        .map(([id, data]) => [id, JSON.parse(data)])
        .map(([id, data]) => new Album(id, data.name, data.photos))
    console.log('Albums loaded')

    return Promise.resolve()
  }
}

const loadApplicationState = async (photosRootPath, thumbnailsRootPath, albumsRootPath) => {
  const library = new PhotoLibrary(photosRootPath, thumbnailsRootPath, albumsRootPath)
  await library.init()

  return Promise.resolve({library, photosRootPath, thumbnailsRootPath})
}


//
// Application
//
const buildApplication = ({photosRootPath, thumbnailsRootPath, library}, app) => {
  app.use('/photos', express.static(photosRootPath))

  app.use('/thumbnails', express.static(thumbnailsRootPath))

  app.get('/api/photos', (req, res) => {
    const photoJson = library.photos.map(p => {
      return p.relativePath
    })

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(photoJson))
  })

  app.get('/api/albums', (req, res) => {
    const albumsJson = library.albums.map(a => {
      return {
        id: a.id,
        name: a.name,
        photos: a.relativePhotoPaths
      }
    })

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(albumsJson))
  })

  app.use('/', express.static(path.join(__dirname, '../frontend/build/')))
}


//
// Configuration
//
const photosRootPath = process.env.PHOTOS_ROOT_PATH
const thumbnailsRootPath = process.env.THUMBNAILS_ROOT_PATH
const albumsRootPath = process.env.ALBUMS_ROOT_PATH
const PORT = process.env.PORT || 3001;


//
// Bootstrap the application
//
loadApplicationState(photosRootPath, thumbnailsRootPath, albumsRootPath)
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
