import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

import { useSessionState } from "../Utilities";
import { fetchAlbums } from "../API";

const BrowseAlbums = ({ rootFolder }) => {
  const [expandedFolderIds, setExpandedFolderIds] = useSessionState(
    [],
    "expandedFolderIds"
  );

  const urlSafe = (id) => {
    return encodeURIComponent(id);
  };

  const toggleFolder = (id) => {
    if (expandedFolderIds.indexOf(id) >= 0) {
      setExpandedFolderIds(expandedFolderIds.filter((eid) => eid !== id));
    } else {
      setExpandedFolderIds(expandedFolderIds.concat([id]));
    }
  };

  const albumOrFolder = (item) => {
    if (item.contents) {
      if (expandedFolderIds.indexOf(item.id) >= 0) {
        return (
          <div className="folder" key={item.id}>
            <span className="toggle">
              <FontAwesomeIcon
                icon={faCaretDown}
                onClick={() => toggleFolder(item.id)}
              />
            </span>
            <span className="name" onClick={() => toggleFolder(item.id)}>
              {item.name}
            </span>
            <div className="contents">
              {item.contents.map(albumOrFolder, expandedFolderIds)}
            </div>
          </div>
        );
      } else {
        return (
          <div className="folder" key={item.id}>
            <span className="toggle">
              <FontAwesomeIcon
                icon={faCaretRight}
                onClick={() => toggleFolder(item.id)}
              />
            </span>
            <span className="name" onClick={() => toggleFolder(item.id)}>
              {item.name}
            </span>
          </div>
        );
      }
    } else {
      return (
        <div className="album" key={item.id}>
          <Link to={"/albums/" + urlSafe(item.id)} className="name">
            {item.name}
          </Link>
        </div>
      );
    }
  };

  return (
    <div>
      <h2>
        <span>Albums</span>
        <span className="actions">
          <Link to={`/albums/new`}>Create</Link>
        </span>
      </h2>
      <div className="album-browser">
        {rootFolder !== null
          ? rootFolder.contents.map(albumOrFolder, expandedFolderIds)
          : null}
      </div>
    </div>
  );
};

const BrowseAlbumsPage = () => {
  const [rootFolder, setRootFolder] = useState(null);

  useEffect(() => {
    fetchAlbums().then(({ rootFolder }) => {
      setRootFolder(rootFolder);
    });
  }, []);

  if (rootFolder === null) {
    return <div>Loading...</div>;
  }

  return <BrowseAlbums rootFolder={rootFolder} />;
};

export default BrowseAlbumsPage;
