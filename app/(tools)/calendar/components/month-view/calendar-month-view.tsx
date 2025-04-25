import { useMemo } from "react";
import { useCalendar } from "../../contexts/calendar-context";
import { DayCell } from "./day-cell";
import { getCalendarCells, calculateMonthEventPositions } from "../../helpers";
import { IEvent } from "../../types";

// interface IEvent {
//   id: string | number;
//   startDate: string;
//   endDate: string;
//   title: string;
//   color: string;
//   description?: string;
//   user?: { id: string; name: string };

// }

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ singleDayEvents, multiDayEvents }: IProps) {
  const { selectedDate } = useCalendar();
  const allEvents = [...multiDayEvents, ...singleDayEvents];
  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);
  const eventPositions = useMemo(
    () => calculateMonthEventPositions(multiDayEvents, singleDayEvents, selectedDate),
    [multiDayEvents, singleDayEvents, selectedDate]
  );

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