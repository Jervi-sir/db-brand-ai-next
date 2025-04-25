"use client";

import { useMemo } from "react";
import { isSameDay, parseISO } from "date-fns";
import { useCalendar } from "../contexts/calendar-context";
import { DndProviderWrapper } from "./dnd/dnd-provider";
import { CalendarHeader } from "./header/calendar-header";
import { CalendarMonthView } from "./month-view/calendar-month-view";

export function ClientContainer() {
  const { events } = useCalendar();
  const filteredEvents = useMemo(() => events || [], [events]);
  const singleDayEvents = filteredEvents.filter((event) => {
    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);
    return isSameDay(startDate, endDate);
  });
  const multiDayEvents = filteredEvents.filter((event) => {
    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);
    return !isSameDay(startDate, endDate);
  });

  return (
    <div className="rounded-xl border overflow-hidden">
      <CalendarHeader view="month" events={filteredEvents} />
      <DndProviderWrapper>
        <CalendarMonthView
          singleDayEvents={singleDayEvents}
          multiDayEvents={multiDayEvents}
        />
      </DndProviderWrapper>
    </div>
  );
}