import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const AlbumBrowserPage = ({ rootFolder, expandedFolderIds, toggleFolder }) => {
  const urlSafe = (id) => {
    return encodeURIComponent(id);
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
    <div className="album-browser">
      {rootFolder !== null
        ? rootFolder.contents.map(albumOrFolder, expandedFolderIds)
        : null}
    </div>
  );
};

export default AlbumBrowserPage;
