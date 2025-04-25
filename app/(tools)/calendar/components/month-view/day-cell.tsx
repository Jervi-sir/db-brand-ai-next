'use client'

import { useMemo, useState, useEffect } from "react";
import { isToday, startOfDay, format, parseISO } from "date-fns";
import { EventBullet } from "./event-bullet";
import { MonthEventBadge } from "./month-event-badge";
import { getMonthCellEvents, stripHtml } from "../../helpers";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventDetailsDialog } from "../dialogs/event-details-dialog";
import { Clock, Text } from "lucide-react";
import { IEvent } from "../../types";

interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}

interface IProps {
  cell: ICalendarCell;
  events: IEvent[];
  eventPositions: Record<string, number>;
}

const MAX_VISIBLE_EVENTS = 3;

export function DayCell({ cell, events, eventPositions }: IProps) {
  const { day, currentMonth, date } = cell;
  const cellEvents = useMemo(
    () => getMonthCellEvents(date, events, eventPositions),
    [date, events, eventPositions]
  );
  const isSunday = date.getDay() === 0;
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Event card styles inspired by AgendaEventCard
  const getEventCardClasses = (color: string) => {
    const colorClasses: Record<string, string> = {
      blue: "border-blue-200 bg-blue-50 text-blue-700",
      green: "border-green-200 bg-green-50 text-green-700",
      red: "border-red-200 bg-red-50 text-red-700",
      yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
      purple: "border-purple-200 bg-purple-50 text-purple-700",
      orange: "border-orange-200 bg-orange-50 text-orange-700",
      gray: "border-neutral-200 bg-neutral-50 text-neutral-900",
    };
    return `flex flex-col gap-2 rounded-md border p-3 text-sm ${
      colorClasses[color] || "border-blue-200 bg-blue-50 text-blue-700"
    }`;
  };

  // Handle keydown for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isMobile && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (cellEvents.length > 0) {
        setOpen(true);
      }
    }
  };

  // Common cell content
  const cellContent = (
    <div
      className={`flex h-full flex-col gap-1 border-l border-t py-1.5 md:py-2 ${
        isSunday ? "border-l-0" : ""
      } ${cellEvents.length > 0 && isMobile ? "cursor-pointer" : ""}`}
      onClick={() => {
        if (isMobile && cellEvents.length > 0) {
          setOpen(true);
        }
      }}
      onKeyDown={handleKeyDown}
      role={cellEvents.length > 0 && isMobile ? "button" : undefined}
      tabIndex={cellEvents.length > 0 && isMobile ? 0 : -1}
    >
      <span
        className={`h-6 px-1 text-xs font-semibold md:px-2 ${
          !currentMonth ? "opacity-20" : ""
        } ${
          isToday(date)
            ? "flex w-6 translate-x-1 items-center justify-center rounded-full bg-blue-600 text-white px-0 font-bold"
            : ""
        }`}
      >
        {day}
      </span>
      <div
        className={`flex h-6 gap-1 px-2 md:h-[94px] md:flex-col md:gap-1 md:px-0 ${
          !currentMonth ? "opacity-50" : ""
        }`}
      >
        {[0, 1, 2].map((position) => {
          const event = cellEvents.find((e) => e.position === position);
          const eventKey = event
            ? `event-${event.id}-${position}`
            : `empty-${position}`;
          return (
            <div key={eventKey} className="md:flex-1">
              {event && (
                <>
                  <EventBullet className="md:hidden" color={event.color} />
                  <MonthEventBadge
                    className="hidden md:flex"
                    event={event}
                    cellDate={startOfDay(date)}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
      {cellEvents.length > MAX_VISIBLE_EVENTS && (
        <p
          className={`h-4.5 px-1.5 text-xs font-semibold text-gray-500 ${
            !currentMonth ? "opacity-50" : ""
          }`}
        >
          <span className="sm:hidden">
            +{cellEvents.length - MAX_VISIBLE_EVENTS}
          </span>
          <span className="hidden sm:inline">
            {" "}
            {cellEvents.length - MAX_VISIBLE_EVENTS} more...
          </span>
        </p>
      )}
    </div>
  );

  // Render Dialog only for mobile
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{cellContent}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Events for {format(date, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cellEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events scheduled.</p>
            ) : (
              cellEvents.map((event, index) => (
                <EventDialog
                  key={index}
                  event={event}
                  getEventCardClasses={getEventCardClasses}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render plain content for non-mobile
  return cellContent;
}

// EventDialog component remains unchanged
interface EventDialogProps {
  event: IEvent;
  getEventCardClasses: (color: string) => string;
}

const EventDialog = ({ event, getEventCardClasses }: EventDialogProps) => {
  return (
    <EventDetailsDialog key={event.id} event={event}>
      <div
        role="button"
        tabIndex={0}
        className={getEventCardClasses(event.color)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (e.currentTarget instanceof HTMLElement) {
              e.currentTarget.click();
            }
          }
        }}
      >
        <p className="font-medium">{event.title}</p>
        <div className="flex items-center gap-1">
          <Clock className="size-3 shrink-0" />
          <p className="text-xs">
            {event.startDate
              ? format(parseISO(event.startDate), "MMM d, yyyy, h:mm a")
              : "No start date"}
            {" - "}
            {event.endDate
              ? format(parseISO(event.endDate), "MMM d, yyyy, h:mm a")
              : "No end date"}
          </p>
        </div>
        {event.userPrompt && (
          <div className="flex items-start gap-1">
            <Text className="size-3 shrink-0 mt-1" />
            <div>
              <p className="text-xs font-medium">Description</p>
              <p className="text-xs">{event.userPrompt}</p>
            </div>
          </div>
        )}
        {event.generatedScript && (
          <div className="flex items-start gap-1">
            <Text className="size-3 shrink-0 mt-1" />
            <div>
              <p className="text-xs font-medium">Generated Script</p>
              <p className="text-xs">
                {stripHtml(event.generatedScript).substring(0, 100)}
                {stripHtml(event.generatedScript).length > 100 ? "..." : ""}
              </p>
            </div>
          </div>
        )}
        {event.stage && (
          <div className="flex items-center gap-1">
            <Text className="size-3 shrink-0" />
            <p className="text-xs">
              Stage:{" "}
              {event.stage.charAt(0).toUpperCase() +
                event.stage.slice(1).replace("_", " ")}
            </p>
          </div>
        )}
      </div>
    </EventDetailsDialog>
  );
};