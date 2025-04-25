import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/node-postgres';
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
        topic: content.topic,
        mood: content.mood,
        columnId: content.stage,
        content: content.content,
        scheduledDate: content.scheduledDate,
        deadline: content.deadline,
        stage: content.stage,
        description: content.description,
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