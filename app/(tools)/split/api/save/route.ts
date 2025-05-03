// api/save/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { ContentRepository } from '../../db/repository';
import { SaveRequest, SavedContent } from '../../type';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { title, userPrompt, topicPrompt, content_idea, hook_type, mood, generatedScript, stage }: SaveRequest = await request.json();
    if (!title || !userPrompt || !mood || !generatedScript) {
      return new Response('Title, user prompt, mood, and generated script are required', { status: 400 });
    }

    const repository = new ContentRepository();
    const response = await repository.saveContent({
      userId: session.user.id,
      title,
      userPrompt,
      topicPrompt,
      content_idea,
      hook_type,
      mood,
      generatedScript,
      stage,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error saving script:', error);
    return NextResponse.json({ error: 'Failed to save script' }, { status: 500 });
  }
}