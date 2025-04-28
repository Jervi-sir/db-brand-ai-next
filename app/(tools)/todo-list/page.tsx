'use client';

import { useState, useEffect } from 'react';
import { stripHtml } from '../utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useMediaQuery } from 'react-responsive';
import { toast } from '@/components/toast';
import { MinimalTiptapEditor } from '@/app/(tools)/components/minimal-tiptap';
import { addDays } from 'date-fns';
import { Task } from './types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskCard } from './task-card';
import { Badge } from '@/components/ui/badge';

const parPage = 10;

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedScripts, setSelectedScripts] = useState<{ id: string; order: number }[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalScripts, setTotalScripts] = useState(0);
  const [editingScript, setEditingScript] = useState<{ id: string; content: string } | null>(null);
  const isMobile = useMediaQuery({ maxWidth: 640 });

  const fetchContent = async () => {
    try {
      const response = await fetch(`/todo-list/api/todo`);
      if (!response.ok) throw new Error('Failed to fetch content');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to load content.',
      });
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await fetch(`/todo-list/api/content?page=${page}&limit=${parPage}`);
        if (!response.ok) throw new Error('Failed to fetch scripts');
        const { scripts: fetchedScripts, total } = await response.json();
        setScripts(fetchedScripts);
        setTotalScripts(total);
      } catch (error) {
        toast({
          type: 'error',
          description: 'Failed to load scripts.',
        });
      }
    };
    if (isDialogOpen) {
      fetchScripts();
    }
  }, [page, isDialogOpen]);

  useEffect(() => {
    const taskIds = tasks.map((task) => task.id);
    const uniqueIds = new Set(taskIds);
    if (uniqueIds.size !== taskIds.length) {
      console.warn('Duplicate task IDs detected:', taskIds);
      setTasks((prev) => {
        const seenIds = new Set();
        return prev.filter((task) => {
          if (seenIds.has(task.id)) {
            return false;
          }
          seenIds.add(task.id);
          return true;
        });
      });
    }
  }, [tasks]);

  const handleAddScripts = async () => {
    try {
      const response = await fetch('/todo-list/api/voice-over', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentIds: selectedScripts.map((s) => s.id) }),
      });

      if (!response.ok) throw new Error('Failed to add voice-overs');

      const updatedContent = await response.json();
      const newTasks: Task[] = updatedContent.map((item: any) => ({
        id: item.id,
        title: item.title,
        columnId: 'voice_over',
        generatedScript: item.generatedScript,
        scheduledDate: item.scheduledDate,
        deadline: item.deadline,
      }));
      setTasks((prev) => [...prev, ...newTasks]);
      setIsDialogOpen(false);
      setSelectedScripts([]);
      setScripts([]);
      toast({
        type: 'success',
        description: 'Voice-overs scheduled successfully.',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to schedule voice-overs.',
      });
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    try {
      // Delete the script
      const deleteResponse = await fetch(`/todo-list/api/content/${scriptId}`, {
        method: 'DELETE',
      });
      if (!deleteResponse.ok) throw new Error('Failed to delete script');

      // Update scripts and selectedScripts state
      setScripts((prev) => prev.filter((script) => script.id !== scriptId));
      setSelectedScripts((prev) => prev.filter((s) => s.id !== scriptId));
      setTotalScripts((prev) => prev - 1); // Decrease total count

      // Fetch the next available script
      const excludeIds = scripts.map((s) => s.id).filter((id) => id !== scriptId);
      const nextScriptResponse = await fetch(
        `/todo-list/api/content/next?exclude=${excludeIds.join(',')}`
      );
      if (!nextScriptResponse.ok) throw new Error('Failed to fetch next script');

      const newScript = await nextScriptResponse.json();
      if (newScript) {
        setScripts((prev) => [...prev, newScript]);
        setTotalScripts((prev) => prev + 1); // Increment total count for new script
      }

      toast({
        type: 'success',
        description: 'Script deleted successfully.',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to delete script or fetch next script.',
      });
    }
  };

  const handleEditScript = (script: any) => {
    setEditingScript({ id: script.id, content: script.generatedScript });
  };

  const handleSaveEdit = async () => {
    if (!editingScript) return;
    try {
      const response = await fetch(`/todo-list/api/content/${editingScript.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedScript: editingScript.content }),
      });
      if (!response.ok) throw new Error('Failed to update script');
      setScripts((prev) =>
        prev.map((script) =>
          script.id === editingScript.id
            ? { ...script, generatedScript: editingScript.content }
            : script
        )
      );
      setEditingScript(null);
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

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleRemoveTask = async (taskId: string) => {
    setTasks((prev) => {
      const updatedTasks = prev.filter((task) => task.id !== taskId);
      const excludeIds = updatedTasks.map((t) => t.id).join(',');

      setTimeout(() => {
        const fetchNextTask = async () => {
          try {
            const response = await fetch(`/todo-list/api/content/next?exclude=${excludeIds}`);
            if (!response.ok) throw new Error('Failed to fetch next task');
            const newTask = await response.json();
            if (newTask) {
              setTasks((current) => {
                const existingIds = new Set(current.map((t) => t.id));
                if (existingIds.has(newTask.id)) {
                  console.warn(`Duplicate task ID ${newTask.id} detected, skipping.`);
                  return current;
                }
                return [...current, {
                  id: newTask.id,
                  title: newTask.title,
                  columnId: 'voice_over', // Default to 'voice_over' for new tasks
                  generatedScript: newTask.generatedScript,
                  scheduledDate: newTask.scheduledDate || null,
                  deadline: newTask.deadline || null,
                }];
              });
            }
          } catch (error) {
            toast({
              type: 'error',
              description: 'Failed to fetch next task.',
            });
          }
        };
        fetchNextTask();
      }, 200);

      return updatedTasks;
    });
  };

  return (
    <div className="p-4">
      <style jsx global>{`
        @keyframes appear {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-appear {
          animation: appear 500ms ease-out;
        }
      `}
      </style>
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between max-w-[1080px] mx-auto pb-4">
        <div className="w-full md:w-auto px-2">
          <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
            Add Script
          </Button>
        </div>
      </div>
      <ScrollArea className="md:px-0 pb-4 max-w-[1080px] mx-auto">
        <Card className="h-[500px] max-h-[500px] bg-primary-foreground flex flex-col">
          <CardHeader className="p-4 font-semibold border-b-2 text-center">
            <span>To-Do List</span>
          </CardHeader>
          <ScrollArea>
            <CardContent className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateTask={handleUpdateTask}
                      onRemoveTask={handleRemoveTask}
                    />
                  ))
                ) : (
                  <p className="col-span-3 text-center text-gray-500">No tasks available</p>
                )}
              </div>
            </CardContent>
          </ScrollArea>
        </Card>
      </ScrollArea>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl px-4">
          <DialogHeader>
            <DialogTitle>Select Scripts</DialogTitle>
          </DialogHeader>
          {editingScript ? (
            <div>
              <MinimalTiptapEditor
                value={editingScript.content}
                onChange={(value) => setEditingScript((prev: any) => ({ ...prev, content: value }))}
                className="min-h-[200px] w-full"
                output="html"
                editable={true}
                placeholder="Edit script..."
              />
              <div className="mt-4 flex gap-2">
                <Button onClick={handleSaveEdit}>Save</Button>
                <Button variant="outline" onClick={() => setEditingScript(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[300px] md:max-h-[400px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {scripts.map((script) => {
                    const selection = selectedScripts.find((s) => s.id === script.id);
                    return (
                      <Card key={script.id} className="flex flex-col animate-appear">
                        <CardHeader className="p-3 border-b">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm truncate">
                              {script.title || 'Untitled'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm truncate">
                                {selection ? `${selection.order}` : ''}
                              </span>
                              <Checkbox
                                checked={!!selection}
                                onCheckedChange={(checked) =>
                                  setSelectedScripts((prev) => {
                                    if (checked) {
                                      return [...prev, { id: script.id, order: prev.length + 1 }];
                                    }
                                    return prev.filter((s) => s.id !== script.id);
                                  })
                                }
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 flex flex-col gap-2 text-sm flex-1">
                          <div>
                            <span className="font-semibold">Preview: </span>
                            {stripHtml(script.generatedScript).slice(0, 100)}...
                          </div>
                          <div className="flex gap-2 mt-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditScript(script)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteScript(script.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
              <DialogFooter>
                <div className="flex flex-col gap-2 md:flex-row md:justify-between w-full">
                  <div className="space-x-2 flex flex-row w-full md:w-auto">
                    <Button
                      className="w-full"
                      disabled={page === 1}
                      onClick={() => setPage((prev) => prev - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      className="w-full"
                      disabled={page * parPage >= totalScripts}
                      onClick={() => setPage((prev) => prev + 1)}
                    >
                      Next
                    </Button>
                  </div>
                  <Button onClick={handleAddScripts} disabled={selectedScripts.length === 0}>
                    Add Selected Scripts
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}