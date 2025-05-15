// app/(tools)/split-v2/components/PromptHistoryDialog.tsx
'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useScriptGenerator } from './script-generator-context';

interface PromptHistoryDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function PromptHistoryDialog({ open, setOpen }: PromptHistoryDialogProps) {
  const { promptHistory, selectPrompt, deletePrompt } = useScriptGenerator();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Prompt History</DialogTitle>
          <DialogDescription>
            Select a previous prompt to populate the form or delete unwanted prompts.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] mt-4">
          {promptHistory.length === 0 ? (
            <p className="text-center text-gray-500">No prompt history yet.</p>
          ) : (
            <div className="space-y-2">
              {promptHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      selectPrompt(entry);
                      setOpen(false);
                    }}
                  >
                    <p className="text-sm truncate">{entry.prompt}</p>
                    {entry.clientPersona && (
                      <p className="text-xs text-gray-500">Persona: {entry.clientPersona}</p>
                    )}
                    {entry.hookType.length > 0 && (
                      <p className="text-xs text-gray-500">Hooks: {entry.hookType.join(', ')}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePrompt(entry.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}