import { db } from '@/lib/db/queries';
import { content } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { ne } from 'drizzle-orm';

export async function GET() {
  const events = await db.select().from(content).where(ne(content.stage, 'script'));
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newEvent = {
    title: body.title,
    description: body.userPrompt,
    mood: body.color,
    content: body.generatedScript,
    stage: body.stage || 'script',
    scheduledDate: body.startDate ? new Date(body.startDate) : null,
    deadline: body.endDate ? new Date(body.endDate) : null,
  };

  const [createdEvent] = await db.insert(content).values(newEvent as any).returning();
  return NextResponse.json(createdEvent);
}