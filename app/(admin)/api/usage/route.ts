// app/api/usage/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { openAiApiUsage } from '@/lib/db/schema'; // Your schema
import { db } from '@/lib/db/queries';
import { count, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('per_page') || '10', 10); // Items per page
  const offset = (page - 1) * perPage;

  try {
    // Fetch usage records for the authenticated user (assuming chatId links to user via chat table)
    const usageRecords = await db
      .select()
      .from(openAiApiUsage)
      .orderBy(desc(openAiApiUsage.createdAt)) // Add this line to sort by recent first
      .limit(perPage)
      .offset(offset);

    // Count total records for pagination
    const totalRecordsResult = await db
      .select({ count: count() })
      .from(openAiApiUsage);
    const totalRecords = totalRecordsResult[0].count;
    const totalPages = Math.ceil(totalRecords / perPage);

    const response = {
      data: usageRecords,
      current_page: page,
      last_page: totalPages,
      prev_page_url: page > 1 ? `/api/usage?page=${page - 1}&per_page=${perPage}` : null,
      next_page_url: page < totalPages ? `/api/usage?page=${page + 1}&per_page=${perPage}` : null,
      total: totalRecords,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch API usage:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}