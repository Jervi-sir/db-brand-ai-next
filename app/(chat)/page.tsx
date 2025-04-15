import { cookies } from 'next/headers';
import { Chat } from '@/components/chat';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const chatModelIDFromCookie = cookieStore.get('chat-model');
  const selectedChatModelID = chatModelIDFromCookie?.value || ''; // Empty string if no cookie

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedChatModelID={selectedChatModelID}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}