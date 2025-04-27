// File: components/ui/week-picker.tsx
"use client";

import * as React from "react";
import { addDays, format, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface WeekPickerProps {
  className?: string;
  selectedWeek: { from: Date; to: Date };
  onWeekChange: (week: { from: Date; to: Date }) => void;
}

export function WeekPicker({ className, selectedWeek, onWeekChange }: WeekPickerProps) {
  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    const from = startOfDay(date);
    const to = addDays(from, 6); // Fixed 7-day range (0 to 6)
    onWeekChange({ from, to });
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="week"
            variant={"outline"}
            className={cn(
              "w-[250px] justify-start text-left font-normal",
              !selectedWeek && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedWeek?.from && selectedWeek?.to ? (
              <>
                {format(selectedWeek.from, "LLL dd, y")} -{" "}
                {format(selectedWeek.to, "LLL dd, y")}
              </>
            ) : (
              <span>Select a week</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single" // Single date selection
            defaultMonth={selectedWeek?.from}
            selected={selectedWeek?.from}
            onSelect={handleSelect}
            numberOfMonths={1} // Single month for simplicity
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}