// app/(tools)/split-v2/api/generate-sub-pillars/route.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

const API_CONFIG = {
  MAX_TOKENS: 3000,
  TEMPERATURE: 1,
  MODEL: 'gpt-4o-mini', // Ensure this is a valid model
};

const SYSTEM_PROMPT = `
You are a professional content strategist specialized in creating viral, educational Instagram Reels that build authority and attract ideal clients.
The user provides a custom prompt containing:
- Business or creator context
- Niche
- Target audience
- Product (optional)

Your task is to process this in the following steps:
1. Build Client Persona
   - Identify their audience's fears, struggles, desires, and interests based on the niche and product.
2. Extract 5 Content Pillars
   - Pillars must directly address the client persona’s needs, fears, struggles, desires, and interests.
   - Keep them focused, not generic.
3. Break Each Pillar into 5 Sub-Pillars
   - Expand each pillar with specific angles.
   - You MUST generate exactly 5 sub-pillars per pillar, resulting in exactly 25 sub-pillars.
   - Ensure each sub-pillar is unique, actionable, and relevant to the pillar.
4. Generate 25 Educational Content Topics
   - Based on sub-pillars.
   - Must be utility-based, actionable, and high-value.
   - No repetition.

Return the response in JSON format with the following structure:
{
  "clientPersona": {
    "fears": string[],
    "struggles": string[],
    "desires": string[],
    "interests": string[]
  },
  "contentPillars": string[],
  "subPillars": string[]
}
Ensure the subPillars array contains EXACTLY 25 items.
`;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { userPrompt } = await request.json();
    if (!userPrompt) {
      return new Response('User prompt is required', { status: 400 });
    }

    const prompt = `${SYSTEM_PROMPT}\n\nUser Prompt: ${userPrompt}`;

    const { text, usage } = await generateText({
      model: openai(API_CONFIG.MODEL),
      prompt,
      temperature: API_CONFIG.TEMPERATURE,
      maxTokens: API_CONFIG.MAX_TOKENS,
    });

    let cleanedText = text.trim().replace(/^```json\s*|\s*```$/g, '').trim();
    let responseData;
    try {
      responseData = JSON.parse(cleanedText);
      if (
        !responseData.clientPersona ||
        !responseData.contentPillars ||
        !Array.isArray(responseData.contentPillars) ||
        responseData.contentPillars.length !== 5 ||
        !responseData.subPillars ||
        !Array.isArray(responseData.subPillars)
      ) {
        throw new Error('Invalid response structure');
      }
      if (responseData.subPillars.length !== 25) {
        console.warn(
          `Expected 25 sub-pillars, but received ${responseData.subPillars.length}. Proceeding with available sub-pillars.`
        );
        // Optionally, you can pad the subPillars array with placeholder values if needed
        // while (responseData.subPillars.length < 25) {
        //   responseData.subPillars.push(`Placeholder Sub-Pillar ${responseData.subPillars.length + 1}`);
        // }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, 'Cleaned text:', cleanedText);
      return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 });
    }

    return NextResponse.json({
      clientPersona: responseData.clientPersona,
      contentPillars: responseData.contentPillars,
      subPillars: responseData.subPillars,
      tokenUsage: {
        prompt_tokens: usage?.promptTokens || 0,
        completion_tokens: usage?.completionTokens || 0,
        total_tokens: usage?.totalTokens || 0,
      },
    });
  } catch (error) {
    console.error('Error generating sub-pillars:', error);
    return NextResponse.json({ error: 'Failed to generate sub-pillars' }, { status: 500 });
  }
}