import { db } from '@/lib/db/queries';
import { aiModel } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: '1',
    name: 'Small model',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: '2',
    name: 'Large model',
    description: 'Large model for complex, multi-step tasks',
  },
  {
    id: '3',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
];

// Async function to return the ID of the first active model
export const DEFAULT_CHAT_MODEL = async (): Promise<string> => {
  const activeModel = await db
    .select({
      id: aiModel.id,
    })
    .from(aiModel)
    .where(eq(aiModel.isActive, true))
    .orderBy(aiModel.createdAt)
    .limit(1);

  return activeModel.length > 0 ? activeModel[0].id : '';
};