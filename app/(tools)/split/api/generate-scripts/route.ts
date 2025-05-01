// app/split/api/generate-scripts/route.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

// TypeScript interfaces
interface GenerateScriptsRequest {
  userPrompt: string;
  content_idea: string;
  hook_type: string;
}

interface Script {
  subtitle: string;
  content: string; // Combined script text with all hooks
}

interface GenerateScriptsResponse {
  scripts: Script[];
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const hookTypePrompts: Record<string, string[]> = {
  '1': [
    'This is the mistake every [niche] business owner makes..',
    'Don’t make this mistake when doing [action]..',
    'Here are 2 signs that you should stop doing [action]..',
    'Why does no one talk about [topic] in [niche]??',
    'Don’t believe this [niche] myth..',
    'This is why your [product/service] isn’t working..',
    'Before you do [action] like always.. check out [alternative]..',
    'My biggest regret as an [profession] was not discovering this technique sooner..',
    'If you\'re like me and do [action], then this one is for you..',
    'If you have trouble doing [action], you might want to listen up..',
    'Something that’s always bothered me about [topic]...',
    'This is the lazy way to get [result]..',
    'This is for the [type of person] looking for [result]..',
    '3 things you\'re NOT doing to do [result]..',
    '4 things you\'re NOT doing to improve [action]..',
  ],
  '2': [
    'Here’s a simple hack to help you do [action]..',
    'This [niche] hack could save you [amount] of money..',
    'Get more [value prop] in your day by doing this one thing..',
    'This is the easiest tip you can follow to overcome [problem]..',
    'Try this tip next when doing [action]..',
    'This [action] tip will save you [hours] hours..',
    'This free tool changed the game for me..',
    'How to get [result] in 5 minutes or less..',
    'I can\'t believe this [hack] only cost me $10..',
    'I just found the perfect product that helps with [problem]..',
    'You need this [product] if you want to save time and effort...',
    'Life Hack: Try [product] for [pain point]..',
    'Instead of using [common product] like everyone else... I use this instead!',
    'I bet I can change your mind about [topic] in 20 seconds..',
  ],
  '3': [
    'I couldn\'t believe [person]\'s reaction to [action]..',
    'Recording [person]\'s reaction to [action]..',
    'Seeing if [person] can guess if [item] is [homemade]..',
    'Seeing if a stranger can beat me at [challenge]..',
    'I secretly filmed [person] doing [action]. This is what happened..',
    'This [product type] has over 5,000 reviews… let’s see if it’s worth it..',
    'I tried every affordable [product] brand out there and here are the results..',
    'I tried the top [niche] products so you don\'t have to..',
    'This is why people keep asking when our [product] will be back in stock..',
    'I spent an entire week trying [action].. here\'s what I discovered..',
    'This [feature] is why I bought [product]..',
    'The best $47 dollars I\'ve ever spent on a [product type]..',
    'This [product] has the craziest feature!',
  ],
  '4': [
    'My biggest regret as an [profession]…',
    'This video is only for [type of person], so keep scrolling if that\'s not you..',
    'If you\'re like me and do [action], then this one is for you..',
    'This may be controversial but [opinion]..',
    '[type of person].. stop scrolling!',
    'Feeling overwhelmed with [problem]? Try this next time..',
    'Watch this if you hate feeling [feeling]..',
    'If you have [problem], listen up!',
    'How I made \'$3500\' in one week doing [action]!',
    'The 4 [product type] products I can\'t start my day without..',
    'Why am I the only one talking about [topic]??',
    'This [program] doesn\'t exist.. but this is a close second..',
    'The best $20 you can spend as a [niche]..',
  ],
  '5': [
    'This is the only thing you need to know about [topic]!',
    'How to impress everyone at the next [scenario]..',
    'Get more [value prop] in your day by doing this one thing..',
    'This free tool changed the game for me..',
    '3 [topic] tips I wish I knew earlier (the last one blew my mind)..',
    'You will look at [topic] differently after the next 30 seconds..',
    'Try this tip next when doing [action]..',
    'I bought this [service] for my business and now my conversions/sales are through the roof!',
    'This is the easiest tip you can follow to overcome [problem]..',
    'This is the lazy way to get [result]..',
    'How to get [result] in 5 minutes or less..',
    'This is for the [type of person] looking for [result]..',
  ],
  '6': [
    'Everything you knew about [topic] is 100% WRONG!',
    'You won\'t believe this thing called "[stereotype]"..',
    'Why is nobody talking about [topic] in the [niche] industry?',
    'Literally nobody is talking about [topic] in the [niche] world..',
    'I bet you didn\'t know [fact] about [topic]..',
    'Instead of buying this [popular product] I have another recommendation..',
    'This is the mistake every [niche] business owner makes..',
    'Something that’s always bothered me about [topic]...',
    'This video is only for [type of person], so keep scrolling if that\'s not you..',
    'This is for the [type of person] looking for [result]..',
    'The perfect [program] doesn\'t exist.. but this is a close second..',
    'This is why people keep asking when our [product] will be back in stock..',
  ],
  '7': [
    'If you are into [niche] you need to stop doing this..',
    'This is for the [type of person] looking for [result]..',
    'This video is only for [type of person], so keep scrolling if that\'s not you..',
    'If you\'re like me and do [action], then this one is for you..',
    'Warning to [niche]: this is a game changer..',
    'Don’t believe this [niche] myth..',
    'Why does no one talk about [topic] in [niche]?',
  ],
};

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse the request body
    const { userPrompt, content_idea, hook_type }: GenerateScriptsRequest = await request.json();

    if (!userPrompt || !content_idea || !hook_type) {
      return new Response('User prompt, content idea, and hook type are required', { status: 400 });
    }

    // Select hooks based on hook_type
    const selectedHooks = hookTypePrompts[hook_type] || hookTypePrompts['1'];
    const hookPrompts = selectedHooks.slice(0, 3); // Limit to 3 hooks per script

    // Construct the prompt for script generation
    const prompt = `
      You are Dr. Brand, a high-level Algerian content strategist and viral Instagram Reels copywriter expert. Generate 3 short scripts based on the following inputs:
      - User Prompt (includes niche, intro, product/service, target audience, best-performing content): ${userPrompt || 'No prompt provided'}
      - Content Idea Type: ${
        [
          'Day in my life – personal branding',
          'Educational with entertainment – deliver value in an engaging way',
          'Challenge – high stakes, tension not resolved until the payoff',
          'Stranger-generated content – ask people questions',
          'Audience-generated content – use follower input',
          'Skits – relatable humor or drama',
          'Skills – show off something you\'re good at',
        ][parseInt(content_idea) - 1]
      }
      - Hook Type: ${
        [
          'Fix a problem',
          'Quick Wins',
          'Reactions & Reviews',
          'Personal Advice',
          'Step-by-Step Guides',
          'Curiosity & Surprises',
          'Direct targeting',
        ][parseInt(hook_type) - 1]
      }

      Then, for each script:
      - Provide a subtitle (in Algerian Darja, 10-15 words) that reflects the specific focus within the content idea type and niche.
      - Generate a single script text that incorporates 3 hooks based on these prompts: ${hookPrompts.join(', ')}.
      - The script should be a cohesive narrative combining all 3 hooks, written in Algerian Darja using Arabic letters, no Latin letters unless necessary, and no emojis.
      - Each hook within the script should be a short sentence (3-5 seconds when spoken), and the entire script should be concise (15-20 seconds total).
      - The script must be relatable to daily Algerian life, shareable, and use repeatable formats for virality.
      - Use a confident, authoritative tone and simple, common Algerian words. Avoid Moroccan Darija words like حيت، سير، دابا، زوين، كنهضر، مزيان، راسك، واش.
      - Each hook should follow the 3 C's: concise, clear, and curiosity-sparking, hinting at the script's result.
      - Format the script as an HTML string with <p> tags for each hook or logical section.

      Return the response as a JSON object, like this:
      {
        "scripts": [
          {
            "subtitle": "Subtitle for script 1 in Algerian Darja",
            "content": "<p>Hook 1...</p><p>Hook 2...</p><p>Hook 3...</p>"
          },
          ...
        ]
      }
      Ensure the response contains only the JSON object, with no additional text, markdown, or code blocks.
    `;

    // Call OpenAI API to generate scripts
    const { text, usage } = await generateText({
      model: openai('gpt-4.1-nano-2025-04-14'),
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Parse the response as JSON
    let response: Omit<GenerateScriptsResponse, 'tokenUsage'>;
    try {
      response = JSON.parse(text);
      for (const script of response.scripts) {
        if (!script.subtitle || !script.content) {
          throw new Error('Invalid script structure');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    // Validate that each script content is a non-empty string
    for (const script of response.scripts) {
      if (typeof script.content !== 'string' || !script.content.trim()) {
        return NextResponse.json(
          { error: 'Invalid script content' },
          { status: 500 }
        );
      }
    }

    // Return the title, scripts, and token usage
    return NextResponse.json({
      ...response,
      tokenUsage: {
        prompt_tokens: usage?.promptTokens || 0,
        completion_tokens: usage?.completionTokens || 0,
        total_tokens: usage?.totalTokens || 0,
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