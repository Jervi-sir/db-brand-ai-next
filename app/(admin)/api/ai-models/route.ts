import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { aiModel } from '@/lib/db/schema';
import { db, savePromptToHistory } from '@/lib/db/queries';

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user) return new Response('Unauthorized', { status: 401 });

  try {
    const models = await db.select().from(aiModel);
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user) return new Response('Unauthorized', { status: 401 });

  try {
    const data = await request.json();
    const [newModel] = await db.insert(aiModel).values(data).returning();

    if (data.customPrompts && typeof data.customPrompts === 'string') {
      await savePromptToHistory(newModel.id, data.customPrompts, session.user.email || undefined);
    }
    return NextResponse.json(newModel);
  } catch (error) {
    console.error('Error creating AI model:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}