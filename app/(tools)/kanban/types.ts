
export interface Column {
  id: any;
  title: string;
}

export const defaultCols = [
  { id: "voice_over", title: "Voice Over" },
  { id: "creation", title: "Creation" },
  { id: "done", title: "Done" },
] satisfies Column[];

export type ColumnId = (typeof defaultCols)[number]["id"];

export interface Task {
  id: string;
  title?: string;
  userPrompt?: string;
  columnId: ColumnId;
  generatedScript: string;
  scheduledDate?: string;
  deadline?: string;
}

export interface TaskCardProps {
  task: Task;
  moveTaskToStage?: (taskId: string, direction: 'next' | 'previous') => void;
  refreshTasks?: () => void; // New callback to refresh tasks
}
