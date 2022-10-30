import { PhotoLibrary } from "../../model/photolibrary";

const express = require("express");

export type ApiPhotoAppParams = {
  library: PhotoLibrary;
};

export const apiPhotoApp = ({ library }: ApiPhotoAppParams) => {
  const router = express.Router();

  router.get("/", (req, res) => {
    const photoJson = library.photos.map((p) => {
      return p.relativePath;
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(photoJson));
  });

  return router;
};
