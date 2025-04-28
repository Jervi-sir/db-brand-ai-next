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
      );

    let suggestedDate: Date;

    const validDeadlines = existingTasks
      .filter((task) => task.deadline !== null)
      .map((task) => new Date(task.deadline!));

    if (validDeadlines.length === 0) {
      suggestedDate = addDays(now, 1);
      suggestedDate.setHours(23, 0, 0, 0);
    } else {
      const latestDeadline = validDeadlines.reduce((latest, taskDeadline) =>
        taskDeadline > latest ? taskDeadline : latest
      );
      suggestedDate = addDays(latestDeadline, 2);
      suggestedDate.setHours(23, 0, 0, 0);
    }

    const index = 0;
    const daysToAdd = index === 0 ? 0 : index === 1 ? 2 : index === 2 ? 4 : 3 * index - 2;
    suggestedDate.setDate(suggestedDate.getDate() + daysToAdd);

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