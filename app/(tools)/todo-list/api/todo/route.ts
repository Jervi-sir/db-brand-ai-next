import { NextResponse } from 'next/server';
import { and, eq, gte, inArray, notInArray } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { content } from '@/lib/db/schema';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const excludeParam = searchParams.get('exclude');
    const excludeIds = excludeParam ? excludeParam.split(',').filter((id) => id) : [];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

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
          inArray(content.stage, ['voice_over', 'creation']),
          gte(content.deadline, yesterday),
          excludeIds.length > 0 ? notInArray(content.id, excludeIds) : undefined
        )
      )
      .orderBy(content.deadline)
      .limit(3);

    // Ensure unique tasks by ID
    const uniqueContent = Array.from(
      new Map(userContent.map((item) => [item.id, item])).values()
    );
    return NextResponse.json(uniqueContent.slice(0, 3), { status: 200 });
  } catch (error: any) {
    console.error('Error fetching to-do content:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Failed to fetch content', details: error.message },
      { status: 500 }
    );
  }
}