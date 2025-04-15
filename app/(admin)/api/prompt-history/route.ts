// app/api/prompt-history/route.ts
import { NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/queries';
import { promptHistory, aiModel } from '@/lib/db/schema';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '10');
  const modelId = searchParams.get('modelId') || '';

  try {
    const query = db
      .select({
        promptHistory: {
          id: promptHistory.id,
          modelId: promptHistory.modelId,
          prompt: promptHistory.prompt,
          createdAt: promptHistory.createdAt,
          userEmail: promptHistory.userEmail,
        },
        aiModel: {
          id: aiModel.id,
          name: aiModel.name,
          displayName: aiModel.displayName,
          inputPrice: aiModel.inputPrice,
          outputPrice: aiModel.outputPrice,
          endpoint: aiModel.endpoint,
          apiKey: aiModel.apiKey,
          capability: aiModel.capability,
          provider: aiModel.provider,
          type: aiModel.type,
          isActive: aiModel.isActive,
          maxTokens: aiModel.maxTokens,
          temperature: aiModel.temperature,
          customPrompts: aiModel.customPrompts,
          cachedInputPrice: aiModel.cachedInputPrice,
        },
      })
      .from(promptHistory)
      .leftJoin(aiModel, eq(promptHistory.modelId, aiModel.id));

    // Apply modelId filter if provided
    if (modelId) {
      query.where(eq(promptHistory.modelId, modelId));
    }

    const [history, totalCount] = await Promise.all([
      query
        .orderBy(desc(promptHistory.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
      db
        .select({ count: sql<number>`count(*)` })
        .from(promptHistory)
        .where(modelId ? eq(promptHistory.modelId, modelId) : undefined)
        .then((res) => res[0].count),
    ]);

    const totalPages = Math.ceil(totalCount / perPage);

    return NextResponse.json({
      data: history,
      pagination: {
        current_page: page,
        per_page: perPage,
        total: totalCount,
        last_page: totalPages,
        prev_page_url: page > 1 ? `?page=${page - 1}&per_page=${perPage}${modelId ? `&modelId=${modelId}` : ''}` : null,
        next_page_url: page < totalPages ? `?page=${page + 1}&per_page=${perPage}${modelId ? `&modelId=${modelId}` : ''}` : null,
      },
    });
  } catch (error) {
    console.error('Error fetching prompt history:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user) return new Response('Unauthorized', { status: 401 });

  try {
    const data = await request.json();
    const [newHistory] = await db
      .insert(promptHistory)
      .values({
        ...data,
        userId: session.user.id,
      })
      .returning();
    return NextResponse.json(newHistory);
  } catch (error) {
    console.error('Error creating prompt history:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}