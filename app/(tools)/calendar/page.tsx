import { ClientContainer } from "./components/client-container";
import { CalendarProvider } from "./contexts/calendar-context";

async function fetchEvents() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/calendar/content`, {
    cache: "no-store",
  });

  if (!response.ok) return [];
  const events = await response.json();
  return events.map((event: any) => ({
    id: event.id,
    title: event.topic,
    description: event.description,
    startDate: event.scheduledDate ? new Date(event.scheduledDate).toISOString() : new Date().toISOString(),
    endDate: event.deadline ? new Date(event.deadline).toISOString() : new Date().toISOString(),
    color: event.mood,
    stage: event.stage,
    content: event.content,
  }));
}

export default async function Page() {
  const events = await fetchEvents();
  return (
    <CalendarProvider events={events}>
      <ClientContainer />
    </CalendarProvider>
  );
}