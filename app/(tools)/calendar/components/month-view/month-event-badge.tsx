import { format, isSameDay, parseISO, startOfDay, endOfDay } from "date-fns";
import { DraggableEvent } from "../dnd/draggable-event";
import { EventDetailsDialog } from "../dialogs/event-details-dialog";

interface IEvent {
  id: string | number;
  startDate: string;
  endDate: string;
  title: string;
  color: string;
  description?: string;
  user?: { id: string; name: string };
}

interface IProps {
  event: IEvent;
  cellDate: Date;
  className?: string;
  position?: "first" | "middle" | "last" | "none";
}

export function MonthEventBadge({
  event,
  cellDate,
  className,
  position: propPosition,
}: IProps) {
  const itemStart = startOfDay(parseISO(event.startDate));
  const itemEnd = endOfDay(parseISO(event.endDate));

  if (cellDate < itemStart || cellDate > itemEnd) return null;

  const position =
    propPosition ||
    (isSameDay(itemStart, itemEnd)
      ? "none"
      : isSameDay(cellDate, itemStart)
      ? "first"
      : isSameDay(cellDate, itemEnd)
      ? "last"
      : "middle");

  const colorClasses: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    red: "border-red-200 bg-red-50 text-red-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    gray: "border-gray-200 bg-gray-50 text-gray-900",
  };

  const positionClasses: Record<string, string> = {
    first:
      "relative z-10 mr-0 w-[calc(100%_-_3px)] rounded-r-none border-r-0",
    middle: "relative z-10 mx-0 w-[calc(100%_+_1px)] rounded-none border-x-0",
    last: "ml-0 rounded-l-none border-l-0",
    none: "",
  };

  const eventBadgeClasses = `mx-1 flex h-6.5 items-center justify-between gap-1.5 truncate whitespace-nowrap rounded-md border px-2 text-xs ${
    colorClasses[event.color] || "border-blue-200 bg-blue-50 text-blue-700"
  } ${positionClasses[position] || ""} ${className || ""}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
    }
  };

  const renderBadgeText = ["first", "none"].includes(position);

  return (
    <DraggableEvent event={event}>
      <EventDetailsDialog event={event as any}>
        <div
          role="button"
          tabIndex={0}
          className={eventBadgeClasses}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-1.5 truncate">
            {renderBadgeText && (
              <p className="flex-1 truncate font-semibold">{event.title}</p>
            )}
          </div>
          {renderBadgeText && (
            <span>{format(new Date(event.startDate), "h:mm a")}</span>
          )}
        </div>
      </EventDetailsDialog>
    </DraggableEvent>
  );
}