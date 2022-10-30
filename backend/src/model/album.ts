import { PHOTO_REGEX } from "./photo";

const { writeFile } = require("fs").promises;
const { existsSync, mkdirSync, rmSync } = require("fs");
const fs = require("fs");
const path = require("path");

const ensureNull = (obj) => {
  if (obj === undefined) {
    return null;
  }

  return obj;
};

export const ALBUM_REGEX = new RegExp(".json$");

export class Album {
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
