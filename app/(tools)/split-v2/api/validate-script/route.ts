// app/(tools)/split-v2/api/validate-script/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { content } from '@/lib/db/schema';

interface SaveScriptRequest {
  chosenSubPillars: string[];
  clientPersona?: string;
  contentPillar?: string;
  historyId?: string;
  hookType?: string;
  script: { subtitle: string, content: string };
  subPillars?: string;
  userPrompt?: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const {
      chosenSubPillars,
      clientPersona,
      contentPillar,
      historyId,
      hookType,
      script,
      subPillars,
      userPrompt = 'script',
    } = await request.json() as SaveScriptRequest;


    // Insert into Content table
    const [savedContent] = await db
      .insert(content)
      .values({
        userId: session.user.id,
        title: script.subtitle,
        generatedScript: script.content,
        userPrompt: userPrompt,
        content_idea: chosenSubPillars.join(', '),
        hook_type: hookType,
        mood: chosenSubPillars.join(', '),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      id: savedContent.id,
      title: savedContent.title,
      stage: savedContent.stage,
      createdAt: savedContent.createdAt,
    });
  } catch (error: any) {
    console.error('Error saving script:', error);
    return NextResponse.json({ error: 'Failed to save script', details: error.message }, { status: 500 });
  }
}