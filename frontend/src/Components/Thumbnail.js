import { THUMBNAILS_V2_ROOT, THUMBNAILS_V2_SIZES } from "../Constants";

const Thumbnail = ({ photo, renderPhoto, setSelected }) => {
  const images = THUMBNAILS_V2_SIZES.map(({ width }, i) => {
    const src = renderPhoto
      ? `${THUMBNAILS_V2_ROOT}/${width}/${photo.path}`
      : "/placeholder.png";
    return (
      <img
        src={src}
        alt={photo.name}
        onClick={() => (setSelected ? setSelected(photo) : null)}
        className={`img-${width}`}
      />
    );
  });

  return <>{images}</>;
};

export default Thumbnail;
