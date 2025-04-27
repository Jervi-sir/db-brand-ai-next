// File: app/api/calendar/route.ts
import { NextResponse } from "next/server";
import { and, eq, not, ilike, asc, gte, lte } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { content } from "@/lib/db/schema";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // Expecting YYYY-MM format

  if (!month) {
    return NextResponse.json({ error: "Month parameter required" }, { status: 400 });
  }

  try {
    const currentMonth = new Date(`${month}-01T00:00:00.000Z`);
    // Calculate start of previous month
    const startOfRange = new Date(currentMonth);
    startOfRange.setMonth(startOfRange.getMonth() - 1);
    startOfRange.setDate(1);
    // Calculate end of next month
    const endOfRange = new Date(currentMonth);
    endOfRange.setMonth(endOfRange.getMonth() + 2);
    endOfRange.setDate(0);

    const events = await db
      .select({
        id: content.id,
        userId: content.userId,
        title: content.title,
        userPrompt: content.userPrompt,
        mood: content.mood,
        generatedScript: content.generatedScript,
        stage: content.stage,
        deadline: content.deadline,
        createdAt: content.createdAt,
      })
      .from(content)
      .where(
        and(
          eq(content.userId, session.user.id),
          not(ilike(content.stage, "script")),
          gte(content.deadline, startOfRange),
          lte(content.deadline, endOfRange)
        )
      )
      .orderBy(asc(content.deadline));

    const formattedEvents = events
      .filter((event) => event.deadline !== null)
      .map((event) => ({
        id: event.id,
        userId: event.userId,
        title: event.title,
        userPrompt: event.userPrompt,
        generatedScript: event.generatedScript,
        color: event.mood || "blue",
        stage: event.stage,
        endDate: event.deadline!.toISOString(),
      }));

    return NextResponse.json(formattedEvents);
  } catch (error: any) {
    console.error("Error fetching calendar events:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch calendar events", details: error.message },
      { status: 500 }
    );
  }
}