// File: types.ts
export type TCalendarView = "month";
export type TEventColor =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "orange"
  | "gray";

export interface IEvent {
  id: string;
  userId?: string; // Changed from user_id to match database
  title: string;
  userPrompt: string;
  color: TEventColor; // Use TEventColor for type safety
  generatedScript: string;
  stage: string;
  startDate: string; // Changed from scheduledDate for consistency
  endDate: string; // Changed from deadline for consistency
}