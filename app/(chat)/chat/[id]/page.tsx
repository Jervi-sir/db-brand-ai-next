import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { db, getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { aiModel } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

const DEFAULT_CHAT_MODEL = '';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });
  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({ id });

  const cookieStore = await cookies();
  const chatModelIDFromCookie = cookieStore.get('chat-model');
  // Initialize selectedChatModel
  let selectedChatModelID = DEFAULT_CHAT_MODEL;
  // Check the first message's model and fetch from aiModel table
  if (messagesFromDb.length > 0 && messagesFromDb[0].model) {
    const messageModelName = messagesFromDb[0].model;
    // Query aiModel table for the model by name
    const dbModel = await db
      .select({
        id: aiModel.id,
        name: aiModel.name,
      })
      .from(aiModel)
      .where(and(eq(aiModel.name, messageModelName), eq(aiModel.isActive, true)))
      .limit(1);

    if (dbModel.length > 0) {
      selectedChatModelID = dbModel[0].id;
    }
  }

  // If no model selected yet, try to select the first active model
  if (!selectedChatModelID) {
    const dbModel = await db
      .select({
        id: aiModel.id,
      })
      .from(aiModel)
      .where(eq(aiModel.isActive, true))
      .orderBy(aiModel.createdAt)
      .limit(1);

    selectedChatModelID = dbModel.length > 0 ? dbModel[0].id : '';
  }


  // if (!chatModelIDFromCookie) {
    return (
      <>
        <Chat
          id={chat.id}
          initialMessages={convertToUIMessages(messagesFromDb)}
          selectedChatModelID={selectedChatModelID}
          selectedVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
        />
        <DataStreamHandler id={id} />
      </>
    );
  // }
  // console.log('selectedChatModel2: ', selectedChatModelID)

  // return (
  //   <>
  //     <Chat
  //       id={chat.id}
  //       initialMessages={convertToUIMessages(messagesFromDb)}
  //       selectedChatModelID={chatModelIDFromCookie.value}
  //       selectedVisibilityType={chat.visibility}
  //       isReadonly={session?.user?.id !== chat.userId}
  //     />
  //     <DataStreamHandler id={id} />
  //   </>
  // );
}
