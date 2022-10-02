import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createAlbum } from "../API";

const validatePath = (path) => {
  if (!path.endsWith(".json")) {
    return false;
  }

  return true;
};

const validateName = (name) => {
  if (name.trim() === "") {
    return false;
  }

  return true;
};

const validate = ({ path, name }) => {
  return validatePath(path) && validateName(name);
};

const CreateAlbumPage = () => {
  const navigate = useNavigate();
  const [path, setPath] = useState("");
  const [name, setName] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();

    createAlbum(path.trim(), name.trim())
      .then((_) => {
        // ideally use id from response
        navigate(`/albums/${encodeURIComponent(path.trim())}`);
      })
      .catch((err) => {
        if (err.response.data.errors) {
          console.error(err.response.data.errors);
        } else {
          console.error(err);
        }
      });
  };

  return (
    <div>
      <h2>Create new album</h2>
      <form onSubmit={onSubmit}>
        <fieldset>
          <label htmlFor="path">Path</label>
          <input
            id="path"
            placeholder="path/to/album.json"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
        </fieldset>
        <fieldset>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            placeholder="Album name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </fieldset>
        <button type="submit" disabled={!validate({ path, name })}>
          Create
        </button>
      </form>
    </div>
  );
};

export default CreateAlbumPage;
