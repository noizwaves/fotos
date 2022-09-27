import { createContext, useEffect, useState } from "react";

import { fetchAlbums } from "../API";

export const AlbumsContext = createContext();

export const AlbumsProvider = ({ children }) => {
  const [albums, setAlbums] = useState(null);
  const [rootFolder, setRootFolder] = useState(null);

  const reloadAlbums = async () => {
    const { rootFolder, albums } = await fetchAlbums();
    setRootFolder(rootFolder);
    setAlbums(albums);
  };

  useEffect(() => {
    reloadAlbums();
  }, []);

  return (
    <AlbumsContext.Provider value={{ rootFolder, albums, reloadAlbums }}>
      {children}
    </AlbumsContext.Provider>
  );
};
