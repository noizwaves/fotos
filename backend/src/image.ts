const { mkdir } = require("fs").promises;
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const THUMBNAILS_V2_SIZES = [
  { width: 200 },
  { width: 400 },
  { width: 600 },
  { width: 800 },
];

//
// Thumbnail sized images
//
const getThumbnailAbsolutePath = (thumbnailsV2RootPath, photo, width) => {
  return path.join(thumbnailsV2RootPath, `${width}`, photo.relativePath);
};

export const generateThumbnailSizedFile = async (
  originalsRootPath,
  thumbnailsV2RootPath,
  photo,
  width
) => {
  const finalPath = getThumbnailAbsolutePath(
    thumbnailsV2RootPath,
    photo,
    width
  );
  if (fs.existsSync(finalPath)) {
    return Promise.resolve();
  }

  await mkdir(path.dirname(finalPath), { recursive: true });

  const imagePath = path.join(originalsRootPath, photo.relativePath);

  try {
    await sharp(imagePath)
      .jpeg({ quality: 50, progressive: true })
      .resize(width, width, { fit: "outside", withoutEnlargement: true })
      .withMetadata()
      .toFile(finalPath);
  } catch (err) {
    console.log(`Error with ${imagePath} and width ${width}: ${err.message}`);
    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
    }
  }
  return Promise.resolve();
};

export const generateThumbnailFiles = async (
  originalsRootPath,
  thumbnailsV2RootPath,
  photo
) => {
  return Promise.all(
    THUMBNAILS_V2_SIZES.map(({ width }) =>
      generateThumbnailSizedFile(
        originalsRootPath,
        thumbnailsV2RootPath,
        photo,
        width
      )
    )
  );
};
//
// Normal sized images
//
const getNormalAbsolutePath = (normalsRootPath, photo) => {
  return path.join(normalsRootPath, photo.relativePath);
};

export const generateNormalFile = async (
  originalsRootPath,
  normalsRootPath,
  photo
) => {
  const finalPath = getNormalAbsolutePath(normalsRootPath, photo);
  if (fs.existsSync(finalPath)) {
    return Promise.resolve();
  }

  await mkdir(path.dirname(finalPath), { recursive: true });

  const imagePath = path.join(originalsRootPath, photo.relativePath);

  try {
    await sharp(imagePath)
      .resize(768, 768, { fit: "outside", withoutEnlargement: true })
      .withMetadata()
      .toFile(finalPath);
  } catch (err) {
    console.log(`Error with ${imagePath}: ${err.message}`);
    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
    }
  }
  return Promise.resolve();
};

//
// Dynamically (re)sized images
//
const resizeDimensions = {
  small: { width: 512, height: 384 },
  medium: { width: 1024, height: 768 },
  large: { width: 2048, height: 1536 },
};

export const generateResizedImage = async (originalsRootPath, size, photo) => {
  const imagePath = path.join(originalsRootPath, photo.relativePath);
  const { width, height } = resizeDimensions[size];

  return sharp(imagePath)
    .resize(width, height, { fit: "outside", withoutEnlargement: true })
    .withMetadata()
    .toBuffer();
};
