// components/PromptHistoryTable.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy, EyeIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { JsonView, darkStyles, allExpanded } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

interface PromptHistory {
  id: string;
  modelId: string;
  prompt: string;
  createdAt: string;
  userEmail?: string;
}

interface AIModel {
  name: string;
  displayName?: string;
  inputPrice?: string;
  outputPrice?: string;
  endpoint?: string;
  apiKey?: string;
  capability?: string;
  provider: string;
  type?: string;
  isActive: boolean;
  maxTokens?: number;
  temperature?: number;
  customPrompts?: string;
  cachedInputPrice?: string;
}

interface HistoryEntry {
  promptHistory: PromptHistory;
  aiModel: AIModel | null;
}

interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  prev_page_url: string | null;
  next_page_url: string | null;
}

export const PromptHistoryTable = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/prompt-history?page=${page}&per_page=10`);
      const data = await response.json();
      setHistory(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching prompt history:', error);
      toast('Error fetching prompt history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast('Copied to Clipboard');
  };

  const renderPrompt = (prompt: string) => {
    try {
      const parsed = JSON.parse(prompt);
      return (
        <JsonView
          data={parsed}
          shouldExpandNode={allExpanded}
          style={darkStyles}
          clickToExpandNode={true}
        />
      );
    } catch {
      return <div className="whitespace-pre-wrap break-words text-sm">{prompt}</div>;
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prompt</TableHead>
            <TableHead>Model Name</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Input Price</TableHead>
            <TableHead>Output Price</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>User ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : history.length > 0 ? (
            history.map((item) => (
              <TableRow key={item.promptHistory.id}>
                <TableCell className="max-w-[140px] truncate">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => setSelectedPrompt(item.promptHistory.prompt)}
                  >
                    <EyeIcon />
                  </Button>
                </TableCell>
                <TableCell className="max-w-[120px] truncate">
                  {item.aiModel?.name || 'N/A'}
                </TableCell>
                <TableCell className="max-w-[120px] truncate">
                  {item.aiModel?.displayName || 'N/A'}
                </TableCell>
                <TableCell>
                  {item.aiModel?.inputPrice ? `$${item.aiModel.inputPrice}` : 'N/A'}
                </TableCell>
                <TableCell>
                  {item.aiModel?.outputPrice ? `$${item.aiModel.outputPrice}` : 'N/A'}
                </TableCell>
                <TableCell>{new Date(item.promptHistory.createdAt).toLocaleString()}</TableCell>
                <TableCell className="max-w-[120px] truncate">
                  {item.promptHistory.userEmail || 'N/A'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No prompt history available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between p-4">
          <div>
            Showing {pagination.per_page * (pagination.current_page - 1) + 1} to{' '}
            {Math.min(pagination.per_page * pagination.current_page, pagination.total)} of{' '}
            {pagination.total} entries
          </div>
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => fetchHistory(pagination.current_page - 1)}
              disabled={!pagination.prev_page_url}
              variant="outline"
            >
              Previous
            </Button>
            <span>
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <Button
              onClick={() => fetchHistory(pagination.current_page + 1)}
              disabled={!pagination.next_page_url}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedPrompt} onOpenChange={() => setSelectedPrompt(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Prompt Content</DialogTitle>
            <DialogDescription>View the prompt content below.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {selectedPrompt && renderPrompt(selectedPrompt)}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => selectedPrompt && handleCopy(selectedPrompt)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button onClick={() => setSelectedPrompt(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};