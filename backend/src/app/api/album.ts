const express = require("express");
const { existsSync } = require("fs");
const path = require("path");

export const apiAlbumApp = ({ albumsRootPath, library }) => {
  const router = express.Router();

  router.get("/api/albums", (req, res) => {
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

  router.post("/api/albums", async (req, res) => {
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

  router.get("/api/albums/:id", async (req, res) => {
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

  router.patch("/api/albums/:id", async (req, res) => {
    // TODO: Validate photos exist
    // TODO: update json
    // update library
    const album = await library.updateAlbum(req.params.id, req.body.photos);

    res.setHeader("Content-Type", "application/json");
    res.status(200);
    res.send(JSON.stringify(album));
  });

  router.delete("/api/albums/:id", async (req, res) => {
    library.deleteAlbum(req.params.id);

    res.setHeader("Content-Type", "application/json");
    res.status(200);
    res.send(true);
  });

  return router;
};
