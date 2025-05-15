// app/(tools)/split-v2/api/prompt-history/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/queries';
import { generatedSplitHistory } from '@/lib/db/schema';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }
    const history = await db
      .select()
      .from(generatedSplitHistory)
      .where(
        and(
          eq(generatedSplitHistory.userId, session.user.id),
          eq(generatedSplitHistory.isDeleted, false)
        )
      )
      .orderBy(desc(generatedSplitHistory.timestamp))
      .limit(20);
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching prompt history:', error);
    return NextResponse.json({ error: 'Failed to fetch prompt history', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }
    const { id } = await request.json();
    if (!id) {
      return new Response('ID is required', { status: 400 });
    }
    await db
      .update(generatedSplitHistory)
      .set({ isDeleted: true })
      .where(
        and(
          eq(generatedSplitHistory.id, id),
          eq(generatedSplitHistory.userId, session.user.id)
        )
      );
    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json({ error: 'Failed to delete prompt', details: error.message }, { status: 500 });
  }
}