const express = require("express");

export const apiPhotoApp = ({ library }) => {
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
