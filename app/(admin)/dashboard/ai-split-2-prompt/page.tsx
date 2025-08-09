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
import { Copy, EyeIcon, CheckCircle } from 'lucide-react';
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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PromptHistory {
  id: string;
  modelId: string | null;
  modelCodeName: string | null;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
  isCurrent: boolean;
}

interface ModelOption {
  name: string;
  inputPrice: number;
  outputPrice: number;
  cachedInputPrice: number;
}

interface HistoryEntry {
  promptHistory: PromptHistory;
}

interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  prev_page_url: string | null;
  next_page_url: string | null;
}

const modelOptions: ModelOption[] = [
  { name: "gpt-4.1-nano-2025-04-14", inputPrice: 0.10, outputPrice: 0.40, cachedInputPrice: 0.00 },
  { name: "gpt-4.1-mini-2025-04-14", inputPrice: 0.40, outputPrice: 1.60, cachedInputPrice: 0.00 },
  { name: "gpt-4.1-2025-04-14", inputPrice: 2.00, outputPrice: 8.00, cachedInputPrice: 0.00 },
  { name: "gpt-4o-2024-11-20", inputPrice: 2.50, outputPrice: 10.00, cachedInputPrice: 0.00 },
  { name: "gpt-4o-mini-2024-07-18", inputPrice: 0.15, outputPrice: 0.60, cachedInputPrice: 0.00 },
  { name: "gpt-5-2025-08-07", inputPrice: 1.25, outputPrice: 10, cachedInputPrice: 0.125 },
  { name: "gpt-5-chat-latest", inputPrice: 1.25, outputPrice: 10, cachedInputPrice: 0.125 },
  { name: "gpt-5-mini-2025-08-07", inputPrice: 0.25, outputPrice: 2.00, cachedInputPrice: 0.025 },
  { name: "gpt-5-nano-2025-08-07", inputPrice: 0.05, outputPrice: 0.4, cachedInputPrice: 0.005 },
];

export default function SplitPromptHistoryPage() {
  const [currentPrompt, setCurrentPrompt] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [promptText, setPromptText] = useState<string>('');
  const [promptModelName, setPromptModelName] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

  // Fetch prompt history and current prompt
  const fetchHistory = async (page: number = 1, modelName: string = 'all') => {
    setIsLoading(true);
    try {
      const url = `/api/split-prompt-history?page=${page}&per_page=10${modelName !== 'all' ? `&modelCodeName=${modelName}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setCurrentPrompt(data.current);
      setHistory(data.history);
      setPagination(data.pagination);
      setPromptText(data.current?.promptHistory.prompt || '');
      setPromptModelName(data.current?.promptHistory.modelCodeName || '');
    } catch (error) {
      console.error('Error fetching split prompt history:', error);
      toast('Error fetching prompt history');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle saving new prompt
  const handleSavePrompt = async () => {
    if (!promptText || !promptModelName) {
      toast('Please provide a prompt and select a model');
      return;
    }
    try {
      const response = await fetch('/api/split-prompt-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          modelCodeName: promptModelName,
          userEmail: 'user@example.com',
        }),
      });
      if (!response.ok) throw new Error('Failed to save prompt');
      toast('Prompt saved successfully');
      fetchHistory(1, selectedModel);
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast('Error saving prompt');
    }
  };

  // Handle updating current prompt
  const handleUpdatePrompt = async () => {
    if (!promptText || !promptModelName) {
      toast('Please provide a prompt and select a model');
      return;
    }
    try {
      const response = await fetch('/api/split-prompt-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          modelCodeName: promptModelName,
          userEmail: 'user@example.com',
        }),
      });
      if (!response.ok) throw new Error('Failed to save updated prompt');
      toast('Prompt updated successfully');
      setIsEditMode(false);
      setEditingPromptId(null);
      fetchHistory(1, selectedModel);
    } catch (error) {
      console.error('Error saving updated prompt:', error);
      toast('Error saving updated prompt');
    }
  };

  const handleSetCurrent = async (promptId: string) => {
    try {
      const response = await fetch('/api/split-prompt-history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: promptId,
          isCurrent: true,
        }),
      });
      if (!response.ok) throw new Error('Failed to set prompt as current');
      toast('Prompt set as current successfully');
      setIsEditMode(false);
      setEditingPromptId(null);
      fetchHistory(1, selectedModel);
    } catch (error) {
      console.error('Error setting prompt as current:', error);
      toast('Error setting prompt as current');
    }
  };

  // Handle copy to clipboard
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast('Copied to Clipboard');
  };

  // Render prompt as JSON or text
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

  // Fetch data on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <header className="flex w-full h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center w-full gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h4>Split Prompt History</h4>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-4">
        {/* Current Prompt Form */}
        <div className="mb-6 border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">{isEditMode ? 'Edit Current Prompt' : 'Current Prompt'}</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="model">Model</Label>
              <Select value={promptModelName} onValueChange={setPromptModelName} disabled={!isEditMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {modelOptions.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="min-h-[200px]"
                placeholder="Enter your prompt here"
                disabled={!isEditMode}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={isEditMode ? handleUpdatePrompt : handleSavePrompt}
                disabled={!isEditMode}
              >
                Save as New Prompt
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCopy(promptText)}
                disabled={!promptText}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              {isEditMode ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false);
                    setPromptText(currentPrompt?.promptHistory.prompt || '');
                    setPromptModelName(currentPrompt?.promptHistory.modelCodeName || '');
                  }}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  onClick={() => setIsEditMode(true)}
                  disabled={!currentPrompt}
                >
                  Enable Edit Mode
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* History Table */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Prompt History</h3>
          <div className="mb-4">
            <Label htmlFor="modelFilter">Filter by Model</Label>
            <Select
              value={selectedModel}
              onValueChange={(value) => {
                setSelectedModel(value);
                fetchHistory(1, value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All models" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Models</SelectItem>
                  {modelOptions.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prompt</TableHead>
                <TableHead>Model Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
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
                      {item.promptHistory.isCurrent ? (
                        <Button
                          size="icon"
                          variant="outline"
                          className="ml-2"
                          disabled
                          title="This is the current prompt"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="outline"
                          className="ml-2"
                          onClick={() => handleSetCurrent(item.promptHistory.id)}
                          title="Set as current prompt"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {item.promptHistory.modelCodeName || 'N/A'}
                    </TableCell>
                    <TableCell>{new Date(item.promptHistory.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(item.promptHistory.updatedAt).toLocaleString()}</TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {item.promptHistory.userEmail || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
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
                  onClick={() => fetchHistory(pagination.current_page - 1, selectedModel)}
                  disabled={!pagination.prev_page_url}
                  variant="outline"
                >
                  Previous
                </Button>
                <span>
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <Button
                  onClick={() => fetchHistory(pagination.current_page + 1, selectedModel)}
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
      </div>
    </div>
  );
}