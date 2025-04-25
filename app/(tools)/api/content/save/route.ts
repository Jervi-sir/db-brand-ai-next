// app/api/content/save/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { content } from '@/lib/db/schema';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse the request body
    const { title, userPrompt, mood, generatedScript, stage, scheduledDate, deadline } = await request.json();

    if (!title || !userPrompt || !mood || !generatedScript) {
      return new Response('Title, user prompt, mood, and generated script are required', { status: 400 });
    }

    // Insert the new content into the database
    const [newContent] = await db
      .insert(content)
      .values({
        userId: session.user.id,
        title,
        userPrompt,
        mood,
        generatedScript,
        stage: 'script',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Return the saved content in the format expected by the calendar
    return NextResponse.json({
      id: newContent.id,
      userId: newContent.userId,
      title: newContent.title,
      userPrompt: newContent.userPrompt,
      generatedScript: newContent.generatedScript,
      color: newContent.mood, // Map mood to color for calendar
      stage: newContent.stage,
      startDate: newContent.scheduledDate ? newContent.scheduledDate.toISOString() : new Date().toISOString(),
      endDate: newContent.deadline ? newContent.deadline.toISOString() : new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving script:', error);
    return NextResponse.json(
      { error: 'Failed to save script' },
      { status: 500 }
    );
  }
}