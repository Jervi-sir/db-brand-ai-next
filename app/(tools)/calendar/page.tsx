// File: page.tsx
'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ClientContainer } from "./client-container";
import { CalendarProvider } from "./calendar-context";
import { TEventColor } from "./types";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface IEvent {
  id: string | number;
  userId?: string;
  title: string;
  userPrompt?: string;
  endDate: string;
  color: TEventColor;
  stage?: string;
  generatedScript?: string;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchEvents = async (month: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/calendar/api/content?month=${month}`, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/signin");
          return;
        }
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();
      const defaultDate = addDays(new Date(), 7).toISOString();
      const formattedEvents = data.map((event: any) => {
        const endDate = event.endDate && !isNaN(new Date(event.endDate).getTime())
          ? new Date(event.endDate).toISOString()
          : defaultDate;
        return {
          id: event.id,
          userId: event.userId,
          title: event.title,
          userPrompt: event.userPrompt,
          endDate,
          color: (event.color || "blue") as TEventColor,
          stage: event.stage,
          generatedScript: event.generatedScript,
        };
      });

      setEvents(formattedEvents);
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session])

  useEffect(() => {
    if (status === "loading") return;

    const month = format(selectedDate, "yyyy-MM");
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("month", month);
    window.history.replaceState(null, "", newUrl.toString());

    fetchEvents(month);
  }, [status, selectedDate, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin size-6 mr-2" />
        <p className="text-lg font-semibold">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <CalendarProvider
      events={events}
      enableDnd={false}
      initialSelectedDate={selectedDate}
    >
      <ClientContainer setSelectedDate={setSelectedDate} />
    </CalendarProvider>
  );
}
