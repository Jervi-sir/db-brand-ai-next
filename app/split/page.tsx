// src/app/page.jsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { MinimalTiptapEditor } from './minimal-tiptap';
import { Moon, Sun } from 'lucide-react';

export default function Page() {
  // Form setup with react-hook-form
  const form = useForm({
    defaultValues: {
      topic: '',
      description: '',
      mood: '',
    },
  });

  // State for scripts and token usage
  const [scripts, setScripts] = useState([]);
  const [usage, setUsage] = useState({ promptTokens: '', completionTokens: '', totalTokens: '' }); // Initialize as null
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    setScripts([]);
    setUsage({ promptTokens: '', completionTokens: '', totalTokens: '' }); // Clear previous usage

    try {
      const response = await fetch('/split/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scripts');
      }

      const { scripts, usage } = await response.json();
      setScripts(scripts.map((script: any) => DOMPurify.sanitize(script)));
      setUsage(usage); // Set usage data
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('container mx-auto p-4')}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Form (Left Side) */}
        <div className="flex-1 w-full md:w-1/3 md:pr-4 border-r-zinc-800 md:border-r-[1px]">
          <h2 className="text-2xl font-bold mb-4">Script Generator</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Topic */}
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Adventure Story" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the script context..."
                        className="resize-vertical"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Mood */}
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mood</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mood" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Happy">Happy</SelectItem>
                        <SelectItem value="Serious">Serious</SelectItem>
                        <SelectItem value="Funny">Funny</SelectItem>
                        <SelectItem value="Dramatic">Dramatic</SelectItem>
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
            {usage ? (
              <ul className="pl-2 space-y-1">
                <li>Prompt Tokens: {usage.promptTokens}</li>
                <li>Completion Tokens: {usage.completionTokens}</li>
                <li>Total Tokens: {usage.totalTokens}</li>
              </ul>
            ) : (
              <p className="text-gray-500">No usage data available.</p>
            )}
          </div>
        </div>

        {/* Editors (Right Side) */}
        <div className="flex-2 w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">Generated Scripts</h2>
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400">
                Generating scripts...
              </p>
            ) : scripts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No scripts generated yet. Fill out the form and click &quot;Generate Scripts&quot;.
              </p>
            ) : (
              scripts.map((script, index) => (
                <div
                  key={index}
                  className="border rounded-xl p-2 dark:border-zinc-800"
                >
                  <MinimalTiptapEditor
                    value={script}
                    onChange={(value) =>
                      setScripts((prev: any) =>
                        prev.map((s: any, i: number) => (i === index ? value : s))
                      )
                    }
                    throttleDelay={2000}
                    className={cn('h-full min-h-[150px] w-full rounded-xl border-0')}
                    editorContentClassName="overflow-auto h-full"
                    output="html"
                    placeholder={`Script ${index + 1}...`}
                    editable={true}
                    editorClassName="focus:outline-none px-5 py-4 h-full"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}