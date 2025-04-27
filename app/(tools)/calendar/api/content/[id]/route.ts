// File: app/api/calendar/content/[id]/route.ts
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/queries';
import { content } from '@/lib/db/schema';
import { auth } from '@/app/(auth)/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updatedEvent = {
    title: body.title,
    userPrompt: body.userPrompt,
    generatedScript: body.generatedScript,
    updatedAt: new Date(),
  };

  const [event] = await db
    .update(content)
    .set(updatedEvent)
    .where(
      and(
        eq(content.id, id),
        eq(content.userId, session.user.id)
      )
    )
    .returning();

  if (!event) {
    return NextResponse.json({ error: 'Content not found or unauthorized' }, { status: 404 });
  }

  return NextResponse.json({
    id: event.id,
    userId: event.userId,
    title: event.title,
    userPrompt: event.userPrompt,
    generatedScript: event.generatedScript,
    color: event.mood,
    stage: event.stage,
    endDate: event.deadline ? event.deadline.toISOString() : new Date().toISOString(),
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const [deleted] = await db
    .delete(content)
    .where(
      and(
        eq(content.id, id),
        eq(content.userId, session.user.id)
      )
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: 'Content not found or unauthorized' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}