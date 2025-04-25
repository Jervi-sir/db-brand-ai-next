"use client";

import { createContext, useContext, useState } from "react";
import { IEvent } from "../types";

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  events: IEvent[];
  setEvents: (events: IEvent[]) => void;
  addEvent: (event: IEvent) => Promise<void>;
  updateEvent: (event: IEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const CalendarContext = createContext<ICalendarContext | undefined>(undefined);

export function CalendarProvider({
  children,
  events: initialEvents,
}: {
  children: React.ReactNode;
  events: IEvent[];
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<IEvent[]>(initialEvents);

  const addEvent = async (event: IEvent) => {
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (response.ok) {
      const newEvent = await response.json();
      setEvents((prev) => [...prev, newEvent]);
    } else {
      throw new Error('Failed to add event');
    }
  };

  const updateEvent = async (event: IEvent) => {
    const response = await fetch(`/api/content/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (response.ok) {
      const updatedEvent = await response.json();
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? updatedEvent : e))
      );
    } else {
      throw new Error('Failed to update event');
    }
  };

  const deleteEvent = async (id: string) => {
    const response = await fetch(`/api/content/${id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } else {
      throw new Error('Failed to delete event');
    }
  };

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        events,
        setEvents,
        addEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}