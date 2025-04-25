"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface IProps {
  children: React.ReactNode;
}

export function DndProviderWrapper({ children }: IProps) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}