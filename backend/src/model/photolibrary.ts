import { generateNormalFile, generateThumbnailFile } from "../image";
import { getFiles } from "../utils";
import { Album, ALBUM_REGEX } from "./album";
import { Photo, PHOTO_REGEX } from "./photo";

const { relative } = require("path");
const fs = require("fs");
const chokidar = require("chokidar");

export class PhotoLibrary {
  private originalsRootPath: any;
  private thumbnailsRootPath: any;
  private albumsRootPath: any;
  private normalsRootPath: string;
  private _photos: any;
  private _albums: any;

  constructor(
    originalsRootPath,
    thumbnailsRootPath,
    normalsRootPath,
    albumsRootPath
  ) {
    this.originalsRootPath = originalsRootPath;
    this.thumbnailsRootPath = thumbnailsRootPath;
    this.normalsRootPath = normalsRootPath;
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
    const files = await getFiles(this.originalsRootPath);

    this._photos = files
      .map((absPath) => relative(this.originalsRootPath, absPath))
      .filter((path) => PHOTO_REGEX.test(path))
      .map((path) => new Photo(path));
    this._photos.sort((p1, p2) =>
      p2.relativePath.localeCompare(p1.relativePath)
    );

    console.log(`Found ${this.photos.length} photos, generating thumbnails...`);
    await Promise.all(
      this.photos.map((p) =>
        generateThumbnailFile(
          this.originalsRootPath,
          this.thumbnailsRootPath,
          p
        )
      )
    );
    console.log("Thumbnails generated");

    console.log(`Found ${this.photos.length} photos, generating normals...`);
    await Promise.all(
      this.photos.map((p) =>
        generateNormalFile(this.originalsRootPath, this.normalsRootPath, p)
      )
    );
    console.log("Normals generated");

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
      .watch(this.originalsRootPath, {
        ignoreInitial: true,
        usePolling: false,
        interval: 5000,
      })
      .on("add", async (path) => {
        console.log(`Detected new file: ${path}`);
        const addedPhotos = [path]
          .map((absPath) => relative(this.originalsRootPath, absPath))
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
              this.originalsRootPath,
              this.thumbnailsRootPath,
              p
            )
          )
        );

        await Promise.all(
          addedPhotos.map((p) =>
            generateNormalFile(this.originalsRootPath, this.normalsRootPath, p)
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

    await newAlbum.writeToDisk(this.albumsRootPath);

    return newAlbum;
  }

  deleteAlbum(id: any) {
    const index = this._albums.findIndex((a) => a.id === id);
    if (index > -1) {
      const album: Album = this._albums[index];
      this._albums.splice(index, 1);

      album.deleteFromDisk(this.albumsRootPath);
    }
  }

  async createAlbum(path: string, name: string) {
    const newAlbum = new Album(path, name, [], null, null);

    // update state immediately as file detection isn't instantaneous
    this._albums.push(newAlbum);

    await newAlbum.writeToDisk(this.albumsRootPath);

    return newAlbum;
  }
}
