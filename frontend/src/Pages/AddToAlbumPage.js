import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CheckedContext } from "../Providers/CheckedProvider";
import { fetchAlbum, fetchAlbums, updateAlbum } from "../API";

const AddToAlbum = ({ albums, checked, resetChecked }) => {
  const navigate = useNavigate();
  const [selectedAlbumId, setSelectedAlbumId] = useState(albums[0].id);

  const albumChoices = albums.map((a, i) => (
    <option key={i} value={a.id}>
      {a.id}
    </option>
  ));

  const numPhotos = `${checked.length}`;
  const wordPhotos = "Photo" + (checked.length === 1 ? "" : "s");

  const onSubmit = async (event) => {
    event.preventDefault();

    const album = await fetchAlbum(selectedAlbumId);

    const newPhotos = [].concat(
      album.photos.map((p) => p.path),
      checked.map((p) => p.path)
    );

    updateAlbum(album.id, newPhotos)
      .then((_) => {
        resetChecked();

        navigate(`/albums/${encodeURIComponent(album.id)}`);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <div>
      <h2>
        Add {numPhotos} {wordPhotos} to Album
      </h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="select-album">Album: </label>
        <select
          id="select-album"
          value={selectedAlbumId}
          onChange={(event) => setSelectedAlbumId(event.target.value)}
        >
          {albumChoices}
        </select>
        <div>
          <button type="submit">Add</button>
        </div>
      </form>
    </div>
  );
};

const AddToAlbumPage = () => {
  const [albums, setAlbums] = useState(null);
  const { checked, resetChecked } = useContext(CheckedContext);

  useEffect(() => {
    fetchAlbums().then(({ albums }) => {
      setAlbums(albums);
    });
  }, []);

  if (albums === null) {
    return <div>Loading...</div>;
  }

  if (checked.length === 0) {
    return <div>No photos have been checked!</div>;
  }

  return (
    <AddToAlbum albums={albums} checked={checked} resetChecked={resetChecked} />
  );
};

export default AddToAlbumPage;
