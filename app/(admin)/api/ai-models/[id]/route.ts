import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { aiModel } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { db, savePromptToHistory } from '@/lib/db/queries';

export async function PUT(request: Request) {
  const data = await request.json();
  const session = await auth();
  if (!session || !session.user) return new Response('Unauthorized', { status: 401 });

  const { createdAt, ...updateData } = data;

  try {
    const [updatedModel] = await db
      .update(aiModel)
      .set(updateData)
      .where(eq(aiModel.id, data.id))
      .returning();
    if (!updatedModel) return new Response('Model not found', { status: 404 });
    // Save customPrompts to history if not null
    if (updateData.customPrompts && typeof updateData.customPrompts === 'string') {
      await savePromptToHistory(updatedModel.id, updateData.customPrompts, session.user.email || undefined);
    }
    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error('Error updating AI model:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params; // Await params to access id

    const [deletedModel] = await db
      .delete(aiModel)
      .where(eq(aiModel.id, id))
      .returning();
    if (!deletedModel) return new Response('Model not found', { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}