import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { content } from '@/lib/db/schema';
import type { NextRequest } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { generatedScript, stage } = await request.json();
  const { id } = await params; // Destructure id directly

  try {
    const updated = await db
      .update(content)
      .set({
        ...(generatedScript && { generatedScript }),
        ...(stage && { stage }),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(content.id, id),
          eq(content.userId, session.user.id)
        )
      )
      .returning({
        id: content.id,
        title: content.title,
        mood: content.mood,
        generatedScript: content.generatedScript,
        userPrompt: content.userPrompt,
        stage: content.stage,
        scheduledDate: content.scheduledDate,
        deadline: content.deadline,
        createdAt: content.createdAt,
      });

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Content not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params; // Destructure id directly

  try {
    const deleted = await db
      .delete(content)
      .where(
        and(
          eq(content.id, id),
          eq(content.userId, session.user.id)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Content not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Content deleted' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}