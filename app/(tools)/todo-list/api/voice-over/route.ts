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
    // Verify that all provided content IDs belong to the user
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

    // Get today's midnight for comparison
    const now = new Date();
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);

    // Fetch all future deadlines for the user's 'voice_over' content
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
      .orderBy(content.deadline);

    let startSchedulingDate: Date;

    // Filter valid (non-null) future deadlines
    const validDeadlines = existingTasks
      .filter((task) => task.deadline !== null)
      .map((task) => new Date(task.deadline!));

    if (validDeadlines.length > 0) {
      // If there are future deadlines, start scheduling after the latest one
      const latestDeadline = validDeadlines[validDeadlines.length - 1];
      startSchedulingDate = new Date(latestDeadline);
      startSchedulingDate.setDate(latestDeadline.getDate() + 2); // Start on the next alternate day
      startSchedulingDate.setHours(23, 0, 0, 0);
    } else {
      // No future deadlines; check for deadlines from two days ago
      const twoDaysAgo = new Date(todayMidnight);
      twoDaysAgo.setDate(todayMidnight.getDate() - 2);

      const recentTasks = await db
        .select({ deadline: content.deadline })
        .from(content)
        .where(
          and(
            eq(content.userId, userId),
            eq(content.stage, 'voice_over'),
            gt(content.deadline, twoDaysAgo)
          )
        );

      const recentDeadlines = recentTasks
        .filter((task) => task.deadline !== null)
        .map((task) => new Date(task.deadline!));

      if (recentDeadlines.length > 0) {
        // If there are recent deadlines, start scheduling from the latest one
        const latestRecentDeadline = recentDeadlines[recentDeadlines.length - 1];
        startSchedulingDate = new Date(latestRecentDeadline);
        startSchedulingDate.setDate(latestRecentDeadline.getDate() + 2); // Next alternate day
        startSchedulingDate.setHours(23, 0, 0, 0);
      } else {
        // No recent deadlines; start scheduling from 3 days ahead
        startSchedulingDate = new Date(todayMidnight);
        startSchedulingDate.setDate(todayMidnight.getDate() + 3);
        startSchedulingDate.setHours(23, 0, 0, 0);
      }
    }

    // Schedule each content item on alternate days
    const updatedContent = await Promise.all(
      contentIds.map(async (contentId: string, index: number) => {
        const deadline = new Date(startSchedulingDate);
        deadline.setDate(startSchedulingDate.getDate() + 2 * index); // Alternate days (every 2 days)
        deadline.setHours(23, 0, 0, 0);

        return db
          .update(content)
          .set({
            stage: 'voice_over',
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