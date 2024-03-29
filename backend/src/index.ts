import { PhotoLibrary } from "./model/photolibrary";

import { imageApp } from "./app/image";
import { apiPhotoApp } from "./app/api/photo";
import { apiAlbumApp } from "./app/api/album";

const express = require("express");
const path = require("path");

type Config = {
  originalsRootPath: string;
  thumbnailsV2RootPath: string;
  normalsRootPath: string;
  albumsRootPath: string;

  port: number;
};

type State = {
  library: PhotoLibrary;
};

const buildConfig = (): Config => {
  return {
    originalsRootPath: path.resolve(process.env.ORIGINALS_ROOT_PATH),
    thumbnailsV2RootPath: path.resolve(process.env.THUMBNAILS_V2_ROOT_PATH),
    normalsRootPath: path.resolve(process.env.NORMALS_ROOT_PATH),
    albumsRootPath: path.resolve(process.env.ALBUMS_ROOT_PATH),
    port: (process.env.PORT && parseInt(process.env.PORT)) || 3001,
  };
};

const buildState = async (config: Config): Promise<State> => {
  const library = new PhotoLibrary(
    config.originalsRootPath,
    config.thumbnailsV2RootPath,
    config.normalsRootPath,
    config.albumsRootPath
  );
  await library.init();
  library.startWatch();

  return {
    library,
  };
};

const buildApp = (config: Config, state: State) => {
  const { library } = state;
  const app = express();
  app.use(express.json());

  app.use("/images", imageApp({ ...config, library }));
  app.use("/api/photos", apiPhotoApp({ ...config, library }));
  app.use("/api/albums", apiAlbumApp({ ...config, library }));

  app.use("/", express.static(path.join(__dirname, "../../frontend/build/")));
  app.use(
    "/*",
    express.static(path.join(__dirname, "../../frontend/build/index.html"))
  );

  return app;
};

//
// Bootstrap the application
//
const bootstrap = async () => {
  const config = buildConfig();
  const state = await buildState(config);
  const app = buildApp(config, state);

  app.listen(config.port, () => {
    console.log(`Server is listening on port ${config.port}`);
  });
};

bootstrap().then(() => {});
