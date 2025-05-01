'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DOMPurify from 'dompurify';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { MinimalTiptapEditor } from '../components/minimal-tiptap';
import { toast } from '@/components/toast';
import { debounce } from 'lodash';

// TypeScript interfaces
interface FormData {
  userPrompt: string;
  content_idea: string;
  hook_type: string;
}

interface Script {
  subtitle: string;
  content: string; // Combined script text with all hooks
}

interface GenerateScriptsResponse {
  title: string;
  scripts: Script[];
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const maxCharacter = 500;

export default function Page() {
  // Form setup with react-hook-form
  const form = useForm<FormData>({
    defaultValues: {
      userPrompt: '',
      content_idea: '',
      hook_type: '',
    },
    resolver: async (data) => {
      const errors: Partial<Record<keyof FormData, { message: string }>> = {};
      if (!data.userPrompt.trim()) {
        errors.userPrompt = { message: 'User prompt is required' };
      }
      if (data.userPrompt.length > maxCharacter) {
        errors.userPrompt = { message: 'User prompt must not exceed ' + maxCharacter + ' characters' };
      }
      if (!data.content_idea) {
        errors.content_idea = { message: 'Content idea is required' };
      }
      if (!data.hook_type) {
        errors.hook_type = { message: 'Hook type is required' };
      }
      return {
        values: data,
        errors,
      };
    },
  });

  // State for scripts, title, validation status, and token usage
  const [scripts, setScripts] = useState<Script[]>([]);
  const [scriptTitle, setScriptTitle] = useState<string>('');
  const [validated, setValidated] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<GenerateScriptsResponse['tokenUsage'] | null>(null);

  // Load userPrompt from localStorage on mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem('userPrompt');
    if (savedPrompt && savedPrompt.length <= maxCharacter) {
      form.setValue('userPrompt', savedPrompt);
    }
  }, [form]);

  // Debounced function to save userPrompt to localStorage
  const savePromptToLocalStorage = debounce((prompt: string) => {
    if (prompt.trim() && prompt.length <= maxCharacter) {
      localStorage.setItem('userPrompt', prompt);
    }
  }, 500);

  // Handle userPrompt changes
  const handlePromptChange = (value: string) => {
    form.setValue('userPrompt', value);
    savePromptToLocalStorage(value);
  };

  // Get color for character count based on percentage
  const getCharCountColor = (length: number) => {
    const percentage = (length / maxCharacter) * 100;
    if (percentage <= 70) return 'text-green-500'; // 0–210 characters
    if (percentage <= 90) return 'text-yellow-500'; // 211–270 characters
    return 'text-red-500'; // 271–maxCharacter characters
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setScripts([]);
    setValidated([]);
    setScriptTitle('');
    setTokenUsage(null);

    // Save userPrompt to localStorage on submit
    savePromptToLocalStorage(data.userPrompt);

    try {
      const response = await fetch('/split/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scripts');
      }

      const { title, scripts, tokenUsage }: GenerateScriptsResponse = await response.json();
      setScriptTitle(title);
      setScripts(
        scripts.map((script) => ({
          ...script,
          content: DOMPurify.sanitize(script.content),
        }))
      );
      setValidated(new Array(3).fill(false));
      setTokenUsage(tokenUsage);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async (scriptIndex: number) => {
    try {
      const response = await fetch('/split/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scriptTitle,
          userPrompt: form.getValues('userPrompt'),
          mood: form.getValues('hook_type'), // Map hook_type to mood
          generatedScript: scripts[scriptIndex].content, // Save full script
          stage: 'script',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save script');
      }

      toast({ type: 'success', description: 'Script Validated!' });
      setValidated((prev) => {
        const newValidated = [...prev];
        newValidated[scriptIndex] = true;
        return newValidated;
      });
    } catch (error) {
      toast({ type: 'error', description: 'Failed to validate script!' });
    }
  };

  const handleDelete = (scriptIndex: number) => {
    setScripts((prev) => prev.filter((_, i) => i !== scriptIndex));
    setValidated((prev) => prev.filter((_, i) => i !== scriptIndex));
  };

  return (
    <div className={cn('container mx-auto p-4')}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Form (Left Side) */}
        <div className="flex-1 w-full md:w-1/3 md:pr-4 border-r-zinc-800 md:border-r">
          <h2 className="text-2xl font-bold mb-4">Script Generator</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* User Prompt */}
              <FormField
                control={form.control}
                name="userPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Include: Niche (e.g., cooking), Short intro (e.g., I'm ..., an Algerian chef), Product/Service (e.g., recipe book), Target audience, Best-performing content (optional, e.g., couscous video got 100K views)"
                        className="resize-vertical"
                        maxLength={maxCharacter}
                        {...field}
                        onChange={(e) => handlePromptChange(e.target.value)}
                      />
                    </FormControl>
                    <p
                      className={cn(
                        'text-xs mt-1 text-right',
                        getCharCountColor(field.value.length)
                      )}
                    >
                      {field.value.length}/{ maxCharacter }
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content Idea */}
              <FormField
                control={form.control}
                name="content_idea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Idea</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Content Idea" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          { id: '1', name: 'Day in my life – personal branding' },
                          { id: '2', name: 'Educational with entertainment – deliver value in an engaging way' },
                          { id: '3', name: 'Challenge – high stakes, tension not resolved until the payoff' },
                          { id: '4', name: 'Stranger-generated content – ask people questions' },
                          { id: '5', name: 'Audience-generated content – use follower input' },
                          { id: '6', name: 'Skits – relatable humor or drama' },
                          { id: '7', name: 'Skills – show off something you\'re good at' },
                        ].map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hook Type */}
              <FormField
                control={form.control}
                name="hook_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hook Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Hook Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          { id: '1', name: 'Fix a problem' },
                          { id: '2', name: 'Quick Wins' },
                          { id: '3', name: 'Reactions & Reviews' },
                          { id: '4', name: 'Personal Advice' },
                          { id: '5', name: 'Step-by-Step Guides' },
                          { id: '6', name: 'Curiosity & Surprises' },
                          { id: '7', name: 'Direct targeting' },
                        ].map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate Scripts'}
              </Button>
            </form>
          </Form>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          <div className="mt-6 p-4 border rounded-xl dark:border-zinc-700">
            <h3 className="text-xl font-semibold mb-2">Token Usage</h3>
            {tokenUsage ? (
              <ul className="pl-2 space-y-1">
                <li>Prompt Tokens: {tokenUsage.prompt_tokens}</li>
                <li>Completion Tokens: {tokenUsage.completion_tokens}</li>
                <li>Total Tokens: {tokenUsage.total_tokens}</li>
              </ul>
            ) : (
              <p className="text-gray-500">No usage data available.</p>
            )}
          </div>
        </div>

        {/* Scripts (Right Side) */}
        <div className="flex-2 w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">Generated Scripts</h2>
          {/* {scriptTitle && (
            <h3 className="text-xl font-semibold mb-2">Main Title: <br /> {scriptTitle}</h3>
          )} */}
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400">Generating scripts...</p>
            ) : scripts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No scripts generated yet. Fill out the form and click &quot;Generate Scripts&quot;.
              </p>
            ) : (
              scripts.map((script, scriptIndex) => (
                <div key={scriptIndex} className="border rounded-xl p-4 dark:border-zinc-800">
                  <h3 className="text-xl font-semibold mb-2">{script.subtitle}</h3>
                  <MinimalTiptapEditor
                    value={script.content}
                    onChange={(value) =>
                      setScripts((prev) => {
                        const newScripts: any = [...prev];
                        newScripts[scriptIndex].content = value;
                        return newScripts;
                      })
                    }
                    throttleDelay={2000}
                    className={cn('h-full min-h-[150px] w-full rounded-xl border-0')}
                    editorContentClassName="overflow-auto h-full"
                    output="html"
                    placeholder={`Script ${scriptIndex + 1}...`}
                    editable={true}
                    editorClassName="focus:outline-none px-5 py-4 h-full"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleValidate(scriptIndex)}
                      disabled={validated[scriptIndex]}
                    >
                      {validated[scriptIndex] ? 'Validated' : 'Validate'}
                    </Button>
                    {!validated[scriptIndex] && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(scriptIndex)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}