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
const buildApplication = (
  {
    albumsRootPath,
    photosRootPath,
    normalsRootPath,
    thumbnailsRootPath,
    library,
  },
  app
) => {
  imageApp(
    { photosRootPath, normalsRootPath, thumbnailsRootPath, library },
    app
  );
  apiPhotoApp({ library }, app);
  apiAlbumApp({ albumsRootPath, library }, app);

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
