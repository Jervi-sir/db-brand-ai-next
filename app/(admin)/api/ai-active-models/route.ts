import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { aiModel } from '@/lib/db/schema';
import { db } from '@/lib/db/queries';
import { eq } from 'drizzle-orm'; // Import eq for filtering

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const activeModels = await db
      .select()
      .from(aiModel)
      .where(eq(aiModel.isActive, true)); // Filter for active models
    return NextResponse.json(activeModels);
  } catch (error) {
    console.error('Error fetching active AI models:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}