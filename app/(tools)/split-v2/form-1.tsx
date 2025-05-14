// app/form-1.tsx
'use client';
import React from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { debounce } from 'lodash';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useScriptGenerator } from './script-generator-context';

interface FormData {
  userPrompt: string;
}

export const Form1 = () => {
  const maxCharacter = 500;
  const { userPrompt, setUserPrompt, generateSubPillars, isLoadingSubPillars } = useScriptGenerator();
  const form = useForm<FormData>({
    defaultValues: {
      userPrompt,
    },
    resolver: async (data) => {
      const errors: Partial<Record<keyof FormData, { message: string }>> = {};
      if (!data.userPrompt.trim()) {
        errors.userPrompt = { message: 'User prompt is required' };
      }
      return {
        values: data,
        errors,
      };
    },
  });

  const saveUserPromptToLocalStorage = debounce((prompt: string) => {
    if (prompt.trim() && prompt.length <= maxCharacter) {
      localStorage.setItem('userPrompt', prompt);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
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
                  onChange={(e) => handleUserPromptChange(e.target.value)}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4">
          <div>
            <p className={cn('text-xs mt-1 text-right', getCharCountColor(userPrompt.length))}>
              {userPrompt.length}/{maxCharacter}
            </p>
            <FormMessage />
          </div>
          <Button type="submit" disabled={isLoadingSubPillars}>
            {isLoadingSubPillars ? 'Generating...' : 'Generate Sub-Pillars'}
          </Button>
        </div>
      </form>
    </Form>
  );
};