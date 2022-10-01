import axios from "axios";

const makePhoto = (path) => {
  return {
    path: path,
    name: path.split("/")[3],
    date: path.split("/").splice(0, 3).join("-"),
  };
};

// TODO: separate out album processing
export const fetchAlbums = () => {
  return axios.get("/api/albums").then((response) => {
    const albums = response.data.map((album) => {
      return { ...album, photos: album.photos.map(makePhoto) };
    });

    const rootFolder = { name: "Root Folder", id: "/", contents: [] };

    albums.forEach((album) => {
      // create folders for this album
      const folderNames = album.id.split("/");

      let current = rootFolder;

      for (let i = 0; i < folderNames.length - 1; i++) {
        const folderName = folderNames[i];
        const existing = current.contents.find(
          (item) => item.contents && item.name === folderName
        );
        if (existing) {
          current = existing;
        } else {
          const newFolder = {
            id: `${current.id}${folderName}/`,
            name: folderName,
            contents: [],
          };
          current.contents.push(newFolder);
          current = newFolder;
        }
      }

      // put album in folder
      current.contents.push(album);
    });

    return {
      rootFolder,
      albums,
    };
  });
};

export const fetchPhotos = () => {
  return axios.get("/api/photos").then((response) => {
    const paths = response.data;
    return paths.map(makePhoto);
  });
};

export const updateAlbum = async (id, photoPaths) => {
  const body = {
    photos: photoPaths,
  };
  return axios
    .patch(`/api/albums/${encodeURIComponent(id)}`, body)
    .then((response) => response.data);
};

export const createAlbum = async (path, name) => {
  const body = {
    path,
    name,
  };
  return axios.post(`/api/albums`, body).then((response) => response.data);
};
