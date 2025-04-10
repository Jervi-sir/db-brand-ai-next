// app/(chat)/api/chat/route.ts
import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  db,
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { isProductionEnvironment } from '@/lib/constants';
import { NextResponse } from 'next/server';
import { myProvider } from '@/lib/ai/providers';
import { aiModel, openAiApiUsage } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModelID,
    }: {
      id: string;
      messages: Array<Message>;
      selectedChatModelID: string;
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // Retrieve the AIModel by ID
    const [modelDetails] = await db
      .select({
        name: aiModel.name,
        endpoint: aiModel.endpoint,
        apiKey: aiModel.apiKey,
        capability: aiModel.capability,
        customPrompts: aiModel.customPrompts,
      })
      .from(aiModel)
      .where(eq(aiModel.id, selectedChatModelID))
      .limit(1);

    if (!modelDetails) {
      return new Response('Selected model not found', { status: 404 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Save the user message with initial fields
    await saveMessages({
      messages: [{
        ...userMessage,
        createdAt: new Date(),
        chatId: id,
        model: modelDetails.name, // Set the model used
      } as any],
    });

    return createDataStreamResponse({
      execute: (dataStream) => {
        // Start timing
        const startTime = performance.now();
        const result = streamText({
          model: openai(modelDetails.name),//myProvider.languageModel(selectedChatModel),
          system: modelDetails.customPrompts || undefined,//systemPrompt({ selectedChatModel }),
          messages: [userMessage],
          maxSteps: 1,
          onFinish: async ({ response, reasoning, usage }) => {
            if (session.user?.id) {
              try {
                // Calculate duration in seconds
                const endTime = performance.now();
                const duration = (endTime - startTime) / 1000; // Convert ms to seconds

                const sanitizedResponseMessages = sanitizeResponseMessages({
                  messages: response.messages,
                  reasoning,
                }).map((message) => ({
                  // ...message,
                  chatId: id,
                  role: message.role,
                  content: message.content,
                  createdAt: new Date(),
                  model: modelDetails.name, // Set the model used
                  promptTokens: usage?.promptTokens || null, // From provider
                  completionTokens: usage?.completionTokens || null, // From provider
                  totalTokens: usage?.totalTokens || null, // From provider
                  duration: duration || null, // Optional: track duration if available
                  annotations: [{
                    duration, // Add duration to annotations
                    promptTokens: usage?.promptTokens || null,
                    completionTokens: usage?.completionTokens || null,
                    totalTokens: usage?.totalTokens || null,
                  }],
                }));
               
                await saveMessages({ messages: sanitizedResponseMessages });
                // Insert into OpenAiApiUsage
                await db.insert(openAiApiUsage).values({
                  id: generateUUID(), // Generate a new UUID
                  chatId: id,
                  model: modelDetails.name,
                  type: 'chat', // Define type (e.g., 'chat', 'tool'); adjust as needed
                  promptTokens: usage?.promptTokens || 0, // Default to 0 if not provided
                  completionTokens: usage?.completionTokens || 0, // Default to 0 if not provided
                  totalTokens: usage?.totalTokens || (usage?.promptTokens || 0) + (usage?.completionTokens || 0), // Calculate if not provided
                  duration: duration as number || null,
                  completedAt: new Date(),
                });

                dataStream.writeMessageAnnotation({
                  duration, // Add duration to annotations
                  promptTokens: usage?.promptTokens || null,
                  completionTokens: usage?.completionTokens || null,
                  totalTokens: usage?.totalTokens || null,
                });

              } catch (error) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();


        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
          sendUsage: true,
        });

        // return NextResponse.json({ result }, { status: 200 });
      },
      onError: () => {
        return 'Oops, an error occured!';
      },
    });
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    console.error('Error processing DELETE request', {
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
