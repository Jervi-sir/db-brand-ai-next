import { Plus } from "lucide-react";
import { AddEventDialog } from "../dialogs/add-event-dialog";
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
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </div>
      <AddEventDialog>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md">
          <Plus />
          Add Event
        </button>
      </AddEventDialog>
    </div>
  );
}