import { PhotoLibrary } from "./model/photolibrary";

import { imageApp } from "./app/image";
import { apiPhotoApp } from "./app/api/photo";
import { apiAlbumApp } from "./app/api/album";

const express = require("express");
const path = require("path");

//
// Application state
//
const loadApplicationState = async (
  photosRootPath,
  thumbnailsRootPath,
  normalsRootPath,
  albumsRootPath
) => {
  const library = new PhotoLibrary(
    photosRootPath,
    thumbnailsRootPath,
    normalsRootPath,
    albumsRootPath
  );
  await library.init();
  library.startWatch();

  return Promise.resolve({
    library,
    albumsRootPath,
    photosRootPath,
    thumbnailsRootPath,
    normalsRootPath,
  });
};

//
// Application
//
const buildApp = ({
  albumsRootPath,
  photosRootPath,
  normalsRootPath,
  thumbnailsRootPath,
  library,
}) => {
  const app = express();
  app.use(express.json());

  app.use(
    "/",
    imageApp({ photosRootPath, normalsRootPath, thumbnailsRootPath, library })
  );
  app.use("/api/photos", apiPhotoApp({ library }));
  app.use("/api/albums", apiAlbumApp({ albumsRootPath, library }));

  app.use("/", express.static(path.join(__dirname, "../../frontend/build/")));
  app.use(
    "/*",
    express.static(path.join(__dirname, "../../frontend/build/index.html"))
  );

  return app;
};

//
// Configuration
//
const photosRootPath = path.resolve(process.env.PHOTOS_ROOT_PATH);
const thumbnailsRootPath = path.resolve(process.env.THUMBNAILS_ROOT_PATH);
const normalsRootPath = path.resolve(process.env.NORMALS_ROOT_PATH);
const albumsRootPath = path.resolve(process.env.ALBUMS_ROOT_PATH);
const PORT = process.env.PORT || 3001;

//
// Bootstrap the application
//
loadApplicationState(
  photosRootPath,
  thumbnailsRootPath,
  normalsRootPath,
  albumsRootPath
)
  .then((state) => {
    const app = buildApp(state);

    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(`ERROR loading application: ${err.message}`);
  });
