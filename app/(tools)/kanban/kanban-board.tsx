'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  KeyboardSensor,
  TouchSensor,
  MouseSensor,
  Announcements,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { BoardColumn, BoardContainer } from './board-column';
import { TaskCard, Task } from './task-card';
import { hasDraggableData, stripHtml } from './utils';
import { coordinateGetter } from './multipleContainersKeyboardPreset';
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
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/toast';
import { MinimalTiptapEditor } from '@/zdeprecated/split/minimal-tiptap';

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
  const [columns, setColumns] = useState<Column[]>(defaultCols);
  const pickedUpTaskColumn = useRef<ColumnId | null>(null);
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalScripts, setTotalScripts] = useState(0);
  const [editingScript, setEditingScript] = useState<{ id: string; content: string } | null>(null);
  const isMobile = useMediaQuery({ maxWidth: 640 });

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );

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
      // Map API response to Task interface and update tasks state
      const newTasks: Task[] = updatedContent.map((item: any) => ({
        id: item.id,
        columnId: item.stage,
        content: item.content,
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
    setEditingScript({ id: script.id, content: script.content });
  };

  const handleSaveEdit = async () => {
    if (!editingScript) return;
    try {
      const response = await fetch(`/api/content/${editingScript.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingScript.content }),
      });
      if (!response.ok) throw new Error('Failed to update script');
      setScripts((prev) =>
        prev.map((script) =>
          script.id === editingScript.id ? { ...script, content: editingScript.content } : script
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

  const moveTaskToNextColumn: any = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      let newStage: ColumnId;
      if (task.columnId === 'voice_over') {
        newStage = 'creation';
      } else if (task.columnId === 'creation') {
        newStage = 'done';
      } else {
        return; // Already in 'done'
      }

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
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to move task.',
      });
    }
  };

  function getDraggingTaskData(taskId: UniqueIdentifier, columnId: ColumnId) {
    const tasksInColumn = tasks.filter((task) => task.columnId === columnId);
    const taskPosition = tasksInColumn.findIndex((task) => task.id === taskId);
    const column = columns.find((col) => col.id === columnId);
    return {
      tasksInColumn,
      taskPosition,
      column,
    };
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      if (!hasDraggableData(active)) return;
      if (active.data.current?.type === 'Column') {
        const startColumnIdx = columnsId.findIndex((id) => id === active.id);
        const startColumn = columns[startColumnIdx];
        return `Picked up Column ${startColumn?.title} at position: ${startColumnIdx + 1} of ${columnsId.length}`;
      } else if (active.data.current?.type === 'Task') {
        pickedUpTaskColumn.current = active.data.current.task.columnId;
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          active.id,
          pickedUpTaskColumn.current
        );
        return `Picked up Task at position: ${taskPosition + 1} of ${tasksInColumn.length} in column ${column?.title}`;
      }
    },
    onDragOver({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) return;

      if (
        active.data.current?.type === 'Column' &&
        over.data.current?.type === 'Column'
      ) {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was moved over ${over.data.current.column.title} at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } else if (
        active.data.current?.type === 'Task' &&
        over.data.current?.type === 'Task'
      ) {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          over.id,
          over.data.current.task.columnId
        );
        if (over.data.current.task.columnId !== pickedUpTaskColumn.current) {
          return `Task was moved over column ${column?.title} in position ${taskPosition + 1} of ${tasksInColumn.length}`;
        }
        return `Task was moved over position ${taskPosition + 1} of ${tasksInColumn.length} in column ${column?.title}`;
      }
    },
    onDragEnd({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) {
        pickedUpTaskColumn.current = null;
        return;
      }
      if (
        active.data.current?.type === 'Column' &&
        over.data.current?.type === 'Column'
      ) {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was dropped into position ${overColumnPosition + 1} of ${columnsId.length}`;
      } else if (
        active.data.current?.type === 'Task' &&
        over.data.current?.type === 'Task'
      ) {
        const { tasksInColumn, taskPosition, column } = getDraggingTaskData(
          over.id,
          over.data.current.task.columnId
        );
        if (over.data.current.task.columnId !== pickedUpTaskColumn.current) {
          return `Task was dropped into column ${column?.title} in position ${taskPosition + 1} of ${tasksInColumn.length}`;
        }
        return `Task was dropped into position ${taskPosition + 1} of ${tasksInColumn.length} in column ${column?.title}`;
      }
      pickedUpTaskColumn.current = null;
    },
    onDragCancel({ active }) {
      pickedUpTaskColumn.current = null;
      if (!hasDraggableData(active)) return;
      return `Dragging ${active.data.current?.type} cancelled.`;
    },
  };

  return (
    <div className="p-4">
      <Button onClick={() => setIsDialogOpen(true)} className="mb-4">
        Add Script
      </Button>
      <DndContext
        accessibility={{ announcements }}
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <BoardContainer>
          {isMobile ? (
            <BoardColumn
              key="all-tasks"
              column={{ id: 'all-tasks', title: 'All Tasks' }}
              tasks={tasks}
              moveTaskToNextColumn={moveTaskToNextColumn}
            />
          ) : (
            <SortableContext items={columnsId}>
              {columns.map((col) => (
                <BoardColumn
                  key={col.id}
                  column={col}
                  tasks={tasks.filter((task) => task.columnId === col.id)}
                  moveTaskToNextColumn={moveTaskToNextColumn}
                />
              ))}
            </SortableContext>
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
                      <TableHead>Topic</TableHead>
                      <TableHead>Mood</TableHead>
                      <TableHead>Content Preview</TableHead>
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
                        <TableCell>{script.topic}</TableCell>
                        <TableCell>{script.mood}</TableCell>
                        <TableCell>{stripHtml(script.content).slice(0, 50)}...</TableCell>
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

        {'document' in window &&
          createPortal(
            <DragOverlay>
              {activeColumn && (
                <BoardColumn
                  isOverlay
                  column={activeColumn}
                  tasks={tasks.filter((task) => task.columnId === activeColumn.id)}
                  moveTaskToNextColumn={moveTaskToNextColumn}
                />
              )}
              {activeTask && <TaskCard task={activeTask} isOverlay />}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  );

  function onDragStart(event: DragStartEvent) {
    if (!hasDraggableData(event.active)) return;
    const data = event.active.data.current;
    if (data?.type === 'Column') {
      setActiveColumn(data.column);
      return;
    }

    if (data?.type === 'Task') {
      setActiveTask(data.task);
      return;
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (!hasDraggableData(active)) return;

    const activeData = active.data.current;

    if (activeId === overId) return;

    const isActiveAColumn = activeData?.type === 'Column';
    if (isActiveAColumn) {
      setColumns((columns) => {
        const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
        const overColumnIndex = columns.findIndex((col) => col.id === overId);
        return arrayMove(columns, activeColumnIndex, overColumnIndex);
      });
      return;
    }

    const isActiveATask = activeData?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (isActiveATask && (isOverATask || isOverAColumn)) {
      try {
        const newColumnId = isOverATask
          ? tasks.find((t) => t.id === overId)?.columnId
          : overId;

        if (newColumnId && newColumnId !== activeData.task.columnId) {
          const response = await fetch(`/api/content/${activeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: newColumnId }),
          });

          if (!response.ok) throw new Error('Failed to update stage');

          setTasks((tasks) => {
            const activeIndex = tasks.findIndex((t) => t.id === activeId);
            const overIndex = isOverATask ? tasks.findIndex((t) => t.id === overId) : activeIndex;
            tasks[activeIndex].columnId = newColumnId as ColumnId;
            return isOverATask ? arrayMove(tasks, activeIndex, overIndex) : [...tasks];
          });
        }
      } catch (error) {
        toast({
          type: 'error',
          description: 'Failed to move task.',
        });
      }
    }
  }

  async function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    const isActiveATask = activeData?.type === 'Task';
    const isOverATask = overData?.type === 'Task';

    if (!isActiveATask) return;

    if (isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);
        const activeTask = tasks[activeIndex];
        const overTask = tasks[overIndex];
        if (
          activeTask &&
          overTask &&
          activeTask.columnId !== overTask.columnId
        ) {
          activeTask.columnId = overTask.columnId;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }
        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = overData?.type === 'Column';

    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const activeTask = tasks[activeIndex];
        if (activeTask) {
          activeTask.columnId = overId as ColumnId;
          return arrayMove(tasks, activeIndex, activeIndex);
        }
        return tasks;
      });
    }
  }
}