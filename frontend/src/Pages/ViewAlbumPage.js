import { useContext, useState, useEffect } from "react";
import { DateTime } from "luxon";
import { Link, useParams } from "react-router-dom";

import { ORIGINALS_ROOT } from "../Constants";
import { floorToWeek, groupBy } from "../Utilities";
import Showcase from "../Components/Showcase";
import Thumbnail from "../Components/Thumbnail";
import { ZoomLevelContext } from "../Providers/ZoomLevelProvider";
import { fetchAlbum } from "../API";

const SquareThumbnailContents = ({ photos, setSelected }) => {
  const { columns } = useContext(ZoomLevelContext);
  return (
    <div className={`gallery gallery-${columns}`}>
      {photos.map((photo, k) => (
        <div key={k} className="frame">
          <div className="photo">
            <Thumbnail
              photo={photo}
              renderPhoto={true}
              setSelected={setSelected}
            />
          </div>
        </div>
      ))}
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
        const photosSrc = `${ORIGINALS_ROOT}/${photo.path}`;
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
      <Thumbnail photo={photo} renderPhoto={true} setSelected={setSelected} />
    );

    const formattedDate = date.toFormat(formatStr);
    return (
      <div className="frame" key={formattedDate}>
        <div className="photo">
          <span className="date">{formattedDate}</span>
          {photoElem}
        </div>
      </div>
    );
  };

  return (
    <div className="gallery gallery-7 calendar">{calendar.map(renderDay)}</div>
  );
};

const ViewAlbum = ({ album }) => {
  const [selected, setSelected] = useState(null);

  const handleNext = () => {
    const current = album.photos.indexOf(selected);

    if (current + 1 < album.photos.length) {
      setSelected(album.photos[current + 1]);
    }
  };

  const handlePrevious = () => {
    const current = album.photos.indexOf(selected);

    if (current > 0) {
      setSelected(album.photos[current - 1]);
    }
  };

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

  const renderContents = (album) => {
    const Contents = getContentsComponent(album);
    return (
      <Contents
        photos={album.photos}
        setSelected={setSelected}
        galleryOptions={album.galleryOptions}
      />
    );
  };

  return (
    <div tabIndex={4} className="view-album">
      <div className="day-gallery">
        <h2>
          <span> {album.name}</span>
          <span className="actions">
            <Link to={`/albums/${encodeURIComponent(album.id)}/edit`}>
              Edit
            </Link>
          </span>
        </h2>
        {renderContents(album)}
      </div>
      <Showcase
        selected={selected}
        onUnselect={() => setSelected(null)}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  );
};

const ViewAlbumPage = () => {
  const { albumId } = useParams();
  const [album, setAlbum] = useState(null);

  useEffect(() => {
    fetchAlbum(albumId).then((album) => {
      setAlbum(album);
    });
  }, [albumId]);

  if (album === null) {
    return <div>Loading...</div>;
  }

  // if (!album) {
  //   return <div>Album not found</div>;
  // }

  return <ViewAlbum album={album} />;
};

export default ViewAlbumPage;
