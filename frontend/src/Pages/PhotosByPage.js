import React from "react";
import { DateTime } from "luxon";
import { AutoSizer, CellMeasurer, List } from "react-virtualized";

import Showcase from "../Components/Showcase";
import { THUMBNAILS_ROOT } from "../Constants";

class CellDisplayedCache {
  _state = {};

  shouldDisplayCell(index, isVisible, isScrolling) {
    this._state[index] = this._state[index] || (isVisible && !isScrolling);
    return this._state[index];
  }
}

const PhotosByPage = ({
  cache,
  list,
  galleryRef,
  columns,
  photosBy,
  photos,
}) => {
  const [scrolling, setScrolling] = React.useState(false);
  const [selected, setSelected] = React.useState(null);

  // TODO: handle reset on plus/minus to clear cache
  // const cache = React.useRef(new CellMeasurerCache({
  //   fixedWidth: true,
  //   defaultHeight: 300,
  // }))
  // TODO: accept list so we can be scrolled to
  // const list = React.useRef(null)
  // TODO: accept galleryRef so we can be scrolled to
  // const galleryRef = React.useRef(null)

  const displayed = React.useRef(new CellDisplayedCache());
  const scrollingRef = React.useRef({ timeout: null });

  const handleNext = () => {
    const current = photos.indexOf(selected);

    if (current + 1 < photos.length) {
      setSelected(photos[current + 1]);
    }
  };

  const handlePrevious = () => {
    const current = photos.indexOf(selected);

    if (current > 0) {
      setSelected(photos[current - 1]);
    }
  };

  const renderGallery = ({
    key,
    index,
    style,
    parent,
    isScrolling,
    isVisible,
  }) => {
    const items = photosBy[index].items;
    const date = DateTime.fromFormat(
      photosBy[index].key,
      "yyyy-MM-dd"
    ).toLocaleString({
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const renderPhoto = displayed.current.shouldDisplayCell(
      index,
      isVisible,
      isScrolling
    );
    const photos = items.map((photo, k) => {
      const photosSrc = renderPhoto
        ? `${THUMBNAILS_ROOT}/${photo.path}`
        : "/placeholder.png";
      return (
        <div key={`${index}-${k}`} className="photo">
          <img
            src={photosSrc}
            alt={photo.name}
            onClick={() => setSelected(photo)}
          />
        </div>
      );
    });

    return (
      <CellMeasurer
        key={key}
        cache={cache.current}
        parent={parent}
        columnIndex={0}
        rowIndex={index}
      >
        <div className="day-gallery" style={style}>
          <h2>{date}</h2>
          <div className={`gallery gallery-${columns}`}>{photos}</div>
        </div>
      </CellMeasurer>
    );
  };

  const recordScrolling = () => {
    // ensure state knows we are definitely scrolling
    setScrolling(true);

    // restart the timeout that signifies scrolling has stopped
    window.clearTimeout(scrollingRef.current.timeout);
    scrollingRef.current.timeout = setTimeout(() => {
      setScrolling(false);
    }, 2000);
  };

  const renderGalleries = (width, height) => {
    return (
      <List
        ref={list}
        className={scrolling ? "galleries scrolling" : "galleries"}
        width={width}
        height={height}
        rowHeight={cache.current.rowHeight}
        deferredMeasurementCache={cache.current}
        rowCount={photosBy.length}
        rowRenderer={renderGallery}
        onScroll={recordScrolling}
        scrollToAlignment="start"
      />
    );
  };

  return (
    <div
      ref={galleryRef}
      tabIndex={4}
      style={{ width: "100%", height: "calc(100vh - 3rem - 1px)" }}
    >
      <AutoSizer>
        {({ width, height }) => {
          return renderGalleries(width, height);
        }}
      </AutoSizer>
      <Showcase
        selected={selected}
        onUnselect={() => setSelected(null)}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  );
};

export default PhotosByPage;
