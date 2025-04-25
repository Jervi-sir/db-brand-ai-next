// File: /api/content/voice-over/route.ts
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

  const { contentIds } = await request.json();
  const userId = session.user.id;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 3); // Start 3 days from now
    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() + 7); // 7-day deadline

    const updatedContent = await Promise.all(
      contentIds.map(async (contentId: string, index: number) => {
        const existingContent = await db
          .select()
          .from(content)
          .where(
            and(
              eq(content.id, contentId),
              eq(content.userId, userId)
            )
          );

        if (existingContent.length === 0) {
          throw new Error(`Content ${contentId} not found or unauthorized`);
        }

        const scheduledDate = new Date(startDate);
        scheduledDate.setDate(scheduledDate.getDate() + index); // Schedule sequentially

        return db
          .update(content)
          .set({
            stage: 'voice_over',
            scheduledDate,
            deadline,
            updatedAt: new Date(),
          })
          .where(eq(content.id, contentId))
          .returning({
            id: content.id,
            title: content.title, // Changed from topic
            mood: content.mood,
            generatedScript: content.generatedScript, // Changed from content
            userPrompt: content.userPrompt, // Changed from description
            stage: content.stage,
            scheduledDate: content.scheduledDate,
            deadline: content.deadline,
            createdAt: content.createdAt,
          });
      })
    );

    return NextResponse.json(updatedContent.flat(), { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to schedule voice-overs' }, { status: 500 });
  }
}