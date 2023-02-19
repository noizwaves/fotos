import { generateResizedImage } from "../image";
import { PhotoLibrary } from "../model/photolibrary";

const express = require("express");

export type ImageAppParams = {
  originalsRootPath: string;
  thumbnailsV2RootPath: string;
  normalsRootPath: string;
  library: PhotoLibrary;
};

export const imageApp = ({
  originalsRootPath,
  thumbnailsV2RootPath,
  normalsRootPath,
  library,
}: ImageAppParams) => {
  const router = express.Router();

  router.use("/originals", express.static(originalsRootPath));

  router.use("/thumbnails_v2", express.static(thumbnailsV2RootPath));

  router.use("/normals", express.static(normalsRootPath));

  router.get(
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
        generateResizedImage(originalsRootPath, size, matchingPhoto[0])
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

  return router;
};
