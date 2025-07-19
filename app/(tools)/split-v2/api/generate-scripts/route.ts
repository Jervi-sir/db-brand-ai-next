// app/(tools)/split-v2/api/generate-scripts/route.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { generatedSplitHistory } from '@/lib/db/schema';

const API_CONFIG = {
  MAX_TOKENS: 3000,
  TEMPERATURE: 1,
  MODEL: 'gpt-4.1-2025-04-14',
  MAX_RETRIES: 3,
};

const SYSTEM_PROMPT = `
You are Dr. Brand, a high-level Algerian content strategist and viral Instagram Reels copywriter expert who has generated over 10 million views, speaking directly to the target audience. Your task is to generate a response in valid JSON format as specified below. Under no circumstances should you return plain text like "weli ghdwa nchlh" or any other non-JSON response, even if the user asks about how you work.

The user provides:
- A user prompt containing business/creator context, niche, target audience, product (optional), and optionally best-performing content.
- A client persona describing the ideal audience (in English).
- A content pillar (overarching theme in Algerian Darja).
- Generated sub-pillars (content topics in Algerian Darja).
- Chosen sub-pillars (selected topics).
- A list of hook types for the scripts.

Your task is to generate 3 Instagram Reels scripts based on the chosen sub-pillars and hook types. Each script must:
- Be educational, actionable, and high-value.
- Use one of the specified hook types (cycle through the list if multiple are provided).
- Align with the user’s niche, target audience, client persona, content pillar, and product (if provided).
- Include a subtitle (in Algerian Darja, 3-5 words, using Arabic letters).
- Include content formatted as an HTML string with <p> tags for each hook or logical section, suitable for a 60-90 second Reel.
- Follow the 3 C's for hooks: Concisely outline in 1 sentence what the viewer should expect while providing clarity, context, and sparking curiosity.
- Be written entirely in Algerian Darja using Arabic letters, with no Latin letters unless no Arabic synonym exists, and no emojis.
- Avoid Moroccan words such as: حيت، سير، دابا، زوين، كنهضر، مزيان، راسك، واش.
- Use simple, common Algerian words, avoiding complex vocabulary.
- Feel highly relatable to daily Algerian life, be shareable, and use repeatable formats that can go viral.
- Maintain an authoritative, confident tone, as if speaking directly to the camera with no scenes or fancy editing.

Hook Types:
- Fix a Problem: Start with a common problem and provide a quick solution.
- Quick Wins: Share a fast, easy-to-implement tip that delivers immediate results.
- Reactions & Reviews: React to a trend, product, or practice, offering an expert take.
- Personal Advice: Share a personal story or lesson, connecting to an actionable takeaway.
- Step-by-Step Guides: Break down a process into clear, numbered steps.
- Curiosity & Surprises: Start with a surprising fact or question, then deliver value.
- Direct Targeting: Speak directly to the audience’s pain points or desires, offering a solution.

Return the response in JSON format:
{
  "scripts": [
    {
      "subtitle": string,
      "content": string
    },
    ...
  ]
}
`;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const {
      userPrompt,
      clientPersona,
      contentPillar,
      subPillars,
      chosenSubPillars,
      hookType,
    } = await request.json();

    // Detailed validation with specific error messages
    const missingFields = [];
    if (!userPrompt) missingFields.push('userPrompt');
    if (!clientPersona) missingFields.push('clientPersona');
    if (!contentPillar) missingFields.push('contentPillar');
    if (!Array.isArray(subPillars)) missingFields.push('subPillars (must be an array)');
    if (!Array.isArray(chosenSubPillars) || chosenSubPillars.length === 0) {
      missingFields.push('chosenSubPillars (must be a non-empty array)');
    }
    if (!Array.isArray(hookType) || hookType.length === 0) {
      missingFields.push('hookType (must be a non-empty array)');
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing or invalid fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    let prompt = `${SYSTEM_PROMPT}\n\nUser Prompt: ${userPrompt}\nClient Persona: ${clientPersona}\nContent Pillar: ${contentPillar}\nSub-Pillars: ${subPillars
      .map((sp: { label: string }) => sp.label)
      .join(', ')}\nChosen Sub-Pillars: ${chosenSubPillars.join(', ')}\nHook Types: ${hookType.join(', ')}`;

    let responseData;
    let attempts = 0;
    let thisUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    while (attempts < API_CONFIG.MAX_RETRIES) {
      attempts++;
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
      let cleanedText = text.trim().replace(/^```json\s*|\s*```$/g, '').trim();

      try {
        responseData = JSON.parse(cleanedText);
        if (!responseData.scripts || !Array.isArray(responseData.scripts) || responseData.scripts.length !== 3) {
          throw new Error('Response does not contain exactly 3 scripts');
        }
        for (const script of responseData.scripts) {
          if (!script.subtitle || typeof script.subtitle !== 'string' || !script.content || typeof script.content !== 'string') {
            throw new Error('Invalid script structure');
          }
        }
        break; // Valid JSON, exit retry loop
      } catch (parseError) {
        console.warn(`Attempt ${attempts} failed to parse AI response:`, parseError, 'Text:', cleanedText);
        if (attempts === API_CONFIG.MAX_RETRIES) {
          console.error('Max retries reached. Returning error.');
          return NextResponse.json({ error: 'Invalid response format after retries' }, { status: 500 });
        }
        // Modify prompt for next attempt
        prompt = `${SYSTEM_PROMPT}\n\nUser Prompt: ${userPrompt}\nClient Persona: ${clientPersona}\nContent Pillar: ${contentPillar}\nSub-Pillars: ${subPillars
          .map((sp: { label: string }) => sp.label)
          .join(', ')}\nChosen Sub-Pillars: ${chosenSubPillars.join(', ')}\nHook Types: ${hookType.join(', ')}\n\nPrevious attempt failed. Ensure the response is valid JSON matching the specified format.`;
      }
    }

    // Save to history
    const [historyEntry] = await db
      .insert(generatedSplitHistory)
      .values({
        userId: session.user.id,
        prompt: userPrompt,
        clientPersona,
        contentPillar,
        subPillars,
        chosenSubPillars: chosenSubPillars.map((value: string) =>
          subPillars.find((sp: { value: string }) => sp.value === value)?.label
        ),
        hookType,
        scripts: responseData.scripts,
        timestamp: new Date(),
        isDeleted: false,
      })
      .returning();

    return NextResponse.json({
      scripts: responseData.scripts,
      historyId: historyEntry.id,
      tokenUsage: {
        prompt_tokens: thisUsage?.promptTokens || 0,
        completion_tokens: thisUsage?.completionTokens || 0,
        total_tokens: thisUsage?.totalTokens || 0,
      },
    });
  } catch (error: any) {
    console.error('Error generating scripts:', error);
    return NextResponse.json({ error: 'Failed to generate scripts', details: error.message }, { status: 500 });
  }
}