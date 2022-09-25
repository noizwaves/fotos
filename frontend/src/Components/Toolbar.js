import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faImages,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

const Toolbar = ({
  inputRef,
  onGoToDate,
  onInputBlur,
  onInputFocus,
  onMinus,
  onPlus,
}) => {
  const [value, setValue] = useState("");

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
      <button className="button" onClick={onPlus}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
      <button className="button" onClick={onMinus}>
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
