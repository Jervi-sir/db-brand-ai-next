// File: app/api/content/voice-over/route.ts
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
    // Validate that all contentIds belong to the user
    const existingContent = await db
      .select({ id: content.id })
      .from(content)
      .where(
        and(
          eq(content.userId, userId),
          inArray(content.id, contentIds)
        )
      );

    if (existingContent.length !== contentIds.length) {
      return NextResponse.json(
        { error: 'One or more content items not found or unauthorized' },
        { status: 404 }
      );
    }

    // Find existing voice_over tasks with deadlines after today, ordered by deadline
    const now = new Date();
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);

    const existingTasks = await db
      .select({ deadline: content.deadline })
      .from(content)
      .where(
        and(
          eq(content.userId, userId),
          eq(content.stage, 'voice_over'),
          gt(content.deadline, todayMidnight)
        )
      )
      .orderBy(content.deadline); // Order by deadline to get the sequence

    let startSchedulingDate: Date;

    const validDeadlines = existingTasks
      .filter((task) => task.deadline !== null)
      .map((task) => new Date(task.deadline!));

    if (validDeadlines.length === 0) {
      // No tasks with deadlines after today, start 3 days from now
      startSchedulingDate = new Date(now);
      startSchedulingDate.setDate(now.getDate() + 3);
      startSchedulingDate.setHours(23, 0, 0, 0); // Set to 23:00:00
    } else {
      // Get the latest deadline
      const latestDeadline = validDeadlines[validDeadlines.length - 1];
      // Calculate the next index in the pattern based on the number of existing tasks
      const lastIndex = validDeadlines.length - 1;
      // The next task should follow the pattern: 0, 2, 4, 7, 10, ...
      const daysToAddForNext = lastIndex === 0 ? 2 : lastIndex === 1 ? 2 : 3;
      startSchedulingDate = new Date(latestDeadline);
      startSchedulingDate.setDate(latestDeadline.getDate() + daysToAddForNext);
      startSchedulingDate.setHours(23, 0, 0, 0); // Set to 23:00:00
    }

    // Update tasks with new deadlines, scheduling with custom gaps
    const updatedContent = await Promise.all(
      contentIds.map(async (contentId: string, index: number) => {
        // Calculate deadline based on the pattern: 0, 2, 4, 7, 10, ...
        const daysToAdd =
          index === 0
            ? 0
            : (
              index === 1
                ? 2
                : (
                  index === 2
                    ? 4
                    : (
                      3 * index - 2
                    )
                )
            );

        const deadline = new Date(startSchedulingDate);
        deadline.setDate(startSchedulingDate.getDate() + daysToAdd);
        deadline.setHours(23, 0, 0, 0); // Set to 23:00:00

        return db
          .update(content)
          .set({
            stage: 'voice_over',
            deadline,
            scheduledDate: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(content.id, contentId),
              eq(content.userId, userId)
            )
          )
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
    console.error('Error scheduling voice-overs:', error);
    return NextResponse.json({ error: 'Failed to schedule voice-overs' }, { status: 500 });
  }
}