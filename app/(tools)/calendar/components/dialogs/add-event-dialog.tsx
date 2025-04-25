"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCalendar } from "../../contexts/calendar-context";

interface IFormData {
  title: string;
  description: string;
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  color: string;
  stage: string;
}

interface IProps {
  children: React.ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
}

export function AddEventDialog({ children, startDate, startTime }: IProps) {
  const { addEvent } = useCalendar();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<IFormData>({
    defaultValues: {
      title: "",
      description: "",
      startDate: startDate || new Date(),
      startTime: startTime
        ? `${startTime.hour.toString().padStart(2, "0")}:${startTime.minute
            .toString()
            .padStart(2, "0")}`
        : "09:00",
      endDate: startDate || new Date(),
      endTime: "10:00",
      color: "blue",
      stage: "script",
    },
  });

  const onSubmit = async (values: IFormData) => {
    const [startHour, startMinute] = values.startTime.split(":").map(Number);
    const [endHour, endMinute] = values.endTime.split(":").map(Number);

    const startDateTime = new Date(values.startDate);
    startDateTime.setHours(startHour, startMinute);

    const endDateTime = new Date(values.endDate);
    endDateTime.setHours(endHour, endMinute);

    try {
      await addEvent({
        id: crypto.randomUUID(),
        title: values.title,
        description: values.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        color: values.color,
        stage: values.stage,
        content: values.description,
      });
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      alert("Failed to add event");
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      <div className={`fixed inset-0 ${isOpen ? "block" : "hidden"} bg-black/50 z-50`}>
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg max-w-md w-full">
          <h2 className="text-lg font-semibold mb-4">Add New Event</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Topic
              </label>
              <input
                {...form.register("title", { required: "Topic is required" })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="Enter a topic"
              />
              {form.formState.errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  {...form.register("startDate", {
                    required: "Scheduled date is required",
                    valueAsDate: true,
                  })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
                {form.formState.errors.startDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  type="time"
                  {...form.register("startTime", {
                    required: "Start time is required",
                  })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
                {form.formState.errors.startTime && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.startTime.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Deadline
                </label>
                <input
                  type="date"
                  {...form.register("endDate", {
                    required: "Deadline is required",
                    valueAsDate: true,
                  })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
                {form.formState.errors.endDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  {...form.register("endTime", {
                    required: "End time is required",
                  })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
                {form.formState.errors.endTime && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.endTime.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mood
              </label>
              <select
                {...form.register("color", { required: "Mood is required" })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {["blue", "green", "red", "yellow", "purple", "orange", "gray"].map(
                  (color) => (
                    <option key={color} value={color}>
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </option>
                  )
                )}
              </select>
              {form.formState.errors.color && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.color.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Stage
              </label>
              <select
                {...form.register("stage", { required: "Stage is required" })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {["script", "voice_over", "creation", "done"].map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1).replace("_", " ")}
                  </option>
                ))}
              </select>
              {form.formState.errors.stage && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.stage.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...form.register("description", {
                  required: "Description is required",
                })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                rows={4}
                placeholder="Enter a description"
              />
              {form.formState.errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="border border-gray-300 rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white rounded px-4 py-2 text-sm hover:bg-blue-700"
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}