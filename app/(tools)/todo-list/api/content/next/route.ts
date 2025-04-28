import { NextResponse } from 'next/server';
import { and, eq, notInArray, inArray } from 'drizzle-orm';
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

    const scripts = await db
      .select({
        id: content.id,
        title: content.title,
        mood: content.mood,
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
          inArray(content.stage, ['voice_over', 'creation']), // Filter for voice_over or creation
          excludeIds.length > 0 ? notInArray(content.id, excludeIds) : undefined
        )
      )
      .orderBy(content.createdAt)
      .limit(1);

    return NextResponse.json(scripts[0] || null, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching next script:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Failed to fetch next script', details: error.message },
      { status: 500 }
    );
  }
}