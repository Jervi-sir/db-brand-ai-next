'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, ShareIcon, VercelIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo, useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { VisibilityType, VisibilitySelector } from './visibility-selector';
import { toast } from './toast';
import { ChatToneSettings } from '@/app/(chat)/sheet';
import { useSession } from 'next-auth/react';

function PureChatHeader({
  chatId,
  selectedModelID,
  selectedVisibilityType,
  isReadonly,
  onModelChange, // Add the callback prop
}: {
  chatId: string;
  selectedModelID: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  onModelChange?: (modelId: string) => void; // Define the callback type
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const [locallyIsPublic, setLocallyIsPublic] = useState(selectedVisibilityType === 'public');

  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/chat/${chatId}`; // Adjust URL structure as needed

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Share this chat',
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          type: 'success',
          description: 'Chat URL copied to clipboard!',
        });
      } catch (error) {
        toast({
          type: 'error',
          description: 'Failed to copy URL!',
        });
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && (
        <ModelSelector
          selectedModelID={selectedModelID}
          onModelChange={onModelChange} // Pass the callback to ModelSelector
          className="order-1 md:order-2"
        />
      )}

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-3"
          handleOnSelected={(e) => {
            setLocallyIsPublic(e === 'public');
          }}
        />
      )}

      {locallyIsPublic && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-3 md:order-4 md:px-2 px-2 md:h-fit"
              onClick={handleShare}
            >
              <ShareIcon />
              <span className="md:sr-only">Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share Chat</TooltipContent>
        </Tooltip>
      )}

      {isAdmin
        &&
        <div className="ml-auto order-last">
          <ChatToneSettings />
        </div>
      }

    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.selectedModelID === nextProps.selectedModelID &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType
  );
});