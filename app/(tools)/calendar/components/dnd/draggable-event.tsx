"use client";

import { useDrag } from "react-dnd";
import { useCalendar } from "../../contexts/calendar-context";
import { IEvent } from "../../types";

export const ItemTypes = {
  EVENT: "event",
};

interface IProps {
  children: React.ReactNode;
  event: IEvent;
}

export function DraggableEvent({ children, event }: IProps) {
  const { enableDnd } = useCalendar();

  if (!enableDnd) {
    return <div>{children}</div>;
  }

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EVENT,
    item: { event },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      className={isDragging ? "opacity-50" : ""}
    >
      {children}
    </div>
  );
}