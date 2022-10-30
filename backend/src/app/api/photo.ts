export const apiPhotoApp = ({ library }, app) => {
  app.get("/api/photos", (req, res) => {
    const photoJson = library.photos.map((p) => {
      return p.relativePath;
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(photoJson));
  });
};
