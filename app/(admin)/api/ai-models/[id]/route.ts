import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { aiModel } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/queries';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user) return new Response('Unauthorized', { status: 401 });

  try {
    const data = await request.json();
    const [updatedModel] = await db
      .update(aiModel)
      .set(data)
      .where(eq(aiModel.id, params.id))
      .returning();
    if (!updatedModel) return new Response('Model not found', { status: 404 });
    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error('Error updating AI model:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user) return new Response('Unauthorized', { status: 401 });

  try {
    const [deletedModel] = await db
      .delete(aiModel)
      .where(eq(aiModel.id, params.id))
      .returning();
    if (!deletedModel) return new Response('Model not found', { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting AI model:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}