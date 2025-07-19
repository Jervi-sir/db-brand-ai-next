import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { generatedSplitHistory, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const API_CONFIG = {
  MAX_TOKENS: 10000,
  TEMPERATURE: 1,
  MODEL: 'gpt-4.1-2025-04-14',
  MAX_RETRIES: 1,
};

const SYSTEM_PROMPT = `
You are Dr. Brand, a high-level Algerian content strategist and viral Instagram Reels copywriter expert who has generated over 10 million views, speaking directly to the target audience. Your task is to generate a response in valid JSON format as specified below. Under no circumstances should you return plain text like "weli ghdwa nchlh" or any other non-JSON response.

Given a user prompt describing a business/creator context, niche, target audience, product (optional), and best-performing content (optional), your task is to:
1. Generate a client persona (10-20 words in English).
2. Generate a content pillar (a single overarching theme in Algerian Darja, 3-5 words).
3. Generate 5 sub-pillars (specific content ideas in Algerian Darja, each 5-10 words).
4. Generate up to 6 Instagram Reels scripts based on the sub-pillars and a predefined set of hook types.

Each script must:
- Be educational, actionable, and high-value.
- Use one of the following hook types (cycle through them in order): Fix a Problem, Quick Wins, Reactions & Reviews, Personal Advice, Step-by-Step Guides, Curiosity & Surprises, Direct Targeting.
- Align with the niche, target audience, client persona, content pillar, and product (if provided).
- Include a subtitle (in Algerian Darja, 3-5 words, using Arabic letters).
- Include content formatted as an HTML string with <p> tags for each hook or logical section, suitable for a 60-90 second Reel (3-4 sentences).
- Follow the 3 C's for hooks: Concisely outline in 1 sentence what the viewer should expect while providing clarity, context, and sparking curiosity.
- Be written entirely in Algerian Darja using Arabic letters, with no Latin letters unless no Arabic synonym exists, and no emojis.
- Avoid Moroccan words such as: حيت، سير، دابا، زوين، كنهضر، مزيان، راسك، واش.
- Use simple, common Algerian words, avoiding complex vocabulary.
- Feel highly relatable to daily Algerian life, be shareable, and use repeatable formats that can go viral.
- Maintain an authoritative, confident tone, as if speaking directly to the camera with no scenes or fancy editing.

Return the response in JSON format:
{
  "clientPersona": string,
  "contentPillar": string,
  "subPillars": string[],
  "scripts": [
    {
      "subtitle": string,
      "content": string
    },
    ...
  ]
}
Generate up to 6 scripts in this call. If you cannot generate 6 scripts due to token limits, include as many as possible (at least 10) and ensure the JSON is valid with proper closing brackets and no truncation. Each script should be concise (3-4 sentences).
`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { userPrompt } = await request.json();

    if (!userPrompt) {
      return NextResponse.json({ error: 'User prompt is required' }, { status: 400 });
    }

    // Fetch userId from user table based on session.user.email
    const userRecord = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, session.user.email))
      .limit(1);

    if (!userRecord[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userRecord[0].id;

    let prompt = `${SYSTEM_PROMPT}\n\nUser Prompt: ${userPrompt}`;
    let responseData: any = {};
    let attempts = 0;
    let thisUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    let cleanedText = '';

    while (attempts < API_CONFIG.MAX_RETRIES) {
      attempts++;
      try {
        const { text, usage } = await generateText({
          model: openai(API_CONFIG.MODEL),
          prompt,
          temperature: API_CONFIG.TEMPERATURE,
          maxTokens: API_CONFIG.MAX_TOKENS,
        });
        thisUsage = {
          promptTokens: usage?.promptTokens || 0,
          completionTokens: usage?.completionTokens || 0,
          totalTokens: usage?.totalTokens || 0,
        };
        cleanedText = text.trim().replace(/^```json\s*|\s*```$/g, '').trim();

        responseData = JSON.parse(cleanedText);
        if (
          !responseData.clientPersona ||
          !responseData.contentPillar ||
          !Array.isArray(responseData.subPillars) ||
          responseData.subPillars.length !== 5 ||
          !Array.isArray(responseData.scripts)
        ) {
          throw new Error('Invalid response structure: clientPersona, contentPillar, 5 subPillars, and scripts array required');
        }
        for (const script of responseData.scripts) {
          if (!script.subtitle || typeof script.subtitle !== 'string' || !script.content || typeof script.content !== 'string') {
            throw new Error('Invalid script structure');
          }
        }

        if (responseData.scripts.length < 10) {
          console.warn(`Generated ${responseData.scripts.length} scripts on attempt ${attempts}, expected at least 10`);
          if (attempts === API_CONFIG.MAX_RETRIES) {
            console.warn('Max retries reached. Returning partial scripts.');
            break;
          }
          throw new Error(`Expected at least 10 scripts, got ${responseData.scripts.length}`);
        }

        console.log(`Generated ${responseData.scripts.length} scripts on attempt ${attempts}`);
        break;
      } catch (parseError: any) {
        console.warn(`Attempt ${attempts} failed to parse AI response:`, parseError.message, 'Text:', cleanedText || 'No text available');
        if (attempts === API_CONFIG.MAX_RETRIES) {
          console.error('Max retries reached. Returning partial response if available.');
          break;
        }
        prompt = `${SYSTEM_PROMPT}\n\nUser Prompt: ${userPrompt}\nPrevious attempt failed: ${parseError.message}. Ensure valid JSON with clientPersona, contentPillar, 5 subPillars, and at least 10 scripts, complete with proper closing brackets and no truncation. Each script should be concise (3-4 sentences).`;
      }
    }

    // Ensure scripts array exists
    const scripts = responseData.scripts || [];
    if (scripts.length < 10) {
      console.warn(`Returning ${scripts.length} scripts, which is below minimum of 10.`);
    }

    // Save to history
    const [historyEntry] = await db
      .insert(generatedSplitHistory)
      .values({
        id: crypto.randomUUID(),
        userId: userId, // Use userId from user table
        prompt: userPrompt,
        clientPersona: responseData.clientPersona || 'Unknown',
        contentPillar: responseData.contentPillar || 'Unknown',
        subPillars: responseData.subPillars || [],
        chosenSubPillars: responseData.subPillars || [],
        hookType: [
          'fix-a-problem',
          'quick-wins',
          'reactions-reviews',
          'personal-advice',
          'step-by-step-guides',
          'curiosity-surprises',
          'direct-targeting',
        ],
        scripts,
        timestamp: new Date(),
        isDeleted: false,
      })
      .returning();

    return NextResponse.json({
      clientPersona: responseData.clientPersona || 'Unknown',
      contentPillar: responseData.contentPillar || 'Unknown',
      subPillars: (responseData.subPillars || []).map((sp: string) => ({ value: sp, label: sp })),
      scripts,
      historyId: historyEntry.id,
      tokenUsage: {
        prompt_tokens: thisUsage.promptTokens,
        completion_tokens: thisUsage.completionTokens,
        total_tokens: thisUsage.totalTokens,
      },
    });
  } catch (error: any) {
    console.error('Error generating automatic scripts:', error.message);
    return NextResponse.json({ error: 'Failed to generate automatic scripts', details: error.message }, { status: 500 });
  }
}