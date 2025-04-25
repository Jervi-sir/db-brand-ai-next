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
import { MinimalTiptapEditor } from '../components/minimal-tiptap';
import { toast } from '@/components/toast';

export default function Page() {
  // Form setup with react-hook-form
  const form = useForm({
    defaultValues: {
      title: '',
      userPrompt: '',
      mood: '',
    },
  });

  // State for scripts, validation status, and token usage
  const [scripts, setScripts] = useState([]);
  const [validated, setValidated] = useState([]); // New state to track validation
  const [usage, setUsage] = useState({ promptTokens: '', completionTokens: '', totalTokens: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    setScripts([]);
    setValidated([]); // Reset validation state
    setUsage({ promptTokens: '', completionTokens: '', totalTokens: '' });

    try {
      const response = await fetch('/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scripts');
      }

      const { scripts, usage } = await response.json();
      setScripts(scripts.map((script: any) => DOMPurify.sanitize(script)));
      setValidated(new Array(scripts.length).fill(false)); // Initialize validation state
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async (script: any, index: number) => {
    try {
      const response = await fetch('/api/content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.getValues('title'),
          userPrompt: form.getValues('userPrompt'),
          mood: form.getValues('mood'),
          generatedScript: script,
          stage: 'script', // Default stage for new content
          scheduledDate: new Date().toISOString(), // Default to current date
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 7 days from now
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save script');
      }

      toast({ type: 'success', description: 'Script Validated!' });
      setValidated((prev) => {
        const newValidated = [...prev];
        newValidated[index] = true; // Mark script as validated
        return newValidated;
      });
    } catch (error) {
      toast({ type: 'error', description: 'Failed to validate script!' });
    }
  };

  const handleDelete = (index: number) => {
    setScripts((prev) => prev.filter((_, i) => i !== index));
    setValidated((prev) => prev.filter((_, i) => i !== index)); // Update validation state
  };

  return (
    <div className={cn('container mx-auto p-4')}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Form (Left Side) */}
        <div className="flex-1 w-full md:w-1/3 md:pr-4 border-r-zinc-800 md:border-r-[1px]">
          <h2 className="text-2xl font-bold mb-4">Script Generator</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Adventure Story" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* User Prompt */}
              <FormField
                control={form.control}
                name="userPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Prompt</FormLabel>
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
                        <SelectItem value="blue">Happy</SelectItem>
                        <SelectItem value="gray">Serious</SelectItem>
                        <SelectItem value="yellow">Funny</SelectItem>
                        <SelectItem value="red">Dramatic</SelectItem>
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
              <p className="text-gray-500 dark:text-gray-400">Generating scripts...</p>
            ) : scripts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No scripts generated yet. Fill out the form and click "Generate Scripts".
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
                        prev.map((s: any, i: any) => (i === index ? value : s))
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
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleValidate(script, index)}
                      disabled={validated[index]} // Disable if validated
                    >
                      {validated[index] ? 'Validated' : 'Validate'} {/* Change text based on state */}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(index)}
                    >
                      Delete
                    </Button>
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