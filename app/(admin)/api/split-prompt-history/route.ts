import { db } from '@/lib/db/queries';
import { eq, desc, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { aiModel, splitPromptHistory } from '@/lib/db/schema';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '10');
  const modelId = searchParams.get('modelId') || 'all';

  try {
    // Fetch current prompt
    const currentPrompt = await db
      .select({
        promptHistory: splitPromptHistory,
        aiModel: aiModel,
      })
      .from(splitPromptHistory)
      .leftJoin(aiModel, eq(splitPromptHistory.modelId, aiModel.id))
      .where(
        and(
          eq(splitPromptHistory.isCurrent, true),
          eq(splitPromptHistory.userEmail, session.user.email)
        )
      )
      .limit(1);

    // Fetch history
    const historyQuery = db
      .select({
        promptHistory: splitPromptHistory,
        aiModel: aiModel,
      })
      .from(splitPromptHistory)
      .leftJoin(aiModel, eq(splitPromptHistory.modelId, aiModel.id))
      .where(
        and(
          modelId !== 'all' ? eq(splitPromptHistory.modelId, modelId) : undefined,
          eq(splitPromptHistory.userEmail, session.user.email)
        )
      )
      .orderBy(desc(splitPromptHistory.createdAt))
      .offset((page - 1) * perPage)
      .limit(perPage);

    const totalCount = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(splitPromptHistory)
      .where(
        and(
          modelId !== 'all' ? eq(splitPromptHistory.modelId, modelId) : undefined,
          eq(splitPromptHistory.userEmail, session.user.email)
        )
      );

    const history = await historyQuery;
    const total = Number(totalCount[0].count);

    return NextResponse.json({
      current: currentPrompt[0] || null,
      history: history,
      pagination: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: Math.ceil(total / perPage),
        prev_page_url: page > 1 ? `/api/split-prompt-history?page=${page - 1}&per_page=${perPage}` : null,
        next_page_url: page < Math.ceil(total / perPage) ? `/api/split-prompt-history?page=${page + 1}&per_page=${perPage}` : null,
      },
    });
  } catch (error) {
    console.error('Error fetching split prompt history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { prompt, modelId } = await request.json();
    if (!prompt || !modelId) {
      return NextResponse.json({ error: 'Missing prompt or modelId' }, { status: 400 });
    }

    // Reset isCurrent flag for all prompts of this user
    await db
      .update(splitPromptHistory)
      .set({ isCurrent: false })
      .where(
        and(
          eq(splitPromptHistory.isCurrent, true),
          eq(splitPromptHistory.userEmail, session.user.email)
        )
      );

    // Insert new prompt
    const newPrompt = await db
      .insert(splitPromptHistory)
      .values({
        id: crypto.randomUUID(),
        modelId,
        prompt,
        userEmail: session.user.email,
        isCurrent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newPrompt[0]);
  } catch (error) {
    console.error('Error saving prompt:', error);
    return NextResponse.json({ error: 'Failed to save prompt' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { id, isCurrent } = await request.json();
    if (!id || isCurrent === undefined) {
      return NextResponse.json({ error: 'Missing id or isCurrent' }, { status: 400 });
    }

    // Verify the prompt belongs to the user
    const existingPrompt = await db
      .select({ userEmail: splitPromptHistory.userEmail })
      .from(splitPromptHistory)
      .where(eq(splitPromptHistory.id, id))
      .limit(1);

    if (!existingPrompt[0] || existingPrompt[0].userEmail !== session.user.email) {
      return new Response('Forbidden: Prompt does not belong to user', { status: 403 });
    }

    // Reset isCurrent flag for all prompts of this user
    await db
      .update(splitPromptHistory)
      .set({ isCurrent: false })
      .where(
        and(
          eq(splitPromptHistory.isCurrent, true),
          eq(splitPromptHistory.userEmail, session.user.email)
        )
      );

    // Update the specified prompt
    const updatedPrompt = await db
      .update(splitPromptHistory)
      .set({
        isCurrent,
        updatedAt: new Date(),
      })
      .where(eq(splitPromptHistory.id, id))
      .returning();

    return NextResponse.json(updatedPrompt[0]);
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}