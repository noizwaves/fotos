import { useRef, useState, useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

import { fetchAlbums, updateAlbum } from "./API";
import { PhotosProvider } from "./Providers/PhotosProvider";
import { ZoomLevelProvider } from "./Providers/ZoomLevelProvider";

import Toolbar from "./Components/Toolbar";
import StreamPhotosByDayPage from "./Pages/StreamPhotosByDayPage";
import BrowseAlbumsPage from "./Pages/BrowseAlbumsPage";
import ViewAlbumPage from "./Pages/ViewAlbumPage";
import EditAlbumPage from "./Pages/EditAlbumPage";

import "./reset.css";
import "./App.css";

// Bootstrap application
const App = () => {
  const navigate = useNavigate();

  const list = useRef(null);
  const inputRef = useRef(null);
  const galleryRef = useRef(null);

  const [albums, setAlbums] = useState(null);
  const [rootFolder, setRootFolder] = useState(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState([]);

  useEffect(() => {
    async function fetch() {
      const { rootFolder, albums } = await fetchAlbums();
      setRootFolder(rootFolder);
      setAlbums(albums);
    }
    fetch();
  }, []);

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

  const handleToggleFolder = (id) => {
    if (expandedFolderIds.indexOf(id) >= 0) {
      setExpandedFolderIds(expandedFolderIds.filter((eid) => eid !== id));
    } else {
      setExpandedFolderIds(expandedFolderIds.concat([id]));
    }
  };

  const handleAlbumEdit = (album, newPhotos) => {
    const photoPaths = newPhotos.map((p) => p.path);
    updateAlbum(album.id, photoPaths)
      .then((_) => {
        // Reload album by fetching ALL albums
        // TODO: use updated album in response to update just single album
        fetchAlbums().then(({ rootFolder, albums }) => {
          setRootFolder(rootFolder);
          setAlbums(albums);
        });

        navigate(`/albums/${encodeURIComponent(album.id)}`);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <PhotosProvider>
      <ZoomLevelProvider>
        <Toolbar inputRef={inputRef} list={list} onGoToDate={handleGoToDate} />
        <Routes>
          <Route
            path="/albums/:albumId/edit"
            element={
              <EditAlbumPage albums={albums} onUpdateAlbum={handleAlbumEdit} />
            }
          ></Route>
          <Route
            path="/albums/:albumId"
            element={<ViewAlbumPage albums={albums} />}
          ></Route>
          <Route
            path="/albums"
            element={
              <BrowseAlbumsPage
                rootFolder={rootFolder}
                expandedFolderIds={expandedFolderIds}
                toggleFolder={handleToggleFolder}
              />
            }
          ></Route>
          <Route
            path="/"
            element={
              <StreamPhotosByDayPage list={list} galleryRef={galleryRef} />
            }
          ></Route>
        </Routes>
      </ZoomLevelProvider>
    </PhotosProvider>
  );
};

export default App;
