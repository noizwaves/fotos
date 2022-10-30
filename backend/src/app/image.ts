import { generateResizedImage } from "../image";

const express = require("express");

export const imageApp = ({
  photosRootPath,
  thumbnailsRootPath,
  normalsRootPath,
  library,
}) => {
  const router = express.Router();

  router.use("/photos", express.static(photosRootPath));

  router.use("/thumbnails", express.static(thumbnailsRootPath));

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

  return router;
};
