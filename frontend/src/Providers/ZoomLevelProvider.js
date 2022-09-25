import { createContext, useState, useRef } from "react";
import { CellMeasurerCache } from "react-virtualized";

import { MIN_COLUMNS, MAX_COLUMNS } from "../Constants";

export const ZoomLevelContext = createContext();

export const ZoomLevelProvider = ({ children }) => {
  const [columns, setColumns] = useState(6);

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
