// File: /api/content/kanban/route.ts
import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { content } from '@/lib/db/schema';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userContent = await db
      .select({
        id: content.id,
        title: content.title, // Changed from topic
        mood: content.mood,
        columnId: content.stage,
        generatedScript: content.generatedScript, // Changed from content
        scheduledDate: content.scheduledDate,
        deadline: content.deadline,
        stage: content.stage,
        userPrompt: content.userPrompt, // Changed from description
        createdAt: content.createdAt,
      })
      .from(content)
      .where(
        and(
          eq(content.userId, session.user.id),
          inArray(content.stage, ['voice_over', 'creation', 'done'])
        )
      );

    return NextResponse.json(userContent, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}