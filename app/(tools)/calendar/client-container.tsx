// File: components/client-container.tsx
'use client';

import { useMemo } from "react";
import { useCalendar } from "./calendar-context";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "date-fns";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { defaultCols } from "@/app/(tools)/kanban/types";
import { EventDetailsDialog } from "./dialogs/event-details-dialog";
import { calculateMonthEventPositions, getCalendarCells, getEventsCount, getMonthCellEvents, navigateDate, rangeText, } from "./helpers";
import { colorClasses, IEvent } from "./types";
import { useState, useEffect } from "react";
import { isToday } from "date-fns";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Clock, Text } from "lucide-react";
import { stripHtml } from "../utils";

export function ClientContainer({ setSelectedDate }: { setSelectedDate: (date: Date) => void }) {
  const { events, selectedDate } = useCalendar();
  const filteredEvents = useMemo(() => events || [], [events]);
  const singleDayEvents = filteredEvents.filter((event) => {
    if (!event.endDate) {
      console.warn("Event missing endDate:", event);
      return false;
    }
    try {
      console.log("Event included:", event.id, event.endDate);
      return true;
    } catch (error) {
      console.error("Error parsing event date:", event, error);
      return false;
    }
  });

  return (
    <div className="rounded-xl border overflow-hidden">
      <CalendarHeader view="month" events={filteredEvents} setSelectedDate={setSelectedDate} />
      <CalendarMonthView
        singleDayEvents={singleDayEvents}
        multiDayEvents={[]}
        selectedDate={selectedDate}
      />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Calendar Header
|--------------------------------------------------------------------------
*/

export function CalendarHeader({ view = "month", events, setSelectedDate }: { view?: string, events: IEvent[], setSelectedDate: (date: Date) => void }) {
  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center justify-between gap-3 flex-1">
        <DateNavigator view={view} events={events} setSelectedDate={setSelectedDate} />
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Date Navigator
|--------------------------------------------------------------------------
*/

export function DateNavigator({ view = "month", events, setSelectedDate }: { view?: string, events: IEvent[], setSelectedDate: (date: Date) => void }) {
  const { selectedDate } = useCalendar();
  const month = formatDate(selectedDate, "MMMM");
  const year = selectedDate.getFullYear();
  const eventCount = useMemo(
    () => getEventsCount(events, selectedDate),
    [events, selectedDate]
  );

  const handlePrevious = () => {
    const newDate = navigateDate(selectedDate, "previous");
    setSelectedDate(newDate);
    const newMonth = format(newDate, "yyyy-MM");
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("month", newMonth);
    window.history.replaceState(null, "", newUrl.toString());
  };

  const handleNext = () => {
    const newDate = navigateDate(selectedDate, "next");
    setSelectedDate(newDate);
    const newMonth = format(newDate, "yyyy-MM");
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("month", newMonth);
    window.history.replaceState(null, "", newUrl.toString());
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row justify-between space-y-0.5">
      <div className="flex items-center gap-2 pb-2 md:pb-0 justify-center">
        <span className="text-lg font-semibold">
          {month} {year}
        </span>
        <span className="border border-gray-300 rounded px-1.5 text-xs">
          {eventCount} events
        </span>
      </div>
      <div className="flex items-center justify-between md:justify-normal gap-2">
        <button
          className="size-6 border border-gray-300 rounded flex items-center justify-center"
          onClick={handlePrevious}
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm text-zinc-900 dark:text-gray-200">{rangeText(selectedDate)}</p>
        <button
          className="size-6 border border-gray-300 rounded flex items-center justify-center"
          onClick={handleNext}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Today Button
|--------------------------------------------------------------------------
*/

export function TodayButton() {
  const { setSelectedDate } = useCalendar();
  const today = new Date();
  const handleClick = () => setSelectedDate(today);

  return (
    <button
      className="flex size-14 flex-col items-start rounded-lg border"
      onClick={handleClick}
    >
      <p className="flex h-6 w-full items-center justify-center bg-blue-600 text-xs font-semibold text-white">
        {formatDate(today, "MMM").toUpperCase()}
      </p>
      <p className="flex w-full items-center justify-center text-lg font-bold">
        {today.getDate()}
      </p>
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| Calendar Month View
|--------------------------------------------------------------------------
*/
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ singleDayEvents, multiDayEvents, selectedDate }: { singleDayEvents: IEvent[], multiDayEvents: IEvent[], selectedDate: Date }) {
  const { setSelectedDate } = useCalendar();
  const allEvents = [...singleDayEvents];
  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);
  const eventPositions = useMemo(
    () => calculateMonthEventPositions(multiDayEvents, singleDayEvents, selectedDate),
    [multiDayEvents, singleDayEvents, selectedDate]
  );

  useEffect(() => {
    setSelectedDate(selectedDate);
  }, [selectedDate, setSelectedDate]);

  return (
    <div>
      <div className="grid grid-cols-7 divide-x">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="flex items-center justify-center py-2">
            <span className="text-xs font-medium text-gray-500">{day}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 overflow-hidden">
        {cells.map((cell) => (
          <DayCell
            key={cell.date.toISOString()}
            cell={cell}
            events={allEvents}
            eventPositions={eventPositions}
          />
        ))}
      </div>
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| Day Cell
|--------------------------------------------------------------------------
*/
const MAX_VISIBLE_EVENTS = 3;

export function DayCell({ cell, events, eventPositions }: { cell: { day: number, currentMonth: boolean, date: Date }, events: IEvent[], eventPositions: Record<string, number> }) {
  const { day, currentMonth, date } = cell;
  const cellEvents = useMemo(
    () => getMonthCellEvents(date, events, eventPositions),
    [date, events, eventPositions]
  );
  const isSunday = date.getDay() === 0;
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getEventCardClasses = (color: string) => {
    return `flex flex-col gap-2 rounded-md border p-3 text-sm ${colorClasses[color] || "border-blue-200 bg-blue-50 text-blue-700"
      }`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isMobile && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (cellEvents.length > 0) {
        setOpen(true);
      }
    }
  };

  const cellContent = (
    <div
      className={`flex h-full flex-col gap-1 border-l border-t py-1.5 md:py-2 ${isSunday ? "border-l-0" : ""
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
        className={`h-6 px-1 text-xs font-semibold md:px-2 ${!currentMonth ? "opacity-20" : ""
          } ${isToday(date)
            ? "flex w-6 translate-x-1 items-center justify-center rounded-full bg-blue-600 text-white px-0 font-bold"
            : ""
          }`}
      >
        {day}
      </span>
      <div
        className={`flex h-6 gap-1 px-2 md:h-[94px] md:flex-col md:gap-1 md:px-0 ${!currentMonth ? "opacity-50" : ""
          }`}
      >
        {cellEvents.slice(0, MAX_VISIBLE_EVENTS).map((event, index) => (
          <div key={`event-${event.id}-${index}`} className="md:flex-1">
            <EventBullet className="md:hidden" color={event.color} />
            <MonthEventBadge
              className="hidden md:flex"
              event={event}
              cellDate={startOfDay(date)}
              position="none"
            />
          </div>
        ))}
      </div>
      {cellEvents.length > MAX_VISIBLE_EVENTS && (
        <p
          className={`h-4.5 px-1.5 text-xs font-semibold text-gray-500 ${!currentMonth ? "opacity-50" : ""
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
                  key={`event-${event.id}-${index}`}
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

  return cellContent;
}

const EventDialog = ({ event }: {
  event: IEvent,
  getEventCardClasses: (color: string) => string,
}) => {
  const stage = defaultCols.find(col => col.id === event.stage);

  const eventBadgeClasses = `
    h-6.5 gap-1.5 
    rounded-md border px-2 text-xs 
    ${colorClasses[stage?.id || 'default']} 
  `;

  return (
    <EventDetailsDialog key={event.id} event={event}>
      <div
        role="button"
        tabIndex={0}
        className={eventBadgeClasses}
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
            {event.endDate
              ? format(parseISO(event.endDate), "MMM d, yyyy, h:mm a")
              : "No deadline"}
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

/*
|--------------------------------------------------------------------------
| Event Bullet
|--------------------------------------------------------------------------
*/
export function EventBullet({ color, className }: { color: string, className?: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    red: "bg-red-600",
    yellow: "bg-yellow-600",
    purple: "bg-purple-600",
    orange: "bg-orange-600",
    gray: "bg-gray-600",
  };
  return (
    <div
      className={`size-2 rounded-full ${colorClasses[color] || "bg-blue-600"} ${className || ""
        }`}
    />
  );
}

/*
|--------------------------------------------------------------------------
| Month event badge
|--------------------------------------------------------------------------
*/

export function MonthEventBadge({
  event,
  cellDate,
  className,
  position = "none",
}: {
  event: IEvent,
  cellDate: Date,
  className?: string,
  position?: "none",
}) {
  const itemEnd = startOfDay(parseISO(event.endDate));

  if (!isSameDay(cellDate, itemEnd)) return null;

  const stage = defaultCols.find(col => col.id === event.stage);

  const eventBadgeClasses = `
    mx-1 flex h-6.5 items-center justify-between gap-1.5 truncate whitespace-nowrap 
    rounded-2xl border px-2 text-xs 
    ${className || ""}
    ${colorClasses[stage?.id || 'default']} 
  `;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
    }
  };

  return (
    <EventDetailsDialog event={event as any}>
      <div
        role="button"
        tabIndex={0}
        className={eventBadgeClasses}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-1.5 truncate">
          <p className="flex-1 truncate font-semibold">{event.title}</p>
        </div>
        <span className="font-bold">{stage?.title}</span>
        {/* <span>{format(new Date(event.endDate), "h:mm a")}</span> */}
      </div>
    </EventDetailsDialog>
  );
}
