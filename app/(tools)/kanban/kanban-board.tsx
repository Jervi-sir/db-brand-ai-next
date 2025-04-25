// File: kanban-board.tsx
'use client';

import { useState, useEffect } from 'react';
import { BoardColumn, BoardContainer } from './board-column';
import { TaskCard, Task } from './task-card';
import { stripHtml } from './utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useMediaQuery } from 'react-responsive';
import { toast } from '@/components/toast';
import { MinimalTiptapEditor } from '@/app/(tools)/components/minimal-tiptap';

const defaultCols = [
  { id: 'voice_over', title: 'Voice Over' },
  { id: 'creation', title: 'Creation' },
  { id: 'done', title: 'Done' },
] satisfies Column[];

export type ColumnId = (typeof defaultCols)[number]['id'];

interface Column {
  id: any;
  title: string;
}

export function KanbanBoard() {
  const [columns] = useState<Column[]>(defaultCols);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalScripts, setTotalScripts] = useState(0);
  const [editingScript, setEditingScript] = useState<{ id: string; content: string } | null>(null);
  const isMobile = useMediaQuery({ maxWidth: 640 });

  // Fetch content for Kanban board
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/content/kanban');
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
    fetchContent();
  }, []);

  // Fetch paginated scripts for dialog
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await fetch(`/api/content?page=${page}&limit=10`);
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

  const handleAddScripts = async () => {
    try {
      const response = await fetch('/api/content/voice-over', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentIds: selectedScripts }),
      });

      if (!response.ok) throw new Error('Failed to add voice-overs');

      const updatedContent = await response.json();
      const newTasks: Task[] = updatedContent.map((item: any) => ({
        id: item.id,
        title: item.title,
        columnId: item.stage,
        generatedScript: item.generatedScript,
        scheduledDate: item.scheduledDate,
        deadline: item.deadline,
      }));
      setTasks((prev) => [...prev, ...newTasks]);
      setIsDialogOpen(false);
      setSelectedScripts([]);
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
      const response = await fetch(`/api/content/${scriptId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete script');
      setScripts((prev) => prev.filter((script) => script.id !== scriptId));
      setSelectedScripts((prev) => prev.filter((id) => id !== scriptId));
      toast({
        type: 'success',
        description: 'Script deleted successfully.',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to delete script.',
      });
    }
  };

  const handleEditScript = (script: any) => {
    setEditingScript({ id: script.id, content: script.generatedScript });
  };

  const handleSaveEdit = async () => {
    if (!editingScript) return;
    try {
      const response = await fetch(`/api/content/${editingScript.id}`, {
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

  const moveTaskToStage = async (taskId: string, direction: 'next' | 'previous') => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      let newStage: ColumnId | null = null;
      if (direction === 'next') {
        if (task.columnId === 'voice_over') {
          newStage = 'creation';
        } else if (task.columnId === 'creation') {
          newStage = 'done';
        }
      } else if (direction === 'previous') {
        if (task.columnId === 'done') {
          newStage = 'creation';
        } else if (task.columnId === 'creation') {
          newStage = 'voice_over';
        }
      }

      if (!newStage) return; // No valid stage to move to

      const response = await fetch(`/api/content/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!response.ok) throw new Error('Failed to update stage');

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, columnId: newStage } : t
        )
      );
      toast({
        type: 'success',
        description: `Task moved to ${newStage}.`,
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to move task.',
      });
    }
  };

  return (
    <div className="p-4">
      <Button onClick={() => setIsDialogOpen(true)} className="mb-4">
        Add Script
      </Button>
      <BoardContainer>
        {isMobile ? (
          <BoardColumn
            key="all-tasks"
            column={{ id: 'all-tasks', title: 'All Tasks' }}
            tasks={tasks}
            moveTaskToStage={moveTaskToStage}
          />
        ) : (
          columns.map((col) => (
            <BoardColumn
              key={col.id}
              column={col}
              tasks={tasks.filter((task) => task.columnId === col.id)}
              moveTaskToStage={moveTaskToStage}
            />
          ))
        )}
      </BoardContainer>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Select</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Mood</TableHead>
                    <TableHead>Script Preview</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scripts.map((script) => (
                    <TableRow key={script.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedScripts.includes(script.id)}
                          onCheckedChange={(checked) =>
                            setSelectedScripts((prev) =>
                              checked
                                ? [...prev, script.id]
                                : prev.filter((id) => id !== script.id)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>{script.title}</TableCell>
                      <TableCell>{script.mood}</TableCell>
                      <TableCell>{stripHtml(script.generatedScript).slice(0, 50)}...</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditScript(script)}
                          className="mr-2"
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-between">
                <Button
                  disabled={page === 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <Button
                  disabled={page * 10 >= totalScripts}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddScripts}
                  disabled={selectedScripts.length === 0}
                >
                  Add Selected Scripts
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}