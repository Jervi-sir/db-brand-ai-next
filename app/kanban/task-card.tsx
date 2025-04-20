import type { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cva } from "class-variance-authority";
import { GripVertical } from "lucide-react";
import { ColumnId } from "./kanban-board";
import { Badge } from "@/components/ui/badge";

export interface Task {
  id: UniqueIdentifier;
  columnId: ColumnId;
  content: string;
}

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
  moveTaskToNextColumn?: (taskId: UniqueIdentifier) => void;
}

export type TaskType = "Task";

export interface TaskDragData {
  type: TaskType;
  task: Task;
}

export function TaskCard({ task, isOverlay, moveTaskToNextColumn }: TaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    } satisfies TaskDragData,
    attributes: {
      roleDescription: "Task",
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva("", {
    variants: {
      dragging: {
        over: "ring-2 opacity-30",
        overlay: "ring-2 ring-primary",
      },
    },
  });

  // Determine badge text and variant based on columnId
  const getBadgeProps = () => {
    switch (task.columnId) {
      case "todo":
        return { text: "Todo", variant: "default" as const };
      case "in-progress":
        return { text: "In Progress", variant: "secondary" as const };
      case "done":
        return { text: "Done", variant: "destructive" as const };
      default:
        return { text: task.columnId, variant: "outline" as const };
    }
  };

  const badgeProps = getBadgeProps();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <CardHeader className="px-3 py-3 flex flex-row border-b-2 border-secondary relative items-center">
        <Button
          variant={"ghost"}
          {...attributes}
          {...listeners}
          className="p-1 text-secondary-foreground/50 -ml-2 h-auto cursor-grab"
          aria-label="Move task"
        >
          <GripVertical />
        </Button>
        <Badge variant={badgeProps.variant} className="ml-auto font-semibold">
          {badgeProps.text}
        </Badge>
      </CardHeader>
      <CardContent className="px-3 pt-3 pb-6 text-left whitespace-pre-wrap flex flex-col gap-2">
        <div>{task.content}</div>
        {moveTaskToNextColumn && task.columnId !== "done" && (
          <Button
            onClick={() => moveTaskToNextColumn(task.id)}
            size="sm"
            className="self-end"
          >
            Move to {task.columnId === "todo" ? "In Progress" : "Done"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}