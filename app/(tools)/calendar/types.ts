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
  startDate: string;
  endDate: string;
  title: string;
  color: string;
  description?: string;
  stage?: string;
  content?: string;
}