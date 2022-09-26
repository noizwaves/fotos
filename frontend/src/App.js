import { useRef } from "react";
import { Route, Routes } from "react-router-dom";

import { PhotosProvider } from "./Providers/PhotosProvider";
import { ZoomLevelProvider } from "./Providers/ZoomLevelProvider";
import { AlbumsProvider } from "./Providers/AlbumsProvider";

import Toolbar from "./Components/Toolbar";
import StreamPhotosByDayPage from "./Pages/StreamPhotosByDayPage";
import BrowseAlbumsPage from "./Pages/BrowseAlbumsPage";
import ViewAlbumPage from "./Pages/ViewAlbumPage";
import EditAlbumPage from "./Pages/EditAlbumPage";

import "./reset.css";
import "./App.css";

// Bootstrap application
const App = () => {
  const list = useRef(null);
  const inputRef = useRef(null);
  const galleryRef = useRef(null);

  const withProviders = (children) => {
    return (
      <PhotosProvider>
        <AlbumsProvider>
          <ZoomLevelProvider>{children}</ZoomLevelProvider>
        </AlbumsProvider>
      </PhotosProvider>
    );
  };

  return withProviders(
    <>
      <Toolbar inputRef={inputRef} list={list} galleryRef={galleryRef} />
      <Routes>
        <Route path="/albums/:albumId/edit" element={<EditAlbumPage />} />
        <Route path="/albums/:albumId" element={<ViewAlbumPage />} />
        <Route path="/albums" element={<BrowseAlbumsPage />} />
        <Route
          path="/"
          element={
            <StreamPhotosByDayPage list={list} galleryRef={galleryRef} />
          }
        />
      </Routes>
    </>
  );
};

export default App;
