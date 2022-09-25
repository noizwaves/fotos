import React from "react";
import axios from "axios";
import { CellMeasurerCache } from "react-virtualized";
import { Route, Switch, useHistory } from "react-router-dom";

import { MIN_COLUMNS, MAX_COLUMNS } from "./Constants";
import { groupBy } from "./Utilities";
import Toolbar from "./Components/Toolbar";
import PhotosByPage from "./Pages/PhotosByPage";
import AlbumBrowserPage from "./Pages/AlbumBrowserPage";
import AlbumContentsPage from "./Pages/AlbumContentsPage";
import EditAlbumPage from "./Pages/EditAlbumPage";

import "./reset.css";
import "./App.css";

// Gallery viewing components

const makePhoto = (path) => {
  return {
    path: path,
    name: path.split("/")[3],
    date: path.split("/").splice(0, 3).join("-"),
  };
};

// Bootstrap application
const App = () => {
  const history = useHistory();

  const cache = React.useRef(
    new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 300,
    })
  );
  const list = React.useRef(null);
  const inputRef = React.useRef(null);
  const galleryRef = React.useRef(null);

  const resetCache = () => cache.current.clearAll();

  const [photosBy, setPhotosBy] = React.useState([]);
  const [photos, setPhotos] = React.useState([]);
  const [columns, setColumns] = React.useState(6);
  const [inputting, setInputting] = React.useState(false);

  const [albums, setAlbums] = React.useState(null);
  const [rootFolder, setRootFolder] = React.useState(null);
  const [expandedFolderIds, setExpandedFolderIds] = React.useState([]);

  React.useEffect(() => {
    axios.get("/api/photos").then((response) => {
      const paths = response.data;
      const photos = paths.map(makePhoto);
      setPhotos(photos);

      const photosBy = groupBy((p) => p.date, photos);
      photosBy.forEach(({ items }) => items.reverse());
      setPhotosBy(photosBy);
    });
  }, []);

  const fetchAlbums = () => {
    axios.get("/api/albums").then((response) => {
      const albums = response.data.map((album) => {
        return { ...album, photos: album.photos.map(makePhoto) };
      });

      const rootFolder = { name: "Root Folder", id: "/", contents: [] };

      albums.forEach((album) => {
        // create folders for this album
        const folderNames = album.id.split("/");

        let current = rootFolder;

        for (let i = 0; i < folderNames.length - 1; i++) {
          const folderName = folderNames[i];
          const existing = current.contents.find(
            (item) => item.contents && item.name === folderName
          );
          if (existing) {
            current = existing;
          } else {
            const newFolder = {
              id: `${current.id}${folderName}/`,
              name: folderName,
              contents: [],
            };
            current.contents.push(newFolder);
            current = newFolder;
          }
        }

        // put album in folder
        current.contents.push(album);
      });

      setRootFolder(rootFolder);
      setAlbums(albums);
    });
  };

  React.useEffect(() => {
    axios.get("/api/albums").then((response) => {
      const albums = response.data.map((album) => {
        return { ...album, photos: album.photos.map(makePhoto) };
      });

      const rootFolder = { name: "Root Folder", id: "/", contents: [] };

      albums.forEach((album) => {
        // create folders for this album
        const folderNames = album.id.split("/");

        let current = rootFolder;

        for (let i = 0; i < folderNames.length - 1; i++) {
          const folderName = folderNames[i];
          const existing = current.contents.find(
            (item) => item.contents && item.name === folderName
          );
          if (existing) {
            current = existing;
          } else {
            const newFolder = {
              id: `${current.id}${folderName}/`,
              name: folderName,
              contents: [],
            };
            current.contents.push(newFolder);
            current = newFolder;
          }
        }

        // put album in folder
        current.contents.push(album);
      });

      setRootFolder(rootFolder);
      setAlbums(albums);
    });
  }, []);

  React.useEffect(() => {
    window.addEventListener("resize", resetCache);

    return () => {
      window.removeEventListener("resize", resetCache);
    };
  }, []);

  React.useEffect(() => {
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
    const body = {
      photos: newPhotos.map((p) => p.path),
    };
    axios
      .patch(`/api/albums/${encodeURIComponent(album.id)}`, body)
      .then((_) => {
        // Reload album by fetching ALL albums
        // TODO: use updated album in response to update just single album
        fetchAlbums();

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
          <AlbumContentsPage columns={columns} albums={albums} />
        </Route>
        <Route path="/albums">
          <AlbumBrowserPage
            rootFolder={rootFolder}
            expandedFolderIds={expandedFolderIds}
            toggleFolder={handleToggleFolder}
          />
        </Route>
        <Route path="/">
          <PhotosByPage
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
