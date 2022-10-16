import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchAlbum, deleteAlbum, updateAlbum } from "../API";
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

const EditAlbum = ({ album, onUpdateAlbum, onDeleteAlbum }) => {
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

  const onDelete = () => {
    const proceed = window.confirm(
      "Are you sure you want to delete this album?"
    );

    if (proceed) {
      onDeleteAlbum();
    }
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
        <button className="button danger" onClick={() => onDelete()}>
          Delete
        </button>
        <button onClick={() => onUpdateAlbum(photos)}>Update</button>
        <button onClick={() => onCancel()}>Cancel</button>
      </div>
    </div>
  );
};

const EditAlbumPage = () => {
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const { albumId } = useParams();

  useEffect(() => {
    fetchAlbum(albumId).then((album) => {
      setAlbum(album);
    });
  }, [albumId]);

  const onUpdateAlbum = (newPhotos) => {
    const photoPaths = newPhotos.map((p) => p.path);
    updateAlbum(album.id, photoPaths)
      .then((_) => {
        navigate(`/albums/${encodeURIComponent(album.id)}`);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const onDeleteAlbum = () => {
    deleteAlbum(album.id)
      .then((_) => {
        navigate("/albums");
      })
      .catch((err) => {
        console.error(err);
      });
  };

  if (album === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="edit-album-page">
      <EditAlbum
        album={album}
        onDeleteAlbum={onDeleteAlbum}
        onUpdateAlbum={onUpdateAlbum}
      />
    </div>
  );
};

export default EditAlbumPage;
