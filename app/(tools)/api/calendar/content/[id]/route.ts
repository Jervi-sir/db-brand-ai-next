// File: app/api/calendar/content/[id]/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/queries';
import { content } from '@/lib/db/schema';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    .where(eq(content.id, id))
    .returning();

  // Ensure the response matches IEvent interface
  return NextResponse.json({
    id: event.id,
    userId: event.userId,
    title: event.title,
    userPrompt: event.userPrompt,
    generatedScript: event.generatedScript,
    color: event.mood, // Map mood to color
    stage: event.stage,
    startDate: event.scheduledDate ? event.scheduledDate.toISOString() : new Date().toISOString(),
    endDate: event.deadline ? event.deadline.toISOString() : new Date().toISOString(),
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(content).where(eq(content.id, id));
  return NextResponse.json({ success: true });
}