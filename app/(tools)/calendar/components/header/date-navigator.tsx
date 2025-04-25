import { useMemo } from "react";
import { formatDate } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "../../contexts/calendar-context";
import { getEventsCount, navigateDate, rangeText } from "../../helpers";
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
  view: "month";
  events: IEvent[];
}

export function DateNavigator({ view, events }: IProps) {
  const { selectedDate, setSelectedDate } = useCalendar();
  const month = formatDate(selectedDate, "MMMM");
  const year = selectedDate.getFullYear();
  const eventCount = useMemo(
    () => getEventsCount(events, selectedDate, view),
    [events, selectedDate, view]
  );

  const handlePrevious = () => setSelectedDate(navigateDate(selectedDate, view, "previous"));
  const handleNext = () => setSelectedDate(navigateDate(selectedDate, view, "next"));

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">
          {month} {year}
        </span>
        <span className="border border-gray-300 rounded px-1.5 text-xs">
          {eventCount} events
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="size-6 border border-gray-300 rounded flex items-center justify-center"
          onClick={handlePrevious}
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm text-gray-500">{rangeText(view, selectedDate)}</p>
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