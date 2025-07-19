// app/(tools)/split-v2/api/generate-scripts/route.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import { splitPromptHistory, generatedSplitHistory } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import postgres from 'postgres';
import { z } from 'zod';

// Configuration constants
const API_CONFIG = {
  MAX_TOKENS: 3000,
  TEMPERATURE: 1,
  MODEL: 'gpt-4.1-2025-04-14',
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000, // Delay between retries to avoid overwhelming the AI service
};

// Default system prompt (used as fallback)
const DEFAULT_SYSTEM_PROMPT = `
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

// Input validation schema using Zod
const RequestSchema = z.object({
  userPrompt: z.string().min(1, 'userPrompt is required'),
  clientPersona: z.string().min(1, 'clientPersona is required'),
  contentPillar: z.string().min(1, 'contentPillar is required'),
  subPillars: z.array(z.object({ value: z.string(), label: z.string() })).min(1, 'subPillars must be a non-empty array'),
  chosenSubPillars: z.array(z.string()).min(1, 'chosenSubPillars must be a non-empty array'),
  hookType: z.array(z.string()).min(1, 'hookType must be a non-empty array'),
});

// Response script schema for validation
const ScriptSchema = z.object({
  subtitle: z.string().min(1),
  content: z.string().min(1),
});
const ResponseSchema = z.object({
  scripts: z.array(ScriptSchema).length(3, 'Exactly 3 scripts are required'),
});

// Types derived from schemas
type RequestBody = z.infer<typeof RequestSchema>;
type ScriptResponse = z.infer<typeof ResponseSchema>;
type TokenUsage = { promptTokens: number; completionTokens: number; totalTokens: number };

// Utility to delay retries
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility to construct the prompt
const buildPrompt = (
  systemPrompt: string,
  { userPrompt, clientPersona, contentPillar, subPillars, chosenSubPillars, hookType }: RequestBody,
  isRetry = false
) => {
  const basePrompt = `${systemPrompt}\n\nUser Prompt: ${userPrompt}\nClient Persona: ${clientPersona}\nContent Pillar: ${contentPillar}\nSub-Pillars: ${subPillars
    .map((sp) => sp.label)
    .join(', ')}\nChosen Sub-Pillars: ${chosenSubPillars.join(', ')}\nHook Types: ${hookType.join(', ')}`;
  return isRetry ? `${basePrompt}\n\nPrevious attempt failed. Ensure the response is valid JSON matching the specified format.` : basePrompt;
};

export async function POST(request: Request) {
  // Initialize database client
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return new Response('Unauthorized: Missing user ID or email', { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsedBody = RequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsedBody.error.issues },
        { status: 400 }
      );
    }
    const { userPrompt, clientPersona, contentPillar, subPillars, chosenSubPillars, hookType } = parsedBody.data;

    // Validate chosenSubPillars exist in subPillars
    const invalidSubPillars = chosenSubPillars.filter(
      (value) => !subPillars.some((sp) => sp.value === value)
    );
    if (invalidSubPillars.length > 0) {
      return NextResponse.json(
        { error: `Invalid chosenSubPillars: ${invalidSubPillars.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch current prompt from splitPromptHistory
    const currentPrompt = await db
      .select({ prompt: splitPromptHistory.prompt })
      .from(splitPromptHistory)
      .where(
        and(
          eq(splitPromptHistory.isCurrent, true),
          eq(splitPromptHistory.userEmail, session.user.email)
        )
      )
      .limit(1);

    const systemPrompt = currentPrompt[0]?.prompt || DEFAULT_SYSTEM_PROMPT;

    // Generate scripts with retries
    let responseData: ScriptResponse | null = null;
    let thisUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let attempts = 0;

    while (attempts < API_CONFIG.MAX_RETRIES) {
      attempts++;
      const prompt = buildPrompt(systemPrompt, parsedBody.data, attempts > 1);

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

      const cleanedText = text.trim().replace(/^```json\s*|\s*```$/g, '').trim();

      try {
        const parsedResponse = JSON.parse(cleanedText);
        const validatedResponse = ResponseSchema.safeParse(parsedResponse);
        if (!validatedResponse.success) {
          throw new Error(validatedResponse.error.message);
        }
        responseData = validatedResponse.data;
        break; // Valid response, exit retry loop
      } catch (error) {
        console.warn(`Attempt ${attempts} failed:`, error, 'Text:', cleanedText);
        if (attempts === API_CONFIG.MAX_RETRIES) {
          return NextResponse.json(
            { error: 'Failed to generate valid scripts after retries', details: String(error) },
            { status: 500 }
          );
        }
        await delay(API_CONFIG.RETRY_DELAY_MS); // Delay before retry
      }
    }

    if (!responseData) {
      return NextResponse.json({ error: 'Failed to generate scripts' }, { status: 500 });
    }

    // Save to generatedSplitHistory
    const [historyEntry] = await db
      .insert(generatedSplitHistory)
      .values({
        userId: session.user.id,
        prompt: userPrompt,
        clientPersona,
        contentPillar,
        subPillars,
        chosenSubPillars: chosenSubPillars.map((value) =>
          subPillars.find((sp) => sp.value === value)?.label || value
        ),
        hookType,
        scripts: responseData.scripts,
        timestamp: new Date(),
        isDeleted: false,
      })
      .returning({ id: generatedSplitHistory.id });

    return NextResponse.json({
      scripts: responseData.scripts,
      historyId: historyEntry.id,
      tokenUsage: {
        prompt_tokens: thisUsage.promptTokens,
        completion_tokens: thisUsage.completionTokens,
        total_tokens: thisUsage.totalTokens,
      },
    });
  } catch (error) {
    console.error('Error generating scripts:', error);
    return NextResponse.json(
      { error: 'Failed to generate scripts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    // Ensure database client is closed
    await client.end();
  }
}