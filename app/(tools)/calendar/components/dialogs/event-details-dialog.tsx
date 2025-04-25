// File: components/dialogs/event-details-dialog.tsx
"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, CheckCircle } from "lucide-react";
import { EditEventDialog } from "./edit-event-dialog";
import * as React from "react";
import { useCalendar } from "../../contexts/calendar-context";
import { IEvent } from "../../types";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const { deleteEvent } = useCalendar();
  const [open, setOpen] = React.useState(false);
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(event.id);
        setOpen(false);
      } catch (error) {
        console.error(error);
        alert("Failed to delete event");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="flex items-start gap-2">
              <Calendar className="mt-1 size-4" />
              <div>
                <p className="text-sm font-medium">Scheduled Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4" />
              <div>
                <p className="text-sm font-medium">Deadline</p>
                <p className="text-sm text-muted-foreground">
                  {format(endDate, "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>
          {event.stage && (
            <div className="flex items-center gap-2">
              <CheckCircle className="mt-1 size-4" />
              <div className="flex gap-2">
                <p className="text-sm font-medium">Stage</p>
                <p className="text-sm text-muted-foreground">
                  {event.stage.charAt(0).toUpperCase() +
                    event.stage.slice(1).replace("_", " ") || "N/A"}
                </p>
              </div>
            </div>
          )}
          {event.title && (
            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4" />
              <div>
                <p className="text-sm font-medium">Title</p>
                <p className="text-sm text-muted-foreground">
                  {event.title}
                </p>
              </div>
            </div>
          )}
          {event.userPrompt && (
            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4" />
              <div>
                <p className="text-sm font-medium">Description</p> {/* Changed from User Prompt */}
                <p className="text-sm text-muted-foreground">
                  {event.userPrompt}
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <div className="mr-auto space-x-4">
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
            <EditEventDialog event={event}>
              <Button variant="outline">Edit</Button>
            </EditEventDialog>
          </div>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}