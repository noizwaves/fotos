import { useRef, useState, useEffect } from "react";
import { CellMeasurerCache } from "react-virtualized";
import { Route, Switch, useHistory } from "react-router-dom";

import { MIN_COLUMNS, MAX_COLUMNS } from "./Constants";
import { groupBy } from "./Utilities";
import { fetchAlbums, fetchPhotos, updateAlbum } from "./API";

import Toolbar from "./Components/Toolbar";
import StreamPhotosByDayPage from "./Pages/StreamPhotosByDayPage";
import BrowseAlbumsPage from "./Pages/BrowseAlbumsPage";
import ViewAlbumPage from "./Pages/ViewAlbumPage";
import EditAlbumPage from "./Pages/EditAlbumPage";

import "./reset.css";
import "./App.css";

// Bootstrap application
const App = () => {
  const history = useHistory();

  const cache = useRef(
    new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 300,
    })
  );
  const list = useRef(null);
  const inputRef = useRef(null);
  const galleryRef = useRef(null);

  const resetCache = () => cache.current.clearAll();

  const [photosBy, setPhotosBy] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [columns, setColumns] = useState(6);
  const [inputting, setInputting] = useState(false);

  const [albums, setAlbums] = useState(null);
  const [rootFolder, setRootFolder] = useState(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState([]);

  useEffect(async () => {
    const photos = await fetchPhotos();
    setPhotos(photos);

    const photosBy = groupBy((p) => p.date, photos);
    photosBy.forEach(({ items }) => items.reverse());
    setPhotosBy(photosBy);
  }, []);

  useEffect(async () => {
    const { rootFolder, albums } = await fetchAlbums();
    setRootFolder(rootFolder);
    setAlbums(albums);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", resetCache);

    return () => {
      window.removeEventListener("resize", resetCache);
    };
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  const handleKeydown = (event) => {
    // TODO: don't trigger when showcase is displayed...
    if (!inputting) {
      if (event.keyCode === 173) {
        handleMinus();
      } else if (event.keyCode === 61) {
        handlePlus();
      } else if (event.keyCode === 71) {
        inputRef.current.focus();
        event.preventDefault();
      }
    }
  };

  const handleMinus = () => {
    // Already at minimum number of columns
    if (columns >= MAX_COLUMNS) {
      return;
    }

    // Clear the cache, so the next re-render generates new values
    resetCache();
    setColumns(columns + 1);
  };

  const handlePlus = () => {
    // Already at minimum number of columns
    if (columns <= MIN_COLUMNS) {
      return;
    }

    // Clear the cache, so the next re-render generates new values
    resetCache();
    setColumns(columns - 1);
  };

  const handleGoToDate = (value) => {
    const keys = photosBy.map(({ key }) => key);

    const focusOnList = () =>
      galleryRef.current.children[0].children[0].focus();

    if (value.length === 10) {
      // try an exact date match
      const row = keys.indexOf(value);

      if (row >= 0) {
        list.current.scrollToRow(row);
        focusOnList();
      } else {
        console.error(`date ${value} not found`);
      }
    } else if (value.length === 7) {
      // find the month
      const monthKeys = keys.filter((k) => k.startsWith(value));
      const monthKey = monthKeys[monthKeys.length - 1];

      if (monthKey && keys.indexOf(monthKey)) {
        list.current.scrollToRow(keys.indexOf(monthKey));
        focusOnList();
      } else {
        console.error(`month ${value} not found`);
      }
    } else if (value.length === 4) {
      // find the year
      const yearKeys = keys.filter((k) => k.startsWith(value));
      const yearKey = yearKeys[yearKeys.length - 1];

      if (yearKey && keys.indexOf(yearKey)) {
        list.current.scrollToRow(keys.indexOf(yearKey));
        focusOnList();
      } else {
        console.error(`year ${value} not found`);
      }
    }
  };

  const handleInputFocus = () => {
    setInputting(true);
    history.push("/");
  };

  const handleInputBlur = () => {
    setInputting(false);
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

        history.push(`/albums/${encodeURIComponent(album.id)}`);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <>
      <Toolbar
        inputRef={inputRef}
        list={list}
        onPlus={handlePlus}
        onMinus={handleMinus}
        onGoToDate={handleGoToDate}
        onInputBlur={handleInputBlur}
        onInputFocus={handleInputFocus}
      />
      <Switch>
        <Route path="/albums/:albumId/edit">
          <EditAlbumPage albums={albums} onUpdateAlbum={handleAlbumEdit} />
        </Route>
        <Route path="/albums/:albumId">
          <ViewAlbumPage columns={columns} albums={albums} />
        </Route>
        <Route path="/albums">
          <BrowseAlbumsPage
            rootFolder={rootFolder}
            expandedFolderIds={expandedFolderIds}
            toggleFolder={handleToggleFolder}
          />
        </Route>
        <Route path="/">
          <StreamPhotosByDayPage
            cache={cache}
            list={list}
            galleryRef={galleryRef}
            photosBy={photosBy}
            photos={photos}
            columns={columns}
          />
        </Route>
      </Switch>
    </>
  );
};

export default App;
