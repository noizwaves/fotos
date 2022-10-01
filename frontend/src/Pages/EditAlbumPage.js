import { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { updateAlbum } from "../API";
import { AlbumsContext } from "../Providers/AlbumsProvider";
import SquareThumbnailEditor from "../Components/SquareThumbnailEditor";

const movePhoto = (photos, newIndex, photo) => {
  const newPhotos = photos.map((e) => e);
  newPhotos.splice(
    newPhotos.findIndex((e) => e === photo),
    1
  );
  newPhotos.splice(newIndex, 0, photo);
  return newPhotos;
};

const EditAlbum = ({ album, onUpdateAlbum }) => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState(album.photos);

  const onMove = (photo, newIndex) => {
    const newPhotos = movePhoto(photos, newIndex, photo);
    setPhotos(newPhotos);
  };

  const onRemove = (photo) => {
    const newPhotos = photos.filter((p) => p !== photo);
    setPhotos(newPhotos);
  };

  const onCancel = () => {
    navigate(`/albums/${encodeURIComponent(album.id)}`);
  };

  return (
    <div className="edit-album">
      <h2>{album.name}</h2>
      <SquareThumbnailEditor
        photos={photos}
        onMove={onMove}
        onRemove={onRemove}
      />
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
