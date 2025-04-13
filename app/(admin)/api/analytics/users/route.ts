import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserAnalytics } from '@/lib/db/queries';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Invalid month format' }, { status: 400 });
  }

  try {
    const data = await getUserAnalytics(month);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Fetch user analytics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}