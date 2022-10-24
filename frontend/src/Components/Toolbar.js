import { useState, useContext, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderTree,
  faFolderPlus,
  faBan,
  faImages,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

import { ZoomLevelContext } from "../Providers/ZoomLevelProvider";
import { PhotosContext } from "../Providers/PhotosProvider";
import { CheckedContext } from "../Providers/CheckedProvider";

const Toolbar = ({ list, inputRef, galleryRef }) => {
  const [value, setValue] = useState("");

  const navigate = useNavigate();
  const { plus, minus } = useContext(ZoomLevelContext);
  const { photosBy } = useContext(PhotosContext);
  const { anyChecked, resetChecked } = useContext(CheckedContext);

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  const onGoToDate = (value) => {
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

  const onInputFocus = () => {
    navigate("/");
  };

  const handleKeydown = (event) => {
    // ignore keydowns to an <input>
    if (event.target instanceof HTMLInputElement) {
      return;
    }

    if (event.code === "Minus") {
      minus();
    } else if (event.code === "Equal") {
      plus();
    } else if (event.code === "KeyG") {
      inputRef.current.focus();
      event.preventDefault();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onGoToDate(value);
    setValue("");
  };

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const navLinkClasses = ({ isActive }) =>
    isActive ? "button selected" : "button";

  const onAddToAlbum = () => {
    if (anyChecked()) {
      navigate("/add-to-album");
    }
  };
  const addToAlbumClasses = anyChecked() ? "button" : "button disabled";

  return (
    <div className="toolbar">
      <button className="button" onClick={() => plus()}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
      <button className="button" onClick={() => minus()}>
        <FontAwesomeIcon icon={faMinus} />
      </button>
      <NavLink to="/" className={navLinkClasses} end>
        <FontAwesomeIcon icon={faImages} />
      </NavLink>
      <NavLink to="/albums" className={navLinkClasses}>
        <FontAwesomeIcon icon={faFolderTree} />
      </NavLink>
      <div className="group">
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            onFocus={onInputFocus}
            value={value}
            placeholder="YYYY, YYYY-MM, or YYYY-MM-DD"
            onChange={handleChange}
          />
        </form>
      </div>
      <div className="group">
        <span className={addToAlbumClasses} onClick={() => onAddToAlbum()}>
          <FontAwesomeIcon icon={faFolderPlus} />
        </span>
        <span className={addToAlbumClasses} onClick={() => resetChecked()}>
          <FontAwesomeIcon icon={faBan} />
        </span>
      </div>
    </div>
  );
};

export default Toolbar;
