"use client";

import { useState, useEffect } from "react";
import { stripHtml } from "../utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useMediaQuery } from "react-responsive";
import { toast } from "@/components/toast";
import { MinimalTiptapEditor } from "@/app/(tools)/components/minimal-tiptap";
import { WeekPicker } from "@/components/ui/week-picker";
import { addDays, startOfDay, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Column, ColumnId, defaultCols, Task } from "./types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TaskCard } from "./task-card";

const parPage = 10;

export default function Page() {
  const [columns] = useState<Column[]>(defaultCols);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedScripts, setSelectedScripts] = useState<{ id: string; order: number }[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalScripts, setTotalScripts] = useState(0);
  const [editingScript, setEditingScript] = useState<{ id: string; content: string } | null>(null);
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const [selectedWeek, setSelectedWeek] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: addDays(startOfDay(new Date()), 6),
  });

  const fetchContent = async () => {
    try {
      const from = selectedWeek.from.toISOString();
      const to = selectedWeek.to.toISOString();
      const response = await fetch(`/kanban/api/kanban?from=${from}&to=${to}`);
      if (!response.ok) throw new Error("Failed to fetch content");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to load content.",
      });
    }
  };

  useEffect(() => {
    fetchContent();
  }, [selectedWeek]);

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await fetch(`/kanban/api/content?page=${page}&limit=${parPage}`);
        if (!response.ok) throw new Error("Failed to fetch scripts");
        const { scripts: fetchedScripts, total } = await response.json();
        setScripts(fetchedScripts);
        setTotalScripts(total);
      } catch (error) {
        toast({
          type: "error",
          description: "Failed to load scripts.",
        });
      }
    };
    if (isDialogOpen) {
      fetchScripts();
    }
  }, [page, isDialogOpen]);

  const handleAddScripts = async () => {
    try {
      const response = await fetch("/kanban/api/voice-over", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentIds: selectedScripts.map((s) => s.id) }),
      });

      if (!response.ok) throw new Error("Failed to add voice-overs");

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
      setScripts([]);
      toast({
        type: "success",
        description: "Voice-overs scheduled successfully.",
      });
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to schedule voice-overs.",
      });
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    try {
      const response = await fetch(`/kanban/api/content/${scriptId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete script");
      setScripts((prev) => prev.filter((script) => script.id !== scriptId));
      setSelectedScripts((prev) => prev.filter((s) => s.id !== scriptId));
      toast({
        type: "success",
        description: "Script deleted successfully.",
      });
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to delete script.",
      });
    }
  };

  const handleEditScript = (script: any) => {
    setEditingScript({ id: script.id, content: script.generatedScript });
  };

  const handleSaveEdit = async () => {
    if (!editingScript) return;
    try {
      const response = await fetch(`/kanban/api/content/${editingScript.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedScript: editingScript.content }),
      });
      if (!response.ok) throw new Error("Failed to update script");
      setScripts((prev) =>
        prev.map((script) =>
          script.id === editingScript.id
            ? { ...script, generatedScript: editingScript.content }
            : script
        )
      );
      setEditingScript(null);
      toast({
        type: "success",
        description: "Script updated successfully.",
      });
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to update script.",
      });
    }
  };

  const moveTaskToStage = async (taskId: string, direction: "next" | "previous") => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      let newStage: ColumnId | null = null;
      if (direction === "next") {
        if (task.columnId === "voice_over") {
          newStage = "creation";
        } else if (task.columnId === "creation") {
          newStage = "done";
        }
      } else if (direction === "previous") {
        if (task.columnId === "done") {
          newStage = "creation";
        } else if (task.columnId === "creation") {
          newStage = "voice_over";
        }
      }

      if (!newStage) return;

      const response = await fetch(`/kanban/api/content/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!response.ok) throw new Error("Failed to update stage");

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, columnId: newStage } : t
        )
      );
      toast({
        type: "success",
        description: `Task moved to ${newStage}.`,
      });
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to move task.",
      });
    }
  };

  const goToPreviousWeek = () => {
    setSelectedWeek({
      from: subDays(selectedWeek.from, 7),
      to: subDays(selectedWeek.to, 7),
    });
  };

  const goToNextWeek = () => {
    setSelectedWeek({
      from: addDays(selectedWeek.from, 7),
      to: addDays(selectedWeek.to, 7),
    });
  };

  return (
    <div className="p-4">
      <div
        className={cn(
          "flex flex-col md:flex-row gap-4",
          "items-center justify-between",
          "max-w-[1080px] mx-auto",
          "pb-4"
        )}
      >
        <div className="w-full md:w-auto px-2">
          <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
            Add Script
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={goToPreviousWeek} variant="outline" size={"icon"}>
            <ChevronLeft />
          </Button>
          <WeekPicker
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            className="flex-1"
          />
          <Button onClick={goToNextWeek} variant="outline" size={"icon"}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <BoardContainer>
        {isMobile ? (
          <BoardColumn
            key="all-tasks"
            column={{ id: "all-tasks", title: "All Tasks" }}
            tasks={[...tasks].sort((a, b) => {
              const order = ['voice_over', 'creation', 'done'];
              return order.indexOf(a.columnId) - order.indexOf(b.columnId);
            })}
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
                    <TableHead className="w-[20px]">Order</TableHead>
                    <TableHead className="w-[80px]">Select</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Mood</TableHead>
                    <TableHead>Script Preview</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scripts.map((script) => {
                    const selection = selectedScripts.find((s) => s.id === script.id);
                    return (
                      <TableRow key={script.id}>
                        <TableCell>
                          {selection ? selection.order : ""}
                        </TableCell>
                        <TableCell>
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
                    );
                  })}
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
                  disabled={page * parPage >= totalScripts}
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

/*
|--------------------------------------------------------------------------
| Board Column
|--------------------------------------------------------------------------
*/
function BoardColumn({ column, tasks, moveTaskToStage }: {
  column: { id: string, title: string },
  tasks: Task[],
  moveTaskToStage?: (taskId: string, direction: 'next' | 'previous') => void,
}) {
  return (
    <Card className="h-[500px] max-h-[500px] max-w-[350px] min-w-[300px] bg-primary-foreground flex flex-col shrink-0 snap-center">
      <CardHeader className="p-4 font-semibold border-b-2 text-left flex flex-row items-center">
        <span className={column.id !== 'all-tasks' ? 'flex-1' : 'flex-1 text-center'}>
          {column.title}
        </span>
      </CardHeader>
      <ScrollArea>
        <CardContent className="flex grow flex-col gap-2 p-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              moveTaskToStage={moveTaskToStage}
            />
          ))}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

function BoardContainer({ children }: { children: React.ReactNode }) {
  return (
    <ScrollArea className="md:px-0 flex lg:justify-center pb-4 snap-x snap-mandatory max-w-screen-sm md:max-w-max">
      <div className="flex gap-4 items-center flex-row justify-center max-w-screen-sm md:max-w-max">
        {children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}