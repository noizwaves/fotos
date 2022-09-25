import { createContext, useEffect, useState } from "react";

import { groupBy } from "../Utilities";
import { fetchPhotos } from "../API";

export const PhotosContext = createContext();

export const PhotosProvider = ({ children }) => {
  const [photosBy, setPhotosBy] = useState([]);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    async function fetch() {
      const photos = await fetchPhotos();
      setPhotos(photos);

      const photosBy = groupBy((p) => p.date, photos);
      photosBy.forEach(({ items }) => items.reverse());
      setPhotosBy(photosBy);
    }
    fetch();
  }, []);

  return (
    <PhotosContext.Provider value={{ photos, photosBy }}>
      {children}
    </PhotosContext.Provider>
  );
};
