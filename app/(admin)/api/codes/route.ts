import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { codes, codeUsage } from '@/lib/db/schema';
import { db } from '@/lib/db/queries';

export async function GET(request: Request) {
   const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('per_page') || '10', 10);
  const offset = (page - 1) * perPage;

  try {
    const codeList = await db
      .select({
        id: codes.id,
        code: codes.code,
        createdAt: codes.createdAt,
        maxUses: codes.maxUses,
        isActive: codes.isActive,
        usageCount: sql`COUNT(${codeUsage.id})::integer`,
      })
      .from(codes)
      .leftJoin(codeUsage, eq(codeUsage.codeId, codes.id))
      .groupBy(codes.id)
      .limit(perPage)
      .offset(offset);

    const total = await db.select({ count: sql`COUNT(*)::integer` }).from(codes);
    const totalCount = total[0].count as number;
    const lastPage = Math.ceil(totalCount / perPage);

    return NextResponse.json({
      data: codeList,
      current_page: page,
      last_page: lastPage,
      prev_page_url: page > 1 ? `/api/codes?page=${page - 1}&per_page=${perPage}` : null,
      next_page_url: page < lastPage ? `/api/codes?page=${page + 1}&per_page=${perPage}` : null,
    }, { status: 200 });
  } catch (error) {
    console.error('Fetch codes error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code, maxUses, isActive } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    await db.insert(codes).values({
      code,
      maxUses: maxUses ? parseInt(maxUses, 10) : null,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ message: 'Code added' }, { status: 201 });
  } catch (error) {
    console.error('Add code error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}