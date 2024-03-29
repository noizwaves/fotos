import { createContext, useState, useRef } from "react";
import { CellMeasurerCache } from "react-virtualized";

import { MIN_COLUMNS, MAX_COLUMNS } from "../Constants";

const DEFAULT_COLUMNS = 6;

const initialColumns = () => {
  if (typeof window === "undefined") {
    return DEFAULT_COLUMNS;
  }

  const windowWidth = window.innerWidth;
  if (windowWidth <= 480) {
    return 4;
  } else if (windowWidth <= 800) {
    return 5;
  } else if (windowWidth <= 1280) {
    return 6;
  } else {
    return 8;
  }
};

export const ZoomLevelContext = createContext();

export const ZoomLevelProvider = ({ children }) => {
  const [columns, setColumns] = useState(initialColumns());

  // FIX: put CellMeasurerCache here until find better place for it
  const cache = useRef(
    new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 300,
    })
  );

  const minus = () => {
    // Already at minimum number of columns
    if (columns >= MAX_COLUMNS) {
      return;
    }

    // Clear the cache, so the next re-render generates new values
    cache.current.clearAll();
    setColumns(columns + 1);
  };

  const plus = () => {
    // Already at minimum number of columns
    if (columns <= MIN_COLUMNS) {
      return;
    }

    // Clear the cache, so the next re-render generates new values
    cache.current.clearAll();
    setColumns(columns - 1);
  };

  return (
    <ZoomLevelContext.Provider value={{ columns, cache, minus, plus }}>
      {children}
    </ZoomLevelContext.Provider>
  );
};
