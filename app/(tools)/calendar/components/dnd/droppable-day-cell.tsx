"use client";

import { useDrop } from "react-dnd";
import { parseISO, differenceInMilliseconds } from "date-fns";
import { useCalendar } from "../../contexts/calendar-context";
import { ItemTypes } from "./draggable-event";
import { IEvent } from "../../types";

interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}

interface IProps {
  cell: ICalendarCell;
  children: React.ReactNode;
}

export function DroppableDayCell({ cell, children }: IProps) {
  const { updateEvent, enableDnd } = useCalendar();

  if (!enableDnd) {
    return <div>{children}</div>;
  }

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.EVENT,
      drop: async (item: { event: IEvent }) => {
        const droppedEvent = item.event;
        const eventStartDate = parseISO(droppedEvent.startDate);
        const eventEndDate = parseISO(droppedEvent.endDate);
        const eventDurationMs = differenceInMilliseconds(
          eventEndDate,
          eventStartDate
        );
        const newStartDate = new Date(cell.date);
        newStartDate.setHours(
          eventStartDate.getHours(),
          eventStartDate.getMinutes(),
          eventStartDate.getSeconds(),
          eventStartDate.getMilliseconds()
        );
        const newEndDate = new Date(newStartDate.getTime() + eventDurationMs);
        try {
          await updateEvent({
            ...droppedEvent,
            startDate: newStartDate.toISOString(),
            endDate: newEndDate.toISOString(),
          });
          return { moved: true };
        } catch (error) {
          console.error(error);
          alert("Failed to move event");
          return { moved: false };
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [cell.date, updateEvent]
  );

  return (
    <div
      ref={drop as unknown as React.RefObject<HTMLDivElement>}
      className={isOver && canDrop ? "bg-gray-100" : ""}
    >
      {children}
    </div>
  );
}