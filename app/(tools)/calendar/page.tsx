// File: page.tsx
import { ClientContainer } from "./components/client-container";
import { CalendarProvider } from "./contexts/calendar-context";
import { TEventColor } from "./types";

async function fetchEvents() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/calendar/content`, {
    cache: "no-store",
  });
  if (!response.ok) return [];
  const events = await response.json();
  const defaultDate = new Date().toISOString();
  return events.map((event: any) => ({
    id: event.id,
    userId: event.userId,
    title: event.title,
    userPrompt: event.userPrompt,
    startDate: event.scheduledDate ? new Date(event.scheduledDate).toISOString() : defaultDate,
    endDate: event.deadline ? new Date(event.deadline).toISOString() : defaultDate,
    color: (event.mood || "blue") as TEventColor,
    stage: event.stage,
    generatedScript: event.generatedScript,
  }));
}

export default async function Page() {
  const events = await fetchEvents();
  return (
    <CalendarProvider events={events} enableDnd={false}>
      <ClientContainer />
    </CalendarProvider>
  );
}