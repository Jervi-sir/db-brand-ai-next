import { formatDate } from "date-fns";
import { useCalendar } from "../../contexts/calendar-context";

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