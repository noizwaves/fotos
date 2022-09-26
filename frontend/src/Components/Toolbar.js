import { useState, useContext, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faImages,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

import { ZoomLevelContext } from "../Providers/ZoomLevelProvider";
import { PhotosContext } from "../Providers/PhotosProvider";

const Toolbar = ({ list, inputRef, galleryRef }) => {
  const [value, setValue] = useState("");
  const [inputting, setInputting] = useState(false);

  const navigate = useNavigate();
  const { plus, minus } = useContext(ZoomLevelContext);
  const { photosBy } = useContext(PhotosContext);

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
    setInputting(true);
    navigate("/");
  };

  const onInputBlur = () => {
    setInputting(false);
  };

  const handleKeydown = (event) => {
    // don't trigger when showcase is displayed...
    if (!inputting) {
      if (event.keyCode === 173) {
        minus();
      } else if (event.keyCode === 61) {
        plus();
      } else if (event.keyCode === 71) {
        inputRef.current.focus();
        event.preventDefault();
      }
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
        <FontAwesomeIcon icon={faFolder} />
      </NavLink>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          value={value}
          placeholder="YYYY, YYYY-MM, or YYYY-MM-DD"
          onChange={handleChange}
        />
      </form>
    </div>
  );
};

export default Toolbar;
