'use client';

import type { Attachment } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import { message, type Vote } from '@/lib/db/schema';
import { fetcher, generateUUID, Message } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { useLockStore } from '@/zustand/use-lock-store';
import { Textarea } from './ui/textarea';
import { cx } from 'class-variance-authority';
import { Button } from './ui/button';
import { ArrowUpIcon, Unlock } from 'lucide-react';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const usedCode = useLockStore((state: any) => state.usedCode);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  }: any = useChat({
    id,
    body: { id, selectedChatModelID: selectedChatModel, usedCode: usedCode },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: ({ id, annotations }, { usage }) => {
      // Update the specific message with usage data
      // console.log('annotations: ', annotations)
      setMessages((prevMessages: any[]) =>
        prevMessages.map((msg) =>
          msg.id === id
            ? {
              ...msg,
              promptTokens: usage?.promptTokens || null,
              completionTokens: usage?.completionTokens || null,
              totalTokens: usage?.totalTokens || null,
              duration: (annotations as any)?.[0]?.duration || null
            }
            : msg
        )
      );
      mutate('/api/history');
    },
    onError: () => {
      toast.error('An error occured, please try again!');
    },
  });

  // const { data: votes } = useSWR<Array<Vote>>(
  //   `/api/vote?chatId=${id}`,
  //   fetcher,
  // );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const isUnlocked = useLockStore((state: any) => state.isUnlocked);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          status={status}
          // votes={votes}
          messages={messages as any}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {isUnlocked
            ? !isReadonly && (
              <MultimodalInput
                chatId={id}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                status={status}
                stop={stop}
                // attachments={attachments}
                // setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
              />
            )
            : <UnlockInput />
          }
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        // attachments={attachments}
        // setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        // votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}


const UnlockInput = () => {
  const [input, setInput] = useState('');
  const isUnlocked = useLockStore((state: any) => state.isUnlocked);
  const error = useLockStore((state: any) => state.error);
  const reset = useLockStore((state: any) => state.reset);
  const unlock = useLockStore((state: any) => state.unlock);
  const loadFromSession = useLockStore((state: any) => state.loadFromSession);
  
  const handleUnlock = async () => {
    if (!input.trim()) return;
    await unlock(input);
    if (isUnlocked) {
      setInput(''); // Clear input on success
    }
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleUnlock();
    }
  };
  useEffect(() => {
    loadFromSession();
    setTimeout(() => {
    if(!isUnlocked) {
        reset()
      }
    }, 3000);
  }, [])
  return (
    <div className="relative w-full flex flex-col gap-4">
      <div className='relative'>
        <Textarea
          data-testid="multimodal-input"
          placeholder={isUnlocked ? 'Unlocked! Send a message...' : 'Enter unlock code...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={cx(
            'max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base dark:bg-zinc-950 pb-2 pt-4 dark:border-zinc-700',
            isUnlocked ? 'bg-green-50 dark:bg-green-900/20' : ''
          )}
          rows={2}
          autoFocus
          disabled={isUnlocked} // Disable input after unlocking
          onKeyDown={handleKeyDown}
        />
        <div className="absolute top-0 right-0 p-2 pt-4 w-fit flex flex-row justify-end">
          <Button
            type='button'
            data-testid="send-button"
            className="rounded-lg p-1.5 h-8 px-2 border dark:border-zinc-900"
            onClick={handleUnlock}
            disabled={isUnlocked || !input.trim()} // Disable if unlocked or input is empty
          >
            <Unlock size={16} />
            <span>{isUnlocked ? 'Unlocked' : 'Unlock'}</span>
          </Button>
        </div>
        <div className='absolute bottom-0 left-0 pb-4 pl-4'>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  )
}