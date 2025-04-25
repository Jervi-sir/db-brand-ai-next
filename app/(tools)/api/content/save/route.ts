import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { db } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';
import { content } from '@/lib/db/schema';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { topic, description, mood, content: scriptContent } = await request.json();
  const userId = session.user.id;

  try {
    const newContent = await db
      .insert(content)
      .values({
        userId,
        topic,
        description,
        mood,
        content: scriptContent,
        stage: 'script',
      })
      .returning();

    return NextResponse.json(newContent[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}