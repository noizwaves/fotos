import { useEffect } from "react";

import {
  PHOTOS_ROOT,
  SMALL_ROOT,
  MEDIUM_ROOT,
  LARGE_ROOT,
  NORMALS_ROOT,
} from "../Constants";

const Showcase = ({ selected, onUnselect, onNext, onPrevious }) => {
  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.keyCode === 37) {
        onPrevious();
      } else if (event.keyCode === 39) {
        onNext();
      } else if (event.keyCode === 27) {
        onUnselect();
      }
    };

    if (selected !== null) {
      window.addEventListener("keydown", handleKeydown);
      return () => {
        window.removeEventListener("keydown", handleKeydown);
      };
    }
  });

  if (!selected) {
    return null;
  }

  const preventDefault = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="showcase" onClick={onUnselect}>
      <img src={`${NORMALS_ROOT}/${selected.path}`} alt={selected.name} />
      <div className="links">
        <a
          href={`${SMALL_ROOT}/${selected.path}`}
          onClick={preventDefault}
          target="_blank"
          rel="noopener noreferrer"
        >
          Small
        </a>{" "}
        |{" "}
        <a
          href={`${MEDIUM_ROOT}/${selected.path}`}
          onClick={preventDefault}
          target="_blank"
          rel="noopener noreferrer"
        >
          Medium
        </a>{" "}
        |{" "}
        <a
          href={`${LARGE_ROOT}/${selected.path}`}
          onClick={preventDefault}
          target="_blank"
          rel="noopener noreferrer"
        >
          Large
        </a>{" "}
        |{" "}
        <a
          href={`${PHOTOS_ROOT}/${selected.path}`}
          onClick={preventDefault}
          target="_blank"
          rel="noopener noreferrer"
        >
          Original
        </a>
      </div>
    </div>
  );
};

export default Showcase;
