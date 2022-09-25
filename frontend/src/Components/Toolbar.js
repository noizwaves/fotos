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

const Toolbar = ({ inputRef, onGoToDate }) => {
  const [value, setValue] = useState("");
  const [inputting, setInputting] = useState(false);

  const navigate = useNavigate();
  const { plus, minus } = useContext(ZoomLevelContext);

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  const onInputFocus = () => {
    setInputting(true);
    navigate("/");
  };

  const onInputBlur = () => {
    setInputting(false);
  };

  const handleKeydown = (event) => {
    // TODO: don't trigger when showcase is displayed...
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
