// File: calendar-context.tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { format, parseISO, min } from "date-fns";
import { IEvent } from "./types";

interface ICalendarContext {
  view: "month";
  events: IEvent[];
  selectedDate: Date;
  enableDnd: boolean;
  setView: (view: "month") => void;
  setEvents: (events: IEvent[]) => void;
  setSelectedDate: (date: Date) => void;
  updateEvent: (event: IEvent) => Promise<void>;
  deleteEvent: (eventId: string | number) => Promise<void>;
}

const CalendarContext = createContext<ICalendarContext | undefined>(undefined);

interface IProps {
  children: React.ReactNode;
  events: IEvent[];
  enableDnd: boolean;
  initialSelectedDate?: Date; // Add prop for initial selected date
}

interface IState {
  view: "month";
  events: IEvent[];
  selectedDate: Date;
}

type Action =
  | { type: "SET_VIEW"; payload: "month" }
  | { type: "SET_EVENTS"; payload: IEvent[] }
  | { type: "SET_SELECTED_DATE"; payload: Date }
  | { type: "UPDATE_EVENT"; payload: IEvent }
  | { type: "DELETE_EVENT"; payload: string | number };

function reducer(state: IState, action: Action): IState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.payload };
    case "SET_EVENTS":
      return { ...state, events: action.payload };
    case "SET_SELECTED_DATE":
      return { ...state, selectedDate: action.payload };
    case "UPDATE_EVENT": {
      const events = state.events.map((event) =>
        event.id === action.payload.id ? action.payload : event
      );
      return { ...state, events };
    }
    case "DELETE_EVENT": {
      const events = state.events.filter((event) => event.id !== action.payload);
      return { ...state, events };
    }
    default:
      return state;
  }
}

export function CalendarProvider({ children, events, enableDnd, initialSelectedDate }: IProps) {
  const initialSelectedDateMemo = useMemo(() => {
    const validDates = events
      .filter((event) => event.endDate)
      .map((event) => parseISO(event.endDate));
    const minDate = validDates.length > 0 ? min(validDates) : new Date();
    return initialSelectedDate || minDate;
  }, [events, initialSelectedDate]);

  const [state, dispatch] = useReducer(reducer, {
    view: "month",
    events,
    selectedDate: initialSelectedDateMemo,
  });

  useEffect(() => {
    dispatch({ type: "SET_EVENTS", payload: events });
  }, [events]);

  const setView = useCallback((view: "month") => {
    dispatch({ type: "SET_VIEW", payload: view });
  }, []);

  const setEvents = useCallback((newEvents: IEvent[]) => {
    dispatch({ type: "SET_EVENTS", payload: newEvents });
  }, []);

  const setSelectedDate = useCallback((date: Date) => {
    dispatch({ type: "SET_SELECTED_DATE", payload: date });
  }, []);

  const updateEvent = useCallback(async (event: IEvent) => {
    try {
      const response = await fetch(`/calendar/api/content/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!response.ok) throw new Error("Failed to update event");
      dispatch({ type: "UPDATE_EVENT", payload: event });
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string | number) => {
    try {
      const response = await fetch(`/calendar/api/content/${eventId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete event");
      dispatch({ type: "DELETE_EVENT", payload: eventId });
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setView,
      setEvents,
      setSelectedDate,
      updateEvent,
      deleteEvent,
      enableDnd,
    }),
    [state, setView, setEvents, setSelectedDate, updateEvent, deleteEvent, enableDnd]
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
}

