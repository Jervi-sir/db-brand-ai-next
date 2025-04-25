// File: board-column.tsx
'use client';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Task, TaskCard } from './task-card';

export interface Column {
  id: string;
  title: string;
}

interface BoardColumnProps {
  column: Column;
  tasks: Task[];
  moveTaskToStage?: (taskId: string, direction: 'next' | 'previous') => void;
}

export function BoardColumn({ column, tasks, moveTaskToStage }: BoardColumnProps) {
  return (
    <Card className="h-[500px] max-h-[500px] w-[350px] max-w-full bg-primary-foreground flex flex-col flex-shrink-0 snap-center">
      <CardHeader className="p-4 font-semibold border-b-2 text-left flex flex-row items-center">
        <span className={column.id !== 'all-tasks' ? 'flex-1' : 'flex-1 text-center'}>
          {column.title}
        </span>
      </CardHeader>
      <ScrollArea>
        <CardContent className="flex flex-grow flex-col gap-2 p-2">
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

export function BoardContainer({ children }: { children: React.ReactNode }) {
  return (
    <ScrollArea className="px-2 md:px-0 flex lg:justify-center pb-4 snap-x snap-mandatory">
      <div className="flex gap-4 items-center flex-row justify-center">
        {children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}