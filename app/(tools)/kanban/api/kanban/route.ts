// File: /api/content/kanban/route.ts
import { NextResponse } from "next/server";
import { and, eq, inArray, gte, lte, isNotNull } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { content } from "@/lib/db/schema";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Validate date parameters
    let fromDate: Date;
    let toDate: Date;
    if (fromParam && toParam) {
      fromDate = new Date(fromParam);
      toDate = new Date(toParam);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 });
      }
    } else {
      // Default to current week if no parameters provided
      fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0); // Start of today
      toDate = new Date(fromDate);
      toDate.setDate(fromDate.getDate() + 6);
    }

    const userContent = await db
      .select({
        id: content.id,
        title: content.title,
        mood: content.mood,
        columnId: content.stage,
        generatedScript: content.generatedScript,
        scheduledDate: content.scheduledDate,
        deadline: content.deadline,
        stage: content.stage,
        userPrompt: content.userPrompt,
        createdAt: content.createdAt,
      })
      .from(content)
      .where(
        and(
          eq(content.userId, session.user.id),
          inArray(content.stage, ["voice_over", "creation", "done"]),
          gte(content.deadline, fromDate), // Deadline on or after fromDate
          lte(content.deadline, toDate), // Deadline on or before toDate
          isNotNull(content.deadline) // Ensure deadline is not null
        )
      )
      .orderBy(content.deadline);

    return NextResponse.json(userContent, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching kanban content:", {
      message: error.message,
      stack: error.stack,
      // fromParam,
      // toParam,
    });
    return NextResponse.json(
      { error: "Failed to fetch content", details: error.message },
      { status: 500 }
    );
  }
}