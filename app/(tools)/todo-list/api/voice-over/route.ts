import { NextResponse } from 'next/server';
import { and, eq, gt, inArray } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { content } from '@/lib/db/schema';
import { db } from '@/lib/db/queries';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contentIds } = await request.json();
  const userId = session.user.id;

  if (!Array.isArray(contentIds) || contentIds.length === 0) {
    return NextResponse.json({ error: 'No content IDs provided' }, { status: 400 });
  }

  try {
    const existingContent = await db
      .select({ id: content.id })
      .from(content)
      .where(and(eq(content.userId, userId), inArray(content.id, contentIds)));

    if (existingContent.length !== contentIds.length) {
      return NextResponse.json(
        { error: 'One or more content items not found or unauthorized' },
        { status: 404 }
      );
    }

    const now = new Date();
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);

    const existingTasks = await db
      .select({ deadline: content.deadline })
      .from(content)
      .where(
        and(
          eq(content.userId, userId),
          eq(content.stage, 'todo'), // Check 'todo' tasks
          gt(content.deadline, todayMidnight)
        )
      )
      .orderBy(content.deadline);

    let startSchedulingDate: Date;

    const validDeadlines = existingTasks
      .filter((task) => task.deadline !== null)
      .map((task) => new Date(task.deadline!));

    if (validDeadlines.length === 0) {
      startSchedulingDate = new Date(now);
      startSchedulingDate.setDate(now.getDate() + 3);
      startSchedulingDate.setHours(23, 0, 0, 0);
    } else {
      const latestDeadline = validDeadlines[validDeadlines.length - 1];
      const lastIndex = validDeadlines.length - 1;
      const daysToAddForNext = lastIndex === 0 ? 2 : lastIndex === 1 ? 2 : 3;
      startSchedulingDate = new Date(latestDeadline);
      startSchedulingDate.setDate(latestDeadline.getDate() + daysToAddForNext);
      startSchedulingDate.setHours(23, 0, 0, 0);
    }

    const updatedContent = await Promise.all(
      contentIds.map(async (contentId: string, index: number) => {
        const daysToAdd =
          index === 0 ? 0 : index === 1 ? 2 : index === 2 ? 4 : 3 * index - 2;

        const deadline = new Date(startSchedulingDate);
        deadline.setDate(startSchedulingDate.getDate() + daysToAdd);
        deadline.setHours(23, 0, 0, 0);

        return db
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
      })
    );

    const flattenedContent = updatedContent.flat();

    return NextResponse.json(flattenedContent, { status: 200 });
  } catch (error) {
    console.error('Error scheduling tasks:', error);
    return NextResponse.json({ error: 'Failed to schedule tasks' }, { status: 500 });
  }
}