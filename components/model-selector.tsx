'use client';

import { startTransition, useMemo, useOptimistic, useState, useEffect } from 'react';
import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

export function ModelSelector({
  selectedModelID,
  onModelChange, // Add the callback prop
  className,
}: {
  selectedModelID: string;
  onModelChange?: (modelId: string) => void; // Define the callback type
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] = useOptimistic(selectedModelID || '');
  const [models, setModels] = useState<{ id: string; name: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch models from API and select first model if none is selected
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/ai-active-models', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        setModels(data);

        // If no model is selected and models are available, select the first one
        if (!selectedModelID && data.length > 0) {
          const firstModelId = data[0].id;
          startTransition(() => {
            setOptimisticModelId(firstModelId);
            saveChatModelAsCookie(firstModelId);
            onModelChange?.(firstModelId); // Notify parent
          });
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, [selectedModelID, onModelChange, setOptimisticModelId]);

  const selectedChatModel: any = useMemo(
    () => models.find((chatModel) => chatModel.id === optimisticModelId),
    [optimisticModelId, models],
  );

  if (loading) {
    return <Button variant="outline" disabled>Loading models...</Button>;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {selectedChatModel?.displayName || selectedChatModel?.name || 'Select Model'}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {models.length === 0 ? (
          <DropdownMenuItem disabled>No models available</DropdownMenuItem>
        ) : (
          models.map((chatModel: any) => {
            const { id } = chatModel;

            return (
              <DropdownMenuItem
                data-testid={`model-selector-item-${id}`}
                key={id}
                onSelect={() => {
                  setOpen(false);
                  startTransition(() => {
                    setOptimisticModelId(id);
                    saveChatModelAsCookie(id);
                    onModelChange?.(id); // Notify parent
                  });
                }}
                data-active={id === optimisticModelId}
                asChild
              >
                <button
                  type="button"
                  className="gap-4 group/item flex flex-row justify-between items-center w-full"
                >
                  <div className="flex flex-col gap-1 items-start">
                    <div>{chatModel.displayName || chatModel.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {chatModel.description || 'No description available'}
                    </div>
                  </div>
                  <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                    <CheckCircleFillIcon />
                  </div>
                </button>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}