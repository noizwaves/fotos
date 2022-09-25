import { useState } from "react";
import { DateTime } from "luxon";
import { useParams } from "react-router-dom";

import { THUMBNAILS_ROOT, PHOTOS_ROOT } from "../Constants";
import { floorToWeek, groupBy } from "../Utilities";
import Showcase from "../Components/Showcase";

const SquareThumbnailContents = ({ photos, columns, setSelected }) => {
  return (
    <div className={`gallery gallery-${columns}`}>
      {photos.map((photo, k) => {
        const photosSrc = `${THUMBNAILS_ROOT}/${photo.path}`;
        return (
          <div key={k} className="photo">
            <img
              src={photosSrc}
              alt={photo.name}
              onClick={() => setSelected(photo)}
            />
          </div>
        );
      })}
    </div>
  );
};

const VerticalStripeContents = ({ photos, setSelected }) => {
  const MAX_STRIPES = 12;
  const MIN_STRIPES = 2;
  const numStripes = Math.max(
    MIN_STRIPES,
    Math.min(photos.length, MAX_STRIPES)
  );
  return (
    <div className={`vertical-strips vertical-strips-${numStripes}`}>
      {photos.map((photo, k) => {
        const photosSrc = `${PHOTOS_ROOT}/${photo.path}`;
        const style = {
          backgroundImage: `url('${photosSrc}')`,
        };
        return (
          <div
            key={k}
            className="photo"
            style={style}
            onClick={() => setSelected(photo)}
          ></div>
        );
      })}
    </div>
  );
};

const CalendarContents = ({ photos, setSelected }) => {
  const sortedDates = photos
    .map((p) => p.date)
    .sort((first, second) => first.localeCompare(second));

  const firstWeek = floorToWeek(
    DateTime.fromFormat(sortedDates[0], "yyyy-MM-dd")
  );
  const lastWeek = floorToWeek(
    DateTime.fromFormat(sortedDates[sortedDates.length - 1], "yyyy-MM-dd")
  );

  // Build a map of "date: photo"
  const photosMappedByDate = {};
  groupBy((p) => p.date, photos).forEach(({ key, items }) => {
    photosMappedByDate[key] = items[0]; // take the first
  });

  const calendar = [];
  let weekCursor = firstWeek;
  while (weekCursor <= lastWeek) {
    for (let i = 0; i <= 6; i++) {
      const date = weekCursor.plus({ days: i });
      const photo = photosMappedByDate[date.toFormat("yyyy-MM-dd")];
      calendar.push({ date, photo });
    }

    weekCursor = weekCursor.plus({ days: 7 });
  }

  const renderDay = ({ date, photo }, index) => {
    const formatStr =
      index === 0 || date.equals(date.startOf("month")) ? "LLL d" : "d";
    const photoElem = !photo ? (
      <></>
    ) : (
      <img
        src={`${THUMBNAILS_ROOT}/${photo.path}`}
        alt={photo.name}
        onClick={() => setSelected(photo)}
      />
    );

    const formattedDate = date.toFormat(formatStr);
    return (
      <div className="photo" key={formattedDate}>
        <span className="date">{formattedDate}</span>
        {photoElem}
      </div>
    );
  };

  return (
    <div className="gallery gallery-7 calendar">{calendar.map(renderDay)}</div>
  );
};

const AlbumContentsPage = ({ albums, columns }) => {
  let { albumId } = useParams();

  const [selected, setSelected] = useState(null);

  const getContentsComponent = (album) => {
    const galleryType = album.galleryType || "SquareThumbnails";

    switch (galleryType) {
      case "VerticalStripes":
        return VerticalStripeContents;
      case "Calendar":
        return CalendarContents;
      case "SquareThumbnails":
        return SquareThumbnailContents;
      default:
        console.error(`Unknown gallery type "${galleryType}"`);
        return SquareThumbnailContents;
    }
  };

  const renderPhotos = (album) => {
    const Contents = getContentsComponent(album);
    return (
      <div className="day-gallery">
        <h2>
          <span> {album.name}</span>
          <span className="actions">
            <a href={`/albums/${encodeURIComponent(album.id)}/edit`}>Edit</a>
          </span>
        </h2>
        <Contents
          photos={album.photos}
          columns={columns}
          setSelected={setSelected}
          galleryOptions={album.galleryOptions}
        />
      </div>
    );
  };

  const selectedAlbum = (albums || []).filter(
    (a) => a.id === decodeURIComponent(albumId)
  )[0];

  const handleNext = () => {
    const current = selectedAlbum.photos.indexOf(selected);

    if (current + 1 < selectedAlbum.photos.length) {
      setSelected(selectedAlbum.photos[current + 1]);
    }
  };

  const handlePrevious = () => {
    const current = selectedAlbum.photos.indexOf(selected);

    if (current > 0) {
      setSelected(selectedAlbum.photos[current - 1]);
    }
  };

  if (selectedAlbum) {
    return (
      <div
        tabIndex={4}
        style={{
          width: "100%",
          height: "calc(100vh - 3rem - 1px)",
          overflow: "scroll",
          scrollbarWidth: "none",
        }}
      >
        {renderPhotos(selectedAlbum)}
        <Showcase
          selected={selected}
          onUnselect={() => setSelected(null)}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>
    );
  } else {
    return <></>;
  }
};

export default AlbumContentsPage;
