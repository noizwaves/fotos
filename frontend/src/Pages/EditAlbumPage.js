import { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { updateAlbum } from "../API";
import { THUMBNAILS_ROOT } from "../Constants";
import { AlbumsContext } from "../Providers/AlbumsProvider";

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
    <div className="edit-album-photo">
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
  const navigate = useNavigate();
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
    navigate(`/albums/${encodeURIComponent(album.id)}`);
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
    <div className="edit-album">
      <h2>{album.name}</h2>
      <div>{photoElements}</div>
      <div className="actions">
        <button onClick={() => onUpdateAlbum(photos)}>Update</button>
        <button onClick={() => onCancel()}>Cancel</button>
      </div>
    </div>
  );
};

const EditAlbumPage = () => {
  const navigate = useNavigate();
  const { albums, reloadAlbums } = useContext(AlbumsContext);

  const albumId = decodeURIComponent(useParams().albumId);

  const onUpdateAlbum = (newPhotos) => {
    const photoPaths = newPhotos.map((p) => p.path);
    // TODO: Call context directly to update album
    updateAlbum(album.id, photoPaths)
      .then((_) => {
        // Reload album by fetching ALL albums
        // TODO: use updated album in response to update just single album
        reloadAlbums();

        navigate(`/albums/${encodeURIComponent(album.id)}`);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  if (albums === null) {
    return <div>Loading...</div>;
  }

  const album = albums.find((a) => a.id === albumId);
  if (album === null) {
    return <div>Album not found</div>;
  }

  return (
    <div className="edit-album-page">
      <EditAlbum album={album} onUpdateAlbum={onUpdateAlbum} />
    </div>
  );
};

export default EditAlbumPage;
