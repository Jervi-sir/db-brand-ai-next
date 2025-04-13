import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { eq } from 'drizzle-orm';
import { codes } from '@/lib/db/schema';
import { db } from '@/lib/db/queries';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params; // Await params to access id
    const { code, maxUses, isActive } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const result = await db
      .update(codes)
      .set({
        code,
        maxUses: maxUses ? parseInt(maxUses, 10) : null,
        isActive,
      })
      .where(eq(codes.id, id))
      .returning({ id: codes.id });

    if (result.length === 0) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Code updated' }, { status: 200 });
  } catch (error) {
    console.error('Update code error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
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
    const result = await db
      .delete(codes)
      .where(eq(codes.id, id))
      .returning({ id: codes.id });

    if (result.length === 0) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Code deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete code error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}