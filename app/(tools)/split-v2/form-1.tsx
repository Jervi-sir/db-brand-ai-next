'use client';
import React, { useState, useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { debounce } from 'lodash';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { useScriptGenerator } from './script-generator-context';
import { PromptHistoryDialog } from './prompt-history-dialog';

interface FormData {
  userPrompt: string;
}

export const Form1 = () => {
  const maxCharacter = 500;
  const { userPrompt, setUserPrompt, generateSubPillars, isLoadingSubPillars } = useScriptGenerator();
  const [historyOpen, setHistoryOpen] = useState(false);
  const form = useForm<FormData>({
    defaultValues: { userPrompt },
    resolver: async (data) => {
      const errors: Partial<Record<keyof FormData, { message: string }>> = {};
      if (!data.userPrompt.trim()) {
        errors.userPrompt = { message: 'Prompt is required' };
      }
      return { values: data, errors };
    },
  });

  // Load saved prompt from localStorage on mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem('userPrompt');
    if (savedPrompt && !userPrompt) {
      setUserPrompt(savedPrompt);
      form.setValue('userPrompt', savedPrompt);
    }
  }, [form, setUserPrompt]);

  // Update form value when userPrompt changes (e.g., from history selection)
  useEffect(() => {
    form.setValue('userPrompt', userPrompt);
  }, [userPrompt, form]);

  const saveUserPromptToLocalStorage = debounce((prompt: string) => {
    if (prompt.trim() && prompt.length <= maxCharacter) {
      localStorage.setItem('userPrompt', prompt);
    } else if (!prompt.trim()) {
      localStorage.removeItem('userPrompt'); // Clear if empty
    }
  }, 1000);

  const handleUserPromptChange = (value: string) => {
    form.setValue('userPrompt', value);
    setUserPrompt(value);
    saveUserPromptToLocalStorage(value);
  };

  const getCharCountColor = (length: number) => {
    const percentage = (length / maxCharacter) * 100;
    if (percentage <= 70) return 'text-green-500';
    if (percentage <= 90) return 'text-yellow-500';
    return 'text-red-500';
  };

  const onSubmit = async () => {
    await generateSubPillars();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="userPrompt"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Your Prompt</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryOpen(true)}
                >
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Specify: Niche (e.g., cooking), short intro (e.g., I'm an Algerian chef), product/service (e.g., recipe book), target audience, best-performing content (optional)"
                  className="resize-vertical"
                  maxLength={maxCharacter}
                  {...field}
                  onChange={(e) => handleUserPromptChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4">
          <div>
            <p className={cn('text-xs mt-1 text-right', getCharCountColor(userPrompt.length))}>
              {userPrompt.length}/{maxCharacter}
            </p>
          </div>
          <Button type="submit" disabled={isLoadingSubPillars}>
            {isLoadingSubPillars ? 'Generating...' : 'Generate Sub-Pillars'}
          </Button>
        </div>
      </form>
      <PromptHistoryDialog open={historyOpen} setOpen={setHistoryOpen} />
    </Form>
  );
};