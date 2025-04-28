import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';
import { content } from '@/lib/db/schema';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    const userContent = await db
      .select({
        id: content.id,
        title: content.title,
        mood: content.mood,
        generatedScript: content.generatedScript,
        userPrompt: content.userPrompt,
        stage: content.stage,
        scheduledDate: content.scheduledDate,
        deadline: content.deadline,
        createdAt: content.createdAt,
      })
      .from(content)
      .where(and(eq(content.userId, session.user.id), eq(content.stage, 'script')))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql`count(*)` })
      .from(content)
      .where(and(eq(content.userId, session.user.id), eq(content.stage, 'script')));

    return NextResponse.json({
      scripts: userContent,
      total: Number(total[0].count),
      page,
      limit,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch scripts' }, { status: 500 });
  }
}