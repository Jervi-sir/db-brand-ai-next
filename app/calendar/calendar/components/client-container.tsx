"use client";

import { useMemo } from "react";
import { isSameDay, parseISO } from "date-fns";

import { useCalendar } from "../contexts/calendar-context";

import { DndProviderWrapper } from "../components/dnd/dnd-provider";

import { CalendarHeader } from "../components/header/calendar-header";
import { CalendarYearView } from "../components/year-view/calendar-year-view";
import { CalendarMonthView } from "../components/month-view/calendar-month-view";
import { CalendarAgendaView } from "../components/agenda-view/calendar-agenda-view";
import { CalendarDayView } from "../components/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "../components/week-and-day-view/calendar-week-view";

import type { TCalendarView } from "../types";

interface IProps {
  view: TCalendarView;
}

export function ClientContainer({ view }: IProps) {
  const { selectedDate, selectedUserId, events } = useCalendar();

  const filteredEvents = useMemo(() => {
    if (!events) return []; // Return empty array if no events
    return events.filter((event) => {
      const eventStartDate = parseISO(event.startDate);
      const eventEndDate = parseISO(event.endDate);

      if (view === "year") {
        const yearStart = new Date(selectedDate.getFullYear(), 0, 1);
        const yearEnd = new Date(
          selectedDate.getFullYear(),
          11,
          31,
          23,
          59,
          59,
          999
        );
        const isInSelectedYear =
          eventStartDate <= yearEnd && eventEndDate >= yearStart;
        const isUserMatch =
          selectedUserId === "all" || event.user.id === selectedUserId;
        return isInSelectedYear && isUserMatch;
      }

      if (view === "month" || view === "agenda") {
        const monthStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        );
        const monthEnd = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        const isInSelectedMonth =
          eventStartDate <= monthEnd && eventEndDate >= monthStart;
        const isUserMatch =
          selectedUserId === "all" || event.user.id === selectedUserId;
        return isInSelectedMonth && isUserMatch;
      }

      if (view === "week") {
        const dayOfWeek = selectedDate.getDay();

        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const isInSelectedWeek =
          eventStartDate <= weekEnd && eventEndDate >= weekStart;
        const isUserMatch =
          selectedUserId === "all" || event.user.id === selectedUserId;
        return isInSelectedWeek && isUserMatch;
      }

      if (view === "day") {
        const dayStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          0,
          0,
          0
        );
        const dayEnd = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          23,
          59,
          59
        );
        const isInSelectedDay =
          eventStartDate <= dayEnd && eventEndDate >= dayStart;
        const isUserMatch =
          selectedUserId === "all" || event.user.id === selectedUserId;
        return isInSelectedDay && isUserMatch;
      }
    });
  }, [selectedDate, selectedUserId, events, view]);

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

  const eventStartDates = useMemo(() => {
    return filteredEvents.map((event) => ({
      ...event,
      endDate: event.startDate,
    }));
  }, [filteredEvents]);

  if (!events) return null; // Move early return after all Hooks

  return (
    <div className="overflow-hidden rounded-xl border">
      <CalendarHeader view={view} events={filteredEvents} />

      <DndProviderWrapper>
        {view === "day" && (
          <CalendarDayView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "month" && (
          <CalendarMonthView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "week" && (
          <CalendarWeekView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "year" && <CalendarYearView allEvents={eventStartDates} />}
        {view === "agenda" && (
          <CalendarAgendaView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
      </DndProviderWrapper>
    </div>
  );
}