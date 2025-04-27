// File: app/api/content/voice-over/reschedule-date/route.ts
import { NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { content } from '@/lib/db/schema';
import { db } from '@/lib/db/queries';
import { addDays } from 'date-fns';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Find existing voice_over tasks with deadlines after today
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
      );

    console.log('Existing voice_over tasks after today:', {
      taskCount: existingTasks.length,
      deadlines: existingTasks.map((t) => t.deadline?.toISOString()),
    });

    let suggestedDate: Date;

    const validDeadlines = existingTasks
      .filter((task) => task.deadline !== null)
      .map((task) => new Date(task.deadline!));

    if (validDeadlines.length === 0) {
      // No tasks with deadlines after today, start 1 day from now
      suggestedDate = addDays(now, 1);
      suggestedDate.setHours(23, 0, 0, 0);
    } else {
      // Find the latest deadline and add 2 days
      const latestDeadline = validDeadlines.reduce((latest, taskDeadline) =>
        taskDeadline > latest ? taskDeadline : latest
      );
      suggestedDate = addDays(latestDeadline, 2);
      suggestedDate.setHours(23, 0, 0, 0);
    }

    // Apply gap logic for the first task (index 0)
    const index = 0;
    const daysToAdd = index === 0 ? 0 : index === 1 ? 2 : index === 2 ? 4 : 3 * index - 2;
    suggestedDate.setDate(suggestedDate.getDate() + daysToAdd);

    console.log('Suggested reschedule date:', suggestedDate.toISOString());

    return NextResponse.json({
      suggestedDate: suggestedDate.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching suggested reschedule date:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggested reschedule date' },
      { status: 500 }
    );
  }
}