import { useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import { THUMBNAILS_ROOT } from "../Constants";

const movePhoto = (photos, newIndex, photo) => {
  const newPhotos = photos.map((e) => e);
  newPhotos.splice(
    newPhotos.findIndex((e) => e === photo),
    1
  );
  newPhotos.splice(newIndex, 0, photo);
  return newPhotos;
};

const EditAlbumPhoto = ({ photo, isFirst, isLast, onMoveUp, onMoveDown }) => {
  const thumbnailSrc = `${THUMBNAILS_ROOT}/${photo.path}`;
  return (
    <div className="editAlbumPhoto">
      <div className="thumbnail">
        <img src={thumbnailSrc} alt={photo.name} />
      </div>
      <span className="path">{photo.path}</span>
      <div className="actions">
        <button disabled={isFirst} onClick={() => onMoveUp(photo)}>
          Up
        </button>
        <button disabled={isLast} onClick={() => onMoveDown(photo)}>
          Down
        </button>
      </div>
    </div>
  );
};

const EditAlbum = ({ album, onUpdateAlbum }) => {
  const history = useHistory();

  const [photos, setPhotos] = useState(album.photos);

  const onMoveDown = (photo) => {
    const originalIndex = photos.findIndex((p) => p === photo);
    const newIndex = originalIndex + 1;
    const newPhotos = movePhoto(album.photos, newIndex, photo);
    setPhotos(newPhotos);
  };

  const onMoveUp = (photo) => {
    const originalIndex = photos.findIndex((p) => p === photo);
    const newIndex = originalIndex - 1;
    const newPhotos = movePhoto(photos, newIndex, photo);
    setPhotos(newPhotos);
  };

  const onCancel = () => {
    history.push(`/albums/${encodeURIComponent(album.id)}`);
  };

  const photoElements = photos.map((p, i) => (
    <EditAlbumPhoto
      key={i}
      photo={p}
      isFirst={i === 0}
      isLast={i === photos.length - 1}
      onMoveDown={onMoveDown}
      onMoveUp={onMoveUp}
    />
  ));

  return (
    <div className="editAlbum">
      <h2>{album.name}</h2>
      <div className="editAlbum--photos">{photoElements}</div>
      <div className="editAlbum--actions">
        <button onClick={() => onUpdateAlbum(album, photos)}>Update</button>
        <button onClick={() => onCancel()}>Cancel</button>
      </div>
    </div>
  );
};

const EditAlbumPage = ({ albums, onUpdateAlbum }) => {
  const albumId = decodeURIComponent(useParams().albumId);

  if (albums === null) {
    return <div>Loading...</div>;
  }

  const album = albums.find((a) => a.id === albumId);
  if (album === null) {
    return <div>Album not found</div>;
  }

  return (
    <div className="editAlbumPage">
      <EditAlbum album={album} onUpdateAlbum={onUpdateAlbum} />
    </div>
  );
};

export default EditAlbumPage;
