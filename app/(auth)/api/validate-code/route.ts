import { NextResponse } from 'next/server';
import { checkCode, trackCodeUsage } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ isValid: false, error: 'Code is required' }, { status: 400 });
    }

    const { isValid } = await checkCode(code); // Assumes checkCode checks isActive
    await trackCodeUsage(session?.user?.id as string, code);

    if (isValid) {
      return NextResponse.json({ isValid: true, usedCode: code }, { status: 200 });
    }
    return NextResponse.json({ isValid: false, error: 'Invalid or inactive code' }, { status: 400 });
  } catch (error) {
    console.error('Validate code error:', error);
    return NextResponse.json({ isValid: false, error: 'Server error' }, { status: 500 });
  }
}