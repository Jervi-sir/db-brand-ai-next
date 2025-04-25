// File: task-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ColumnId } from './kanban-board';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil } from 'lucide-react';
import { stripHtml } from './utils';
import { MinimalTiptapEditor } from '@/app/(tools)/components/minimal-tiptap';
import { cn } from '@/lib/utils';
import { toast } from '@/components/toast';
import { Label } from '@/components/ui/label';

export interface Task {
  id: string;
  title?: string;
  userPrompt?: string;
  columnId: ColumnId;
  generatedScript: string;
  scheduledDate?: string;
  deadline?: string;
}

interface TaskCardProps {
  task: Task;
  moveTaskToStage?: (taskId: string, direction: 'next' | 'previous') => void;
}

export function TaskCard({ task, moveTaskToStage }: TaskCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedScript, setEditedScript] = useState(task.generatedScript);
  const [isEditEnabled, setIsEditEnabled] = useState(false);

  // Determine badge text and variant based on columnId
  const getBadgeProps = () => {
    switch (task.columnId) {
      case 'voice_over':
        return { text: 'Voice Over', variant: 'default' as const };
      case 'creation':
        return { text: 'Creation', variant: 'secondary' as const };
      case 'done':
        return { text: 'Done', variant: 'destructive' as const };
      default:
        return { text: task.columnId, variant: 'outline' as const };
    }
  };

  const badgeProps = getBadgeProps();

  // Determine the next and previous stage text
  const getStageText = () => {
    let nextStage: string | null = null;
    let previousStage: string | null = null;

    switch (task.columnId) {
      case 'voice_over':
        nextStage = 'Creation';
        break;
      case 'creation':
        nextStage = 'Done';
        previousStage = 'Voice Over';
        break;
      case 'done':
        previousStage = 'Creation';
        break;
    }

    return { nextStage, previousStage };
  };

  const { nextStage, previousStage } = getStageText();

  // Truncate script to 100 characters
  const truncatedScript =
    stripHtml(task.generatedScript).slice(0, 100) +
    (stripHtml(task.generatedScript).length > 100 ? '...' : '');

  // Handle saving the edited script
  const handleSaveScript = async () => {
    try {
      const response = await fetch(`/api/content/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedScript: editedScript }),
      });
      if (!response.ok) throw new Error('Failed to update script');

      // Update the task's generatedScript locally
      task.generatedScript = editedScript;
      setIsDialogOpen(false);
      setIsEditEnabled(false); // Reset edit mode on save
      toast({
        type: 'success',
        description: 'Script updated successfully.',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to update script.',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="px-3 py-3 flex flex-row border-b-2 border-secondary relative items-center">
          <p>{task.title}</p>
          <Badge variant={badgeProps.variant} className="ml-auto font-semibold">
            {badgeProps.text}
          </Badge>
        </CardHeader>
        <CardContent className="px-3 pt-3 pb-6 text-left whitespace-pre-wrap flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span>{truncatedScript}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              aria-label="View full script"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          {task.scheduledDate && (
            <div className="text-xs text-muted-foreground">
              Scheduled: {new Date(task.scheduledDate).toLocaleDateString()}
            </div>
          )}
          {task.deadline && (
            <div className="text-xs text-muted-foreground">
              Deadline: {new Date(task.deadline).toLocaleDateString()}
            </div>
          )}
          {moveTaskToStage && (
            <div className="flex gap-2 self-end">
              {previousStage && (
                <Button
                  onClick={() => moveTaskToStage(task.id, 'previous')}
                  size="sm"
                  variant="outline"
                >
                  Move to {previousStage}
                </Button>
              )}
              {nextStage && (
                <Button
                  onClick={() => moveTaskToStage(task.id, 'next')}
                  size="sm"
                >
                  Move to {nextStage}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditedScript(task.generatedScript); // Reset script on close
            setIsEditEnabled(false); // Reset edit mode on close
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{task.title || 'Task Details'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {task.userPrompt && (
              <div>
                <Label>My Prompt</Label>
                <p className="text-sm">{task.userPrompt}</p>
              </div>
            )}
            <div>
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-sm font-semibold">Script</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditEnabled(!isEditEnabled)}
                  aria-label={isEditEnabled ? 'Disable editing' : 'Enable editing'}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {isEditEnabled ? 'Disable Edit' : 'Enable Edit'}
                </Button>
              </div>
              <div className="border rounded-xl p-2 dark:border-zinc-800">
                <MinimalTiptapEditor
                  value={editedScript}
                  onChange={(value: any) => setEditedScript(value)}
                  throttleDelay={2000}
                  className={cn('h-full min-h-[150px] w-full rounded-xl border-0')}
                  editorContentClassName="overflow-auto h-full"
                  output="html"
                  placeholder="Edit script..."
                  editable={isEditEnabled}
                  editorClassName="focus:outline-none px-2 py-2 h-full"
                />
              </div>
            </div>
            <div className='flex space-x-5 flex-wrap'>
              {task.scheduledDate && (
                <div className="text-sm">
                  <span className="font-semibold">Scheduled: </span>
                  {new Date(task.scheduledDate).toLocaleDateString()}
                </div>
              )}
              {task.deadline && (
                <div className="text-sm">
                  <span className="font-semibold">Deadline: </span>
                  {new Date(task.deadline).toLocaleDateString()}
                </div>
              )}
              <div className="text-sm">
                <span className="font-semibold">Stage: </span>
                {badgeProps.text}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditedScript(task.generatedScript); // Reset script on cancel
                setIsEditEnabled(false); // Reset edit mode on cancel
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveScript} disabled={!isEditEnabled}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}