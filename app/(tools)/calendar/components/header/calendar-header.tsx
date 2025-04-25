import { DateNavigator } from "./date-navigator";
import { TodayButton } from "./today-button";
import { IEvent } from "../../types";

interface IProps {
  view: "month";
  events: IEvent[];
}

export function CalendarHeader({ view, events }: IProps) {
  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center justify-between gap-3 flex-1">
        {/* <TodayButton /> */}
        <DateNavigator view={view} events={events} />
      </div>
    </div>
  );
}