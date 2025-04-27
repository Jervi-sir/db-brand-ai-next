// File: task-card.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Calendar, CheckCircle } from 'lucide-react';
import { stripHtml } from '../utils';
import { MinimalTiptapEditor } from '@/app/(tools)/components/minimal-tiptap';
import { cn } from '@/lib/utils';
import { toast } from '@/components/toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { parseISO, addDays, format, isSameDay, isBefore, startOfDay } from 'date-fns';
import { ColumnId } from './types';

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
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [editedScript, setEditedScript] = useState(task.generatedScript);
  const [isEditEnabled, setIsEditEnabled] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [localTask, setLocalTask] = useState(task);
  const [isRescheduled, setIsRescheduled] = useState(false);

  // Fetch suggested reschedule date when dialog opens
  useEffect(() => {
    if (isRescheduleDialogOpen) {
      const fetchSuggestedDate = async () => {
        try {
          const response = await fetch('/kanban/api/voice-over/reschedule-date');
          if (!response.ok) throw new Error('Failed to fetch suggested date');
          const { suggestedDate } = await response.json();
          setSuggestedDate(suggestedDate.split('T')[0]);
          setRescheduleDate(suggestedDate.split('T')[0]);
        } catch (error) {
          toast({
            type: 'error',
            description: 'Failed to fetch suggested reschedule date.',
          });
        }
      };
      fetchSuggestedDate();
    }
  }, [isRescheduleDialogOpen]);

  // Determine badge text and variant based on columnId
  const getBadgeProps = () => {
    switch (localTask.columnId) {
      case 'voice_over':
        return { text: 'Voice Over', variant: 'default' as const };
      case 'creation':
        return { text: 'Creation', variant: 'secondary' as const };
      case 'done':
        return { text: 'Done', variant: 'destructive' as const };
      default:
        return { text: localTask.columnId, variant: 'outline' as const };
    }
  };

  const badgeProps = getBadgeProps();

  // Determine the next and previous stage text
  const getStageText = () => {
    let nextStage: string | null = null;
    let previousStage: string | null = null;

    switch (localTask.columnId) {
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

  // Check if deadline has passed (deadline is today or before today, ignoring hours)
  const isDeadlinePassed = localTask.deadline
    ? isSameDay(parseISO(localTask.deadline), new Date()) ||
      isBefore(startOfDay(parseISO(localTask.deadline)), startOfDay(new Date()))
    : false;

  // Truncate script to 100 characters
  const truncatedScript =
    stripHtml(localTask.generatedScript).slice(0, 100) +
    (stripHtml(localTask.generatedScript).length > 100 ? '...' : '');

  // Handle saving the edited script
  const handleSaveScript = async () => {
    try {
      const response = await fetch(`/kanban/api/content/${localTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedScript: editedScript }),
      });
      if (!response.ok) throw new Error('Failed to update script');

      setLocalTask((prev) => ({ ...prev, generatedScript: editedScript }));
      setIsDialogOpen(false);
      setIsEditEnabled(false);
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

  // Handle rescheduling the task
  const handleReschedule = async () => {
    if (!rescheduleDate) {
      toast({
        type: 'error',
        description: 'Please select a reschedule date.',
      });
      return;
    }

    try {
      const response = await fetch('/kanban/api/voice-over/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: localTask.id,
          newDeadline: rescheduleDate,
        }),
      });
      if (!response.ok) throw new Error('Failed to reschedule task');

      const updatedTask = await response.json();
      setLocalTask((prev) => ({
        ...prev,
        deadline: updatedTask.deadline,
        columnId: updatedTask.stage,
      }));
      setIsRescheduleDialogOpen(false);
      setRescheduleDate('');
      setSuggestedDate('');
      setIsRescheduled(true);
      toast({
        type: 'success',
        description: 'Task rescheduled successfully.',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to reschedule task.',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="p-3 flex flex-row border-b-2 border-secondary relative items-center">
          <Badge variant={badgeProps.variant} className="font-semibold">
            {badgeProps.text}
          </Badge>
          {localTask.deadline && (
            <div className="text-sm ml-auto text-muted-foreground">
              Deadline: {new Date(localTask.deadline).toLocaleDateString()}
            </div>
          )}
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
              <Eye className="size-4" />
            </Button>
          </div>
          {moveTaskToStage && !isDeadlinePassed && (
            <div className="flex gap-2 self-end">
              {previousStage && (
                <Button
                  onClick={() => moveTaskToStage(localTask.id, 'previous')}
                  size="sm"
                  variant="outline"
                  className="py-1"
                >
                  Move to {previousStage}
                </Button>
              )}
              {nextStage && (
                <Button
                  onClick={() => moveTaskToStage(localTask.id, 'next')}
                  size="sm"
                  className="py-1"
                  variant="secondary"
                >
                  Move to {nextStage}
                </Button>
              )}
            </div>
          )}
          {isDeadlinePassed && (
            <div className="flex gap-2 self-end">
              <Button
                onClick={() => setIsRescheduleDialogOpen(true)}
                size="sm"
                className="py-1"
                variant="secondary"
                disabled={isRescheduled}
              >
                {isRescheduled ? (
                  <>
                    <CheckCircle className="size-4 mr-2" />
                    Scheduled
                  </>
                ) : (
                  <>
                    <Calendar className="size-4 mr-2" />
                    Reschedule
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Script Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditedScript(localTask.generatedScript);
            setIsEditEnabled(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{localTask.title || 'Task Details'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {localTask.userPrompt && (
              <div>
                <Label>My Prompt</Label>
                <p className="text-sm">{localTask.userPrompt}</p>
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
                  <Pencil className="size-4 mr-2" />
                  {isEditEnabled ? 'Disable Edit' : 'Enable Edit'}
                </Button>
              </div>
              <div className="border rounded-xl p-2 dark:border-zinc-800">
                {isEditEnabled ? (
                  <MinimalTiptapEditor
                    value={editedScript}
                    onChange={(value: any) => setEditedScript(value)}
                    throttleDelay={2000}
                    className={cn('h-full min-h-[150px] w-full rounded-xl border-0')}
                    editorContentClassName="overflow-auto h-full"
                    output="html"
                    placeholder="Edit script..."
                    editable={true} // Hardcoded to true
                    editorClassName="focus:outline-none px-2 py-2 h-full"
                  />
                ) : (
                  <div
                    className="min-h-[150px] w-full overflow-auto p-2 text-sm"
                    dangerouslySetInnerHTML={{ __html: editedScript }}
                  />
                )}
              </div>
            </div>
            <div className="flex space-x-5 flex-wrap">
              {localTask.scheduledDate && (
                <div className="text-sm">
                  <span className="font-semibold">Scheduled: </span>
                  {new Date(localTask.scheduledDate).toLocaleDateString()}
                </div>
              )}
              {localTask.deadline && (
                <div className="text-sm">
                  <span className="font-semibold">Deadline: </span>
                  {new Date(localTask.deadline).toLocaleDateString()}
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
                setEditedScript(localTask.generatedScript);
                setIsEditEnabled(false);
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

      {/* Reschedule Dialog */}
      <Dialog
        open={isRescheduleDialogOpen}
        onOpenChange={(open) => {
          setIsRescheduleDialogOpen(open);
          if (!open) {
            setRescheduleDate('');
            setSuggestedDate('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Task</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label>Task</Label>
              <p className="text-sm">{localTask.title || 'Untitled Task'}</p>
            </div>
            <div>
              <Label>Reschedule Date</Label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
              />
              {suggestedDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Suggested: {new Date(suggestedDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRescheduleDialogOpen(false);
                setRescheduleDate('');
                setSuggestedDate('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleReschedule}>
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}