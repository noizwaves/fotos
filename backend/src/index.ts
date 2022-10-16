const express = require("express");
const { resolve, relative } = require("path");
const { readdir, mkdir, writeFile } = require("fs").promises;
const { existsSync, mkdirSync, rmSync } = require("fs");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const chokidar = require("chokidar");

//
// File i/o
//
async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

//
// Photos
//
const PHOTO_REGEX = new RegExp(
  "^(?<year>[\\d]{4})\\/(?<month>[\\d]{1,2})\\/(?<day>[\\d]{1,2})\\/(?<filename>.*.(jpg|png))$",
  "i"
);

class Photo {
  private year: number;
  private month: number;
  private day: number;
  private filename: any;
  private relativePath: any;

  static get PATH_PATTERN() {
    return PHOTO_REGEX;
  }

  constructor(relativePath) {
    const match = Photo.PATH_PATTERN.exec(relativePath);

    if (!match) {
      throw new Error(`Photo file path does not match expected pattern`);
    }

    this.year = parseInt(match.groups.year);
    this.month = parseInt(match.groups.month);
    this.day = parseInt(match.groups.day);
    this.filename = match.groups.filename;

    this.relativePath = relativePath;
  }
}

// Albums
const ALBUM_REGEX = new RegExp(".json$");

const ensureNull = (obj) => {
  if (obj === undefined) {
    return null;
  }

  return obj;
};

class Album {
  private id: any;
  private name: any;
  private relativePhotoPaths: any;
  private galleryType: any;
  private galleryOptions: any;

  constructor(id, name, relativePhotoPaths, galleryType, galleryOptions) {
    this.id = id;
    this.name = name;
    this.relativePhotoPaths = relativePhotoPaths.filter((p) =>
      PHOTO_REGEX.test(p)
    );
    this.galleryType = ensureNull(galleryType);
    this.galleryOptions = ensureNull(galleryOptions);
  }

  verifyContents(photosRootPath) {
    this.relativePhotoPaths.forEach((p) => {
      const absPath = path.join(photosRootPath, p);
      if (!fs.existsSync(absPath)) {
        console.log(`Error in Album ${this.id}: Cannot find ${p}`);
      }
    });
  }

  toJSON() {
    const dto: any = {
      name: this.name,
      photos: this.relativePhotoPaths,
    };

    if (this.galleryType !== null && this.galleryType !== undefined) {
      dto.galleryType = this.galleryType;
    }

    if (this.galleryOptions !== null && this.galleryOptions !== undefined) {
      dto.galleryOptions = this.galleryOptions;
    }

    return JSON.stringify(dto, null, 2);
  }

  deleteFromDisk(albumsRootPath) {
    const albumPath = path.join(albumsRootPath, this.id);
    if (existsSync(albumPath)) {
      rmSync(albumPath);
    }
  }

  writeToDisk(albumsRootPath) {
    const albumPath = path.join(albumsRootPath, this.id);
    const dirPath = path.dirname(albumPath);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath);
    }
    return writeFile(albumPath, this.toJSON());
  }
}

//
// Thumbnails
//
const getThumbnailAbsolutePath = (thumbnailsRootPath, photo) => {
  return path.join(thumbnailsRootPath, photo.relativePath);
};

const generateThumbnailFile = async (
  photosRootPath,
  thumbnailsRootPath,
  photo
) => {
  const finalPath = getThumbnailAbsolutePath(thumbnailsRootPath, photo);
  if (fs.existsSync(finalPath)) {
    return Promise.resolve();
  }

  await mkdir(path.dirname(finalPath), { recursive: true });

  const imagePath = path.join(photosRootPath, photo.relativePath);

  try {
    await sharp(imagePath)
      .resize(400, 400, { fit: "outside", withoutEnlargement: true })
      .withMetadata()
      .toFile(finalPath);
  } catch (err) {
    console.log(`Error with ${imagePath}: ${err.message}`);
    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
    }
  }
  return Promise.resolve();
};

const resizeDimensions = {
  small: { width: 512, height: 384 },
  medium: { width: 1024, height: 768 },
  large: { width: 2048, height: 1536 },
};

const generateResizedImage = async (photosRootPath, size, photo) => {
  const imagePath = path.join(photosRootPath, photo.relativePath);
  const { width, height } = resizeDimensions[size];

  return sharp(imagePath)
    .resize(width, height, { fit: "outside", withoutEnlargement: true })
    .withMetadata()
    .toBuffer();
};

//
// Application state
//
class PhotoLibrary {
  private photosRootPath: any;
  private thumbnailsRootPath: any;
  private albumsRootPath: any;
  private _photos: any;
  private _albums: any;

  constructor(photosRootPath, thumbnailsRootPath, albumsRootPath) {
    this.photosRootPath = photosRootPath;
    this.thumbnailsRootPath = thumbnailsRootPath;
    this.albumsRootPath = albumsRootPath;

    this._photos = null;
    this._albums = null;
  }

  get photos() {
    return this._photos;
  }

  get albums() {
    return this._albums;
  }

  async init() {
    const files = await getFiles(this.photosRootPath);

    this._photos = files
      .map((absPath) => relative(this.photosRootPath, absPath))
      .filter((path) => PHOTO_REGEX.test(path))
      .map((path) => new Photo(path));
    this._photos.sort((p1, p2) =>
      p2.relativePath.localeCompare(p1.relativePath)
    );

    console.log(`Found ${this.photos.length} photos, generating thumbnails...`);

    await Promise.all(
      this.photos.map((p) =>
        generateThumbnailFile(this.photosRootPath, this.thumbnailsRootPath, p)
      )
    );
    console.log("Thumbnails generated");

    console.log("Loading albums...");
    const albumFiles = await getFiles(this.albumsRootPath);
    this._albums = albumFiles
      .filter((path) => ALBUM_REGEX.test(path))
      .map((path) => [
        relative(this.albumsRootPath, path),
        fs.readFileSync(path),
      ])
      .map(([id, data]) => [id, JSON.parse(data)])
      .map(
        ([id, data]) =>
          new Album(
            id,
            data.name,
            data.photos,
            data.galleryType,
            data.galleryOptions
          )
      );
    this._albums.sort((p1, p2) => p1.id.localeCompare(p2.id));
    console.log("Albums loaded");

    return Promise.resolve();
  }

  startWatch() {
    chokidar
      .watch(this.photosRootPath, {
        ignoreInitial: true,
        usePolling: false,
        interval: 5000,
      })
      .on("add", async (path) => {
        console.log(`Detected new file: ${path}`);
        const addedPhotos = [path]
          .map((absPath) => relative(this.photosRootPath, absPath))
          .filter((path) => PHOTO_REGEX.test(path))
          .map((path) => new Photo(path));

        if (addedPhotos.length === 0) {
          return;
        }

        this._photos = Array.prototype.concat(this._photos, addedPhotos);
        this._photos.sort((p1, p2) =>
          p2.relativePath.localeCompare(p1.relativePath)
        );

        await Promise.all(
          addedPhotos.map((p) =>
            generateThumbnailFile(
              this.photosRootPath,
              this.thumbnailsRootPath,
              p
            )
          )
        );
      });

    const addAlbum = (path) => {
      const newAlbums = [path]
        .filter((path) => ALBUM_REGEX.test(path))
        .map((path) => [
          relative(this.albumsRootPath, path),
          fs.readFileSync(path),
        ])
        .map(([id, data]) => [id, JSON.parse(data)])
        .map(
          ([id, data]) =>
            new Album(
              id,
              data.name,
              data.photos,
              data.galleryType,
              data.galleryOptions
            )
        );

      if (this._albums) {
        this._albums = Array.prototype.concat(this._albums, newAlbums);
        this._albums.sort((p1, p2) => p1.id.localeCompare(p2.id));
      }
    };

    const removeAlbum = (path) => {
      const idToRemove = relative(this.albumsRootPath, path);

      if (this._albums) {
        this._albums = this._albums.filter((a) => a.id !== idToRemove);
      }
    };

    chokidar
      .watch(this.albumsRootPath, {
        ignoreInitial: true,
        usePolling: false,
        interval: 5000,
      })
      .on("add", (path) => {
        console.log(`Detected new album: ${path}`);
        removeAlbum(path);
        addAlbum(path);
      })
      .on("unlink", async (path) => {
        console.log(`Detected removed album: ${path}`);
        removeAlbum(path);
      })
      .on("change", async (path) => {
        console.log(`Detected changed album: ${path}`);
        removeAlbum(path);
        addAlbum(path);
      });
  }

  async updateAlbum(id: any, photoPaths: string[]) {
    const previous = this._albums.find((a) => a.id === id);
    const newAlbum = new Album(
      id,
      previous.name,
      photoPaths,
      previous.galleryType,
      previous.galleryOptions
    );

    // update state immediately as file detection isn't instantaneous
    this._albums[this._albums.indexOf(previous)] = newAlbum;

    await newAlbum.writeToDisk(albumsRootPath);

    return newAlbum;
  }

  deleteAlbum(id: any) {
    const index = this._albums.findIndex((a) => a.id === id);
    if (index > -1) {
      const album: Album = this._albums[index];
      this._albums.splice(index, 1);

      album.deleteFromDisk(albumsRootPath);
    }
  }

  async createAlbum(path: string, name: string) {
    const newAlbum = new Album(path, name, [], null, null);

    // update state immediately as file detection isn't instantaneous
    this._albums.push(newAlbum);

    await newAlbum.writeToDisk(albumsRootPath);

    return newAlbum;
  }
}

const loadApplicationState = async (
  photosRootPath,
  thumbnailsRootPath,
  albumsRootPath
) => {
  const library = new PhotoLibrary(
    photosRootPath,
    thumbnailsRootPath,
    albumsRootPath
  );
  await library.init();
  library.startWatch();

  return Promise.resolve({
    library,
    albumsRootPath,
    photosRootPath,
    thumbnailsRootPath,
  });
};

//
// Application
//
const buildApplication = (
  { albumsRootPath, photosRootPath, thumbnailsRootPath, library },
  app
) => {
  app.use("/photos", express.static(photosRootPath));

  app.use("/thumbnails", express.static(thumbnailsRootPath));

  app.get(
    "/resized/:size(small|medium|large)/:year(\\d{4,4})/:month(\\d{2,2})/:day(\\d{2,2})/:filename.:extension",
    (req, res) => {
      const { size, year, month, day, filename, extension } = req.params;
      const requestedRelativePath = `${year}/${month}/${day}/${filename}.${extension}`;

      // finding a photo seems like a responsibility of the library
      const matchingPhoto = library.photos.filter(
        (p) => p.relativePath === requestedRelativePath
      );

      if (matchingPhoto.length === 0) {
        res.status(404).end();
      } else {
        generateResizedImage(photosRootPath, size, matchingPhoto[0])
          .then((resized) => {
            res.type(extension).send(resized).end();
          })
          .catch((err) => {
            console.error(err);
            res.send(500);
          });
      }
    }
  );

  app.get("/api/photos", (req, res) => {
    const photoJson = library.photos.map((p) => {
      return p.relativePath;
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(photoJson));
  });

  app.get("/api/albums", (req, res) => {
    const albumsJson = library.albums.map((a) => {
      return {
        id: a.id,
        name: a.name,
      };
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(albumsJson));
  });

  const validateNewAlbum = (albumPath, name) => {
    // path is not taken
    const absolutePath = path.join(albumsRootPath, albumPath);
    if (existsSync(absolutePath)) {
      return false;
    }

    // name is not empty
    if (name === "") {
      return false;
    }

    return true;
  };

  app.post("/api/albums", async (req, res) => {
    const path = req.body.path.trim();
    const name = req.body.name.trim();

    // Validate inputs
    if (!validateNewAlbum(path, name)) {
      res.setHeader("Content-Type", "application/json");
      res.status(401);
      res.send(JSON.stringify({ errors: ["validation error"] }));
      return;
    }

    // update library
    const album = await library.createAlbum(path, name);

    res.setHeader("Content-Type", "application/json");
    res.status(200);
    res.send(JSON.stringify(album));
  });

  app.get("/api/albums/:id", async (req, res) => {
    const id = req.params.id;
    const album = library.albums.find((a) => a.id === id);

    if (!album) {
      res.status(404);
      res.send("Not found");
      return;
    }

    const body = {
      id: album.id,
      name: album.name,
      photos: album.relativePhotoPaths,
      galleryType: album.galleryType,
      galleryOptions: album.galleryOptions,
    };
    res.setHeader("Content-Type", "application/json");
    res.status(200);
    res.send(JSON.stringify(body));
  });

  app.patch("/api/albums/:id", async (req, res) => {
    // TODO: Validate photos exist
    // TODO: update json
    // update library
    const album = await library.updateAlbum(req.params.id, req.body.photos);

    res.setHeader("Content-Type", "application/json");
    res.status(200);
    res.send(JSON.stringify(album));
  });

  app.delete("/api/albums/:id", async (req, res) => {
    library.deleteAlbum(req.params.id);

    res.setHeader("Content-Type", "application/json");
    res.status(200);
    res.send(true);
  });

  app.use("/", express.static(path.join(__dirname, "../../frontend/build/")));
  app.use(
    "/*",
    express.static(path.join(__dirname, "../../frontend/build/index.html"))
  );
};

//
// Configuration
//
const photosRootPath = path.resolve(process.env.PHOTOS_ROOT_PATH);
const thumbnailsRootPath = path.resolve(process.env.THUMBNAILS_ROOT_PATH);
const albumsRootPath = path.resolve(process.env.ALBUMS_ROOT_PATH);
const PORT = process.env.PORT || 3001;

//
// Bootstrap the application
//
loadApplicationState(photosRootPath, thumbnailsRootPath, albumsRootPath)
  .then((state) => {
    const app = express();
    app.use(express.json());

    buildApplication(state, app);

    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(`ERROR loading application: ${err.message}`);
  });
