"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, User, CheckCircle } from "lucide-react";
import { EditEventDialog } from "./edit-event-dialog";
import { useState } from "react";
import { useCalendar } from "../../contexts/calendar-context";
import { IEvent } from "../../types";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const { deleteEvent } = useCalendar();
  const [isOpen, setIsOpen] = useState(false);
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(event.id);
        setIsOpen(false);
      } catch (error) {
        console.error(error);
        alert("Failed to delete event");
      }
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      <div className={`fixed inset-0 ${isOpen ? "block" : "hidden"} bg-black/50 z-50`}>
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg max-w-md w-full">
          <h2 className="text-lg font-semibold">{event.title}</h2>
          <div className="space-y-4 mt-4">
            {event.user && (
              <div className="flex items-start gap-2">
                <User className="mt-1 size-4" />
                <div>
                  <p className="text-sm font-medium">Responsible</p>
                  <p className="text-sm text-gray-500">{event.user.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Calendar className="mt-1 size-4" />
              <div>
                <p className="text-sm font-medium">Scheduled Date</p>
                <p className="text-sm text-gray-500">
                  {format(startDate, "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4" />
              <div>
                <p className="text-sm font-medium">Deadline</p>
                <p className="text-sm text-gray-500">
                  {format(endDate, "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-1 size-4" />
              <div>
                <p className="text-sm font-medium">Stage</p>
                <p className="text-sm text-gray-500">
                  {
                  event?.stage?.charAt(0).toUpperCase() +
                  event?.stage?.slice(1).replace("_", " ")
                  || undefined
                }
                </p>
              </div>
            </div>
            {event.description && (
              <div className="flex items-start gap-2">
                <Text className="mt-1 size-4" />
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-gray-500">{event.description}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleDelete}
              className="border border-red-300 rounded px-4 py-2 text-sm text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
            <EditEventDialog event={event}>
              <button className="border rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Edit
              </button>
            </EditEventDialog>
          </div>
        </div>
      </div>
    </>
  );
}