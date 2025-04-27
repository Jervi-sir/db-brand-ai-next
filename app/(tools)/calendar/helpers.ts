// File: helpers.ts
import {
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { IEvent } from "./types";

interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}

export function rangeText(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
}

export function navigateDate(date: Date, direction: "previous" | "next"): Date {
  return direction === "next" ? addMonths(date, 1) : subMonths(date, 1);
}

export function getEventsCount(events: IEvent[], date: Date): number {
  return events.filter((event) => isSameMonth(new Date(event.endDate), date)).length;
}

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  const totalDays = firstDayOfMonth + daysInMonth;

  const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    currentMonth: false,
    date: new Date(
      currentYear,
      currentMonth - 1,
      daysInPrevMonth - firstDayOfMonth + i + 1
    ),
  }));
  const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(currentYear, currentMonth, i + 1),
  }));
  const nextMonthCells = Array.from(
    { length: (7 - (totalDays % 7)) % 7 },
    (_, i) => ({
      day: i + 1,
      currentMonth: false,
      date: new Date(currentYear, currentMonth + 1, i + 1),
    })
  );

  return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];
}

export function calculateMonthEventPositions(
  multiDayEvents: IEvent[],
  singleDayEvents: IEvent[],
  selectedDate: Date
): Record<string, number> {
  const positions: Record<string, number> = {};

  // Group events by endDate
  const eventsByDate: Record<string, IEvent[]> = {};
  singleDayEvents.forEach((event) => {
    if (!event.id || !event.endDate) {
      return;
    }
    const dateKey = startOfDay(parseISO(event.endDate)).toISOString();
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  // Assign unique positions to events on the same date
  Object.keys(eventsByDate).forEach((dateKey) => {
    const events = eventsByDate[dateKey];
    events.forEach((event, index) => {
      positions[event.id] = index; // Assign position 0, 1, 2, etc.
    });
  });

  return positions;
}

export function getMonthCellEvents(
  cellDate: Date,
  events: IEvent[],
  eventPositions: Record<string, number>
) {
  const filteredEvents = events
    .filter((event) => {
      if (!event.endDate) {
        console.warn("Event missing endDate:", event);
        return false;
      }
      try {
        const eventDate = startOfDay(parseISO(event.endDate));
        const cellDateUTC = startOfDay(cellDate);
        const isMatch = isSameDay(cellDateUTC, eventDate);
        return isMatch;
      } catch (error) {
        return false;
      }
    })
    .map((event) => ({
      ...event,
      position: eventPositions[event.id] ?? 0,
    }))
    .sort((a, b) => a.position - b.position);

  return filteredEvents;
}


