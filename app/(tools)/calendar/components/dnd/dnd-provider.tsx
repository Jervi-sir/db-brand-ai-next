"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useCalendar } from "../../contexts/calendar-context";

interface IProps {
  children: React.ReactNode;
}

export function DndProviderWrapper({ children }: IProps) {
  const { enableDnd } = useCalendar();

  if (!enableDnd) {
    return <>{children}</>;
  }

  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}