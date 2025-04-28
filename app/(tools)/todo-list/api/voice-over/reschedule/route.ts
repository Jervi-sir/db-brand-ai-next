import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { content } from '@/lib/db/schema';
import { db } from '@/lib/db/queries';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contentId, newDeadline } = await request.json();
  const userId = session.user.id;

  if (!contentId || !newDeadline) {
    return NextResponse.json(
      { error: 'Content ID and new deadline are required' },
      { status: 400 }
    );
  }

  try {
    const existingContent = await db
      .select({ id: content.id })
      .from(content)
      .where(and(eq(content.userId, userId), eq(content.id, contentId)));

    if (existingContent.length === 0) {
      return NextResponse.json(
        { error: 'Content item not found or unauthorized' },
        { status: 404 }
      );
    }

    const deadline = new Date(newDeadline);
    deadline.setHours(23, 0, 0, 0);

    const [updatedContent] = await db
      .update(content)
      .set({
        stage: 'todo', // Set to 'todo'
        deadline,
        scheduledDate: null,
        updatedAt: new Date(),
      })
      .where(and(eq(content.id, contentId), eq(content.userId, userId)))
      .returning({
        id: content.id,
        title: content.title,
        mood: content.mood,
        generatedScript: content.generatedScript,
        userPrompt: content.userPrompt,
        stage: content.stage,
        scheduledDate: content.scheduledDate,
        deadline: content.deadline,
        createdAt: content.createdAt,
      });

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Error rescheduling task:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule task' },
      { status: 500 }
    );
  }
}