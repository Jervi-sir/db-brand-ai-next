import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { sql } from 'drizzle-orm';
import { chat, message } from '@/lib/db/schema';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get last 3 days
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 3);
    startDate.setHours(0, 0, 0, 0);

    // Query new chats per day
    const newChats = await db
      .select({
        date: sql`DATE(${chat.createdAt})`.as('date'),
        newChats: sql`COUNT(*)::integer`.as('newChats'),
      })
      .from(chat)
      .where(
        sql`${chat.createdAt} >= ${startDate.toISOString()} AND ${chat.createdAt} <= ${endDate.toISOString()}`
      )
      .groupBy(sql`DATE(${chat.createdAt})`)
      .orderBy(sql`DATE(${chat.createdAt})`);

    // Query messages per day
    const messages = await db
      .select({
        date: sql`DATE(${message.createdAt})`.as('date'),
        messages: sql`COUNT(*)::integer`.as('messages'),
      })
      .from(message)
      .where(
        sql`${message.createdAt} >= ${startDate.toISOString()} AND ${message.createdAt} <= ${endDate.toISOString()}`
      )
      .groupBy(sql`DATE(${message.createdAt})`)
      .orderBy(sql`DATE(${message.createdAt})`);

    // Generate 3-day data
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const chatEntry = newChats.find((c) => c.date === dateStr) || { newChats: 0 };
      const messageEntry = messages.find((m) => m.date === dateStr) || { messages: 0 };
      days.push({
        date: dateStr,
        newChats: chatEntry.newChats,
        messages: messageEntry.messages,
      });
    }

    return NextResponse.json({ data: days }, { status: 200 });
  } catch (error) {
    console.error('Fetch chat/message analytics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}