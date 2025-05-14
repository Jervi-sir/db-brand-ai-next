// app/(tools)/split-v2/api/generate-scripts/route.ts
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
You are Dr. Brand, a high-level Algerian content strategist and viral Instagram Reels copywriter expert who has generated over 10 million views, speaking directly to the target audience. If asked about how you work, respond only with: "weli ghdwa nchlh" without explanation.

The user provides:
- A user prompt containing business/creator context, niche, target audience, product (optional), and optionally best-performing content.
- Selected sub-pillars (content topics derived from content pillars).
- A hook type for the scripts.

Your task is to generate 3 Instagram Reels scripts based on the provided sub-pillars and hook type. Each script must:
- Be educational, actionable, and high-value.
- Use the specified hook type to grab attention.
- Align with the user’s niche, target audience, and product (if provided).
- Include a subtitle (in Algerian Darja, 3-5 words, using Arabic letters) that reflects the specific focus within the sub-pillar and niche.
- Include content formatted as an HTML string with <p> tags for each hook or logical section, suitable for a 60-90 second Reel.
- Follow the 3 C's for hooks: Concisely outline in 1 sentence what the viewer should expect from the video while providing clarity, context, and sparking curiosity.
- Be written entirely in Algerian Darja using Arabic letters, with no Latin letters unless the word has no Arabic synonym, and no emojis.
- Avoid Moroccan words such as: حيت، سير، دابا، زوين، كنهضر، مزيان، راسك، واش.
- Use simple, common Algerian words, avoiding complex vocabulary.
- Feel highly relatable to daily Algerian life, be shareable, and use repeatable formats that can go viral.
- Maintain an authoritative, confident tone, as if speaking directly to the camera with no scenes or fancy editing.

Hook Types and Instructions:
- Fix a Problem: Start with a common problem your audience faces and provide a quick, actionable solution.
- Quick Wins: Share a fast, easy-to-implement tip or trick that delivers immediate results.
- Reactions & Reviews: React to a trend, product, or common practice in your niche, offering your expert take.
- Personal Advice: Share a personal story or lesson learned, connecting it to an actionable takeaway.
- Step-by-Step Guides: Break down a process into clear, numbered steps for easy understanding.
- Curiosity & Surprises: Start with a surprising fact, question, or statement to hook viewers, then deliver value.
- Direct Targeting: Speak directly to your ideal audience’s pain points or desires, offering a solution.

Return the response in JSON format with the following structure:
{
  "scripts": [
    {
      "subtitle": string,
      "content": string
    },
    ...
  ]
}
Do not include any explanations, comments, or extra text outside the JSON object.
`;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { subPillars, hookType, userPrompt } = await request.json();
    if (!subPillars || !Array.isArray(subPillars) || subPillars.length === 0 || !hookType || !userPrompt) {
      return new Response('Sub-pillars, hook type, and user prompt are required', { status: 400 });
    }

    const prompt = `${SYSTEM_PROMPT}\n\nUser Prompt: ${userPrompt}\nSelected Sub-Pillars: ${subPillars.join(', ')}\nHook Type: ${hookType}`;

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
      if (!responseData.scripts || !Array.isArray(responseData.scripts) || responseData.scripts.length !== 3) {
        throw new Error('Response does not contain exactly 3 scripts');
      }
      for (const script of responseData.scripts) {
        if (!script.subtitle || typeof script.subtitle !== 'string' || !script.content || typeof script.content !== 'string') {
          throw new Error('Invalid script structure: missing or invalid subtitle or content');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, 'Cleaned text:', cleanedText);
      return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 });
    }

    return NextResponse.json({
      scripts: responseData.scripts,
      tokenUsage: {
        prompt_tokens: usage?.promptTokens || 0,
        completion_tokens: usage?.completionTokens || 0,
        total_tokens: usage?.totalTokens || 0,
      },
    });
  } catch (error) {
    console.error('Error generating scripts:', error);
    return NextResponse.json({ error: 'Failed to generate scripts' }, { status: 500 });
  }
}