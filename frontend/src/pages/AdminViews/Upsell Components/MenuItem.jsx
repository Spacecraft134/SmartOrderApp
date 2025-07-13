import { useDraggable } from "@dnd-kit/core";

export function MenuItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white border border-gray-200 rounded-md px-3 py-2 cursor-move hover:bg-gray-50"
    >
      {children}
    </div>
  );
}
