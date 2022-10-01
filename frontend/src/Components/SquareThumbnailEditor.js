import { useContext } from "react";
import { useDraggable, useDroppable, DndContext } from "@dnd-kit/core";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

import { THUMBNAILS_ROOT } from "../Constants";
import { ZoomLevelContext } from "../Providers/ZoomLevelProvider";

const DraggablePhoto = ({ photo }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${photo.path}`,
    data: photo,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: "1000",
      }
    : undefined;

  const photosSrc = `${THUMBNAILS_ROOT}/${photo.path}`;
  return (
    <div
      className="photo"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <img src={photosSrc} alt={photo.path} />
    </div>
  );
};

const DroppableFrame = ({ children, index }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${index}`,
    data: {
      index,
    },
  });

  const className = isOver ? "frame drag-over" : "frame";

  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
};

const SquareThumbnailEditor = ({ photos, onMove, onRemove }) => {
  const { columns } = useContext(ZoomLevelContext);

  const handleDragEnd = (event) => {
    // Drag didn't end on a droppable
    if (event.collisions.length === 0) {
      return;
    }

    const photo = event.active.data.current;
    const newIndex =
      event.collisions[0].data.droppableContainer.data.current.index;

    onMove(photo, newIndex);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={`gallery gallery-${columns} editing`}>
        {photos.map((photo, k) => (
          <DroppableFrame key={k} index={k}>
            <div className="hover-actions">
              <span
                className="remove-from-album"
                onClick={() => onRemove(photo)}
              >
                <FontAwesomeIcon icon={faCircleXmark} />
              </span>
            </div>
            <DraggablePhoto key={k} photo={photo} />
          </DroppableFrame>
        ))}
      </div>
    </DndContext>
  );
};

export default SquareThumbnailEditor;
