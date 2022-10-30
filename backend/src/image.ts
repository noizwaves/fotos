const { mkdir } = require("fs").promises;
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

//
// Thumbnail sized images
//
const getThumbnailAbsolutePath = (thumbnailsRootPath, photo) => {
  return path.join(thumbnailsRootPath, photo.relativePath);
};

export const generateThumbnailFile = async (
  photosRootPath,
  thumbnailsRootPath,
  photo
) => {
  const finalPath = getThumbnailAbsolutePath(thumbnailsRootPath, photo);
  if (fs.existsSync(finalPath)) {
    return Promise.resolve();
  }

  await mkdir(path.dirname(finalPath), { recursive: true });

  const imagePath = path.join(photosRootPath, photo.relativePath);

  try {
    await sharp(imagePath)
      .resize(256, 256, { fit: "outside", withoutEnlargement: true })
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
// Normal sized images
//
const getNormalAbsolutePath = (normalsRootPath, photo) => {
  return path.join(normalsRootPath, photo.relativePath);
};

export const generateNormalFile = async (
  photosRootPath,
  normalsRootPath,
  photo
) => {
  const finalPath = getNormalAbsolutePath(normalsRootPath, photo);
  if (fs.existsSync(finalPath)) {
    return Promise.resolve();
  }

  await mkdir(path.dirname(finalPath), { recursive: true });

  const imagePath = path.join(photosRootPath, photo.relativePath);

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

export const generateResizedImage = async (photosRootPath, size, photo) => {
  const imagePath = path.join(photosRootPath, photo.relativePath);
  const { width, height } = resizeDimensions[size];

  return sharp(imagePath)
    .resize(width, height, { fit: "outside", withoutEnlargement: true })
    .withMetadata()
    .toBuffer();
};
