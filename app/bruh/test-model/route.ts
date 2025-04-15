import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function GET() {
  return new Response(
    JSON.stringify({
      content: 'yoooo you are not allowed here man',
      hiring: 'contact me over instagram @gacem_humen',
      linkedIn: 'I wish I could use it, but it became toxic with humans talking just about their acheivement, Reddit is better tho, even Twitter is better (I dont name it X)',
      info: 'this route is not even guessable, so m thinking u did a brute force but by luck u guesesed it'
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
  try {
    // Define test parameters
    // const model = 'gpt-4o-mini'; // Valid model; replace with 'gpt-4.1-nano-2025-04-14' if valid
    // const model = 'gpt-4.1-nano-2025-04-14';
    // const model = 'gpt-4.1-2025-04-14';
    const model = 'gpt-4.1-mini-2025-04-14';

    const inputData = 'what laravel latest version?';

    // Make non-streaming call
    const { text, usage, response } = await generateText({
      model: openai(model),
      messages: [{ role: 'user', content: inputData }],
      maxTokens: 2000,
      temperature: 1,
    });

    // Extract model from response metadata (if available)
    const apiModel = response?.modelId ?? model; // Fallback to input model

    // Format usage info
    const usageInfo = {
      prompt_tokens: usage.promptTokens ?? null,
      completion_tokens: usage.completionTokens ?? null,
      total_tokens: usage.totalTokens ?? null,
    };

    // Return JSON response
    return new Response(
      JSON.stringify({
        content: text,
        model: apiModel,
        usage: usageInfo,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}