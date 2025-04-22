// app/api/generate-scripts/route.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse the request body
    const { topic, description, mood } = await request.json();

    if (!topic || !mood) {
      return new Response('Topic and mood are required', { status: 400 });
    }

    // Construct the prompt for script generation
    const prompt = `
      Generate three unique scripts based on the following inputs:
      - Topic: ${topic}
      - Description: ${description || 'No additional context provided'}
      - Mood: ${mood}

      Each script should be a short paragraph (50-100 words) formatted in HTML with appropriate tags (e.g., <p>, <b>, <i>) for emphasis. Return the scripts as a JSON array of HTML strings, like this:
      [
        "<p>First script content...</p>",
        "<p>Second script content...</p>",
        "<p>Third script content...</p>"
      ]
      Ensure the response contains only the JSON array, with no additional text, markdown, or code blocks.
    `;

    // Call OpenAI API to generate scripts
    const { text, usage } = await generateText({
      model: openai('gpt-4.1-nano-2025-04-14'), // Use a valid model
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    });

    // Log the raw response and usage for debugging
    console.log('Raw AI response:', text);
    console.log('Token usage:', usage);

    // Parse the response as JSON
    let scripts;
    try {
      scripts = JSON.parse(text);
      if (!Array.isArray(scripts) || scripts.length !== 3) {
        throw new Error('Response is not an array of three scripts');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    // Validate that each script is a non-empty string
    if (!scripts.every((script) => typeof script === 'string' && script.trim())) {
      return NextResponse.json(
        { error: 'Invalid script content' },
        { status: 500 }
      );
    }

    // Return the scripts and token usage
    return NextResponse.json({
      scripts,
      usage: {
        promptTokens: usage.promptTokens || 0,
        completionTokens: usage.completionTokens || 0,
        totalTokens: usage.totalTokens || (usage.promptTokens || 0) + (usage.completionTokens || 0),
      },
    });
  } catch (error) {
    console.error('Error generating scripts:', error);
    return NextResponse.json(
      { error: 'Failed to generate scripts' },
      { status: 500 }
    );
  }
}