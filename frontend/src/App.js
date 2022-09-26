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

  const handleGoToDate = (value) => {
    // const keys = photosBy.map(({ key }) => key);
    // const focusOnList = () =>
    //   galleryRef.current.children[0].children[0].focus();
    // if (value.length === 10) {
    //   // try an exact date match
    //   const row = keys.indexOf(value);
    //   if (row >= 0) {
    //     list.current.scrollToRow(row);
    //     focusOnList();
    //   } else {
    //     console.error(`date ${value} not found`);
    //   }
    // } else if (value.length === 7) {
    //   // find the month
    //   const monthKeys = keys.filter((k) => k.startsWith(value));
    //   const monthKey = monthKeys[monthKeys.length - 1];
    //   if (monthKey && keys.indexOf(monthKey)) {
    //     list.current.scrollToRow(keys.indexOf(monthKey));
    //     focusOnList();
    //   } else {
    //     console.error(`month ${value} not found`);
    //   }
    // } else if (value.length === 4) {
    //   // find the year
    //   const yearKeys = keys.filter((k) => k.startsWith(value));
    //   const yearKey = yearKeys[yearKeys.length - 1];
    //   if (yearKey && keys.indexOf(yearKey)) {
    //     list.current.scrollToRow(keys.indexOf(yearKey));
    //     focusOnList();
    //   } else {
    //     console.error(`year ${value} not found`);
    //   }
    // }
  };

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
      <Toolbar inputRef={inputRef} list={list} onGoToDate={handleGoToDate} />
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
