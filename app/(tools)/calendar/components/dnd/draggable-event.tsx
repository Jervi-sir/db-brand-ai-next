"use client";

import { useRef } from "react";
import { useDrag } from "react-dnd";

interface IEvent {
  id: string | number;
  startDate: string;
  endDate: string;
  title: string;
  color: string;
  description?: string;
  user?: { id: string; name: string };
}

export const ItemTypes = {
  EVENT: "event",
};

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function DraggableEvent({ event, children }: IProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EVENT,
    item: { event },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));
  drag(ref);

  return (
    <div ref={ref} className={isDragging ? "opacity-40" : ""}>
      {children}
    </div>
  );
}