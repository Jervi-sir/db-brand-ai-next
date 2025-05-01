// app/split/api/save/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/queries';
import { content } from '@/lib/db/schema';
import { auth } from '@/app/(auth)/auth';

// TypeScript interfaces
interface SaveRequest {
  title: string;
  userPrompt: string;
  mood: string;
  generatedScript: string;
  stage: string;
}

interface SavedContent {
  id: string;
  userId: string;
  title: string;
  userPrompt: string;
  generatedScript: string;
  mood: string;
  stage: string;
}

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse the request body
    const { title, userPrompt, mood, generatedScript, stage }: SaveRequest = await request.json();

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
        stage,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Return the saved content
    const response: SavedContent = {
      id: newContent.id,
      userId: newContent.userId,
      title: newContent.title,
      userPrompt: newContent.userPrompt,
      generatedScript: newContent.generatedScript,
      mood: newContent.mood,
      stage: newContent.stage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error saving script:', error);
    return NextResponse.json(
      { error: 'Failed to save script' },
      { status: 500 }
    );
  }
}