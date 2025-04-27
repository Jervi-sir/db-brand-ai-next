// File: types.ts
export type TEventColor = "blue" | "green" | "red" | "yellow" | "purple" | "orange" | "gray" | "Serious";

export interface IEvent {
  id: string | number;
  userId?: string;
  title: string;
  userPrompt?: string;
  endDate: string;
  color: TEventColor;
  stage?: string;
  generatedScript?: string;
  description?: string;
  user?: { id: string; name: string };
}

export const colorClasses: Record<string, string> = {
  voice_over: "border-blue-800 bg-blue-700 text-blue-50",
  done: "border-green-800 bg-green-700 text-green-50",
  creation: "border-purple-800 bg-purple-700 text-purple-50",
  default: "border-gray-800 bg-gray-700 text-gray-50",
};
