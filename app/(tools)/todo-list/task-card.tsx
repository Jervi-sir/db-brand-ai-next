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
import { Task } from './types';

interface TaskCardProps {
  task: Task;
  onUpdateTask: (updatedTask: Task) => void;
  onRemoveTask: (taskId: string) => void;
}

export function TaskCard({ task, onUpdateTask, onRemoveTask }: TaskCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [editedScript, setEditedScript] = useState(task.generatedScript);
  const [isEditEnabled, setIsEditEnabled] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [localTask, setLocalTask] = useState(task);
  const [isRescheduled, setIsRescheduled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isVanishing, setIsVanishing] = useState(false);

  const stages = ['voice_over', 'creation', 'done'];
  const currentStageIndex = stages.indexOf(localTask.columnId);
  const hasPreviousStage = currentStageIndex > 0;
  const hasNextStage = currentStageIndex < stages.length - 1;

  useEffect(() => {
    setLocalTask(task);
    setEditedScript(task.generatedScript);
    setIsVisible(true);
    setIsVanishing(false);
  }, [task]);

  useEffect(() => {
    if (isRescheduleDialogOpen) {
      const fetchSuggestedDate = async () => {
        try {
          const response = await fetch('/todo-list/api/voice-over/reschedule-date');
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

  const isDeadlinePassed = localTask.deadline
    ? isSameDay(parseISO(localTask.deadline), new Date()) ||
      isBefore(startOfDay(parseISO(localTask.deadline)), startOfDay(new Date()))
    : false;

  const truncatedScript =
    stripHtml(localTask?.generatedScript || '').slice(0, 360) +
    (stripHtml(localTask?.generatedScript || '').length > 360 ? '...' : '');

  const handleSaveScript = async () => {
    try {
      const response = await fetch(`/todo-list/api/content/${localTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedScript: editedScript }),
      });
      if (!response.ok) throw new Error('Failed to update script');

      const updatedTask = { ...localTask, generatedScript: editedScript };
      setLocalTask(updatedTask);
      onUpdateTask(updatedTask);
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

  const handleReschedule = async () => {
    if (!rescheduleDate) {
      toast({
        type: 'error',
        description: 'Please select a reschedule date.',
      });
      return;
    }

    try {
      const response = await fetch('/todo-list/api/voice-over/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: localTask.id,
          newDeadline: rescheduleDate,
        }),
      });
      if (!response.ok) throw new Error('Failed to reschedule task');

      const updatedTask = await response.json();
      const newTask = {
        ...localTask,
        deadline: updatedTask.deadline,
        columnId: updatedTask.stage || 'voice_over',
      };
      setLocalTask(newTask);
      onUpdateTask(newTask);
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

  const handleMoveStage = async (direction: 'next' | 'previous') => {
    const newStageIndex =
      direction === 'next' ? currentStageIndex + 1 : currentStageIndex - 1;
    const newStage = stages[newStageIndex];

    try {
      const response = await fetch(`/todo-list/api/content/${localTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!response.ok) throw new Error('Failed to update task stage');

      const updatedTask: any = { ...localTask, columnId: newStage };
      setLocalTask(updatedTask);
      onUpdateTask(updatedTask);

      if (newStage === 'done') {
        setIsVanishing(true);
        setTimeout(() => {
          setIsVisible(false);
          onRemoveTask(localTask.id);
        }, 2000);
      }

      toast({
        type: 'success',
        description: `Task moved to ${
          newStage === 'voice_over' ? 'Voice Over' : newStage === 'creation' ? 'Creation' : 'Done'
        } stage.`,
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to move task stage.',
      });
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <Card
        className={cn(
          'min-h-[300px] transition-all duration-500 ease-out flex flex-col',
          isVanishing ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
          'animate-appear'
        )}
      >
        <CardHeader className="p-3 py-1 flex flex-row border-b-2 border-secondary relative items-center justify-between gap-1">
          <p className="text-sm">{localTask.title || 'Untitled Task'}</p>
          <div className="flex flex-col items-end gap-0.5">
            <Badge
              variant="default"
              className={cn(
                'font-semibold',
                localTask.columnId === 'voice_over' && 'bg-blue-500',
                localTask.columnId === 'creation' && 'bg-green-500',
                localTask.columnId === 'done' && 'bg-gray-500',
                'p-0 px-3'
              )}
            >
              {localTask.columnId === 'voice_over'
                ? 'Voice Over'
                : localTask.columnId === 'creation'
                  ? 'Creation'
                  : 'Done'}
            </Badge>
            {localTask.deadline && (
              <div className="text-sm ml-auto text-muted-foreground text-nowrap">
                Deadline: {new Date(localTask.deadline).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 text-left whitespace-pre-wrap flex flex-col flex-1">
          <div className="flex-1">
            <span>{truncatedScript}</span>
          </div>
          <div className="flex flex-row gap-2 items-center justify-end mt-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              aria-label="View full script"
            >
              <Eye className="size-4" />
            </Button>
            {localTask.columnId !== 'done' && (
              <div className="space-x-2">
                {hasPreviousStage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveStage('previous')}
                    aria-label="Move to previous stage"
                  >
                    Move to Voice-over
                  </Button>
                )}
                {hasNextStage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveStage('next')}
                    aria-label="Move to next stage"
                  >
                    Move to {localTask.columnId === 'voice_over' ? 'Creation' : 'Done'}
                  </Button>
                )}
                {isDeadlinePassed && (
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
                )}
              </div>
            )}
          </div>
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
            {localTask?.userPrompt && (
              <div>
                <Label>My Prompt</Label>
                <p className="text-sm">{localTask?.userPrompt || ''}</p>
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
                    editable={true}
                    editorClassName="focus:outline-none px-2 py-2 h-full"
                  />
                ) : (
                  <div
                    className="min-h-[150px] w-full overflow-auto p-2 text-sm"
                    dangerouslySetInnerHTML={{ __html: editedScript || '' }}
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