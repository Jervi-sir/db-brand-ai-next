// app/(tools)/split-v2/context/ScriptGeneratorContext.tsx
'use client';
import { toast } from '@/components/toast';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface PromptHistoryEntry {
  id: string;
  prompt: string;
  clientPersona: string;
  contentPillar: string;
  subPillars: { value: string; label: string }[];
  chosenSubPillars: string[];
  hookType: string[];
  scripts: { subtitle: string; content: string; isValidated?: boolean }[];
  timestamp: string;
  isDeleted: boolean;
}

interface ScriptGeneratorContextType {
  userPrompt: string;
  setUserPrompt: (prompt: string) => void;
  contentPillar: string;
  setContentPillar: (pillar: string) => void;
  clientPersona: string;
  setClientPersona: (persona: string) => void;
  subPillars: { value: string; label: string }[];
  setSubPillars: (subPillars: { value: string; label: string }[]) => void;
  selectedSubPillars: string[];
  setSelectedSubPillars: (subPillars: string[]) => void;
  hookType: string[];
  setHookType: (hookType: string[]) => void;
  scripts: { subtitle: string; content: string; isValidated?: boolean }[];
  setScripts: (scripts: { subtitle: string; content: string; isValidated?: boolean }[]) => void;
  isLoadingSubPillars: boolean;
  isLoadingScripts: boolean;
  validated: boolean[];
  setValidated: (validated: boolean[]) => void;
  generateSubPillars: (isAutomatic: boolean) => Promise<void>;
  generateScripts: () => Promise<void>;
  validateScript: (scriptIndex: number, historyId: string) => Promise<void>;
  handleDelete: (scriptIndex: number) => void;
  promptHistory: PromptHistoryEntry[];
  selectPrompt: (entry: PromptHistoryEntry) => void;
  deletePrompt: (id: string) => void;
  loadPromptHistory: () => Promise<void>;
  historyId: string;
  setHistoryId: (id: string) => void;
  mode: 'automatic' | 'custom';
  setMode: (mode: 'automatic' | 'custom') => void;
}

const ScriptGeneratorContext = createContext<ScriptGeneratorContextType | undefined>(undefined);

export const ScriptGeneratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [contentPillar, setContentPillar] = useState<string>('');
  const [clientPersona, setClientPersona] = useState<string>('');
  const [subPillars, setSubPillars] = useState<{ value: string; label: string }[]>([]);
  const [selectedSubPillars, setSelectedSubPillars] = useState<string[]>([]);
  const [hookType, setHookType] = useState<string[]>([]);
  const [scripts, setScripts] = useState<{ subtitle: string; content: string; isValidated?: boolean }[]>([]);
  const [isLoadingSubPillars, setIsLoadingSubPillars] = useState<boolean>(false);
  const [isLoadingScripts, setIsLoadingScripts] = useState<boolean>(false);
  const [validated, setValidated] = useState<boolean[]>([]);
  const [promptHistory, setPromptHistory] = useState<PromptHistoryEntry[]>([]);
  const [historyId, setHistoryId] = useState<string>('');
  const [mode, setMode] = useState<'automatic' | 'custom'>('automatic');

  const loadPromptHistory = useCallback(async () => {
    try {
      const response = await fetch('/split-v2/api/prompt-history', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to load prompt history');
      }
      const data = await response.json();
      setPromptHistory(data);
    } catch (error) {
      console.error('Error loading prompt history:', error);
      toast({ type: 'error', description: 'Failed to load prompt history' });
    }
  }, []);

  useEffect(() => {
    loadPromptHistory();
  }, [loadPromptHistory]);

  const deletePrompt = useCallback(
    async (id: string) => {
      try {
        const response = await fetch('/split-v2/api/prompt-history', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!response.ok) {
          throw new Error('Failed to delete prompt');
        }
        await loadPromptHistory();
        toast({ type: 'success', description: 'Prompt deleted from history.' });
      } catch (error) {
        console.error('Error deleting prompt:', error);
        toast({ type: 'error', description: 'Failed to delete prompt' });
      }
    },
    [loadPromptHistory]
  );

  const selectPrompt = useCallback(async (entry: PromptHistoryEntry) => {
    setUserPrompt(entry.prompt);
    setContentPillar(entry.contentPillar);
    setClientPersona(entry.clientPersona);
    setSubPillars(entry.subPillars);
    setMode('custom'); // Set to custom mode when selecting from history
    setValidated(new Array(entry.scripts.length).fill(false));
    setHistoryId(entry.id);
  }, []);

  const generateSubPillars = useCallback(
    async (isAutomatic: boolean) => {
      if (!userPrompt.trim()) {
        toast({ type: 'error', description: 'Prompt is required' });
        return;
      }
      setIsLoadingSubPillars(true);
      try {
        const response = await fetch('/split-v2/api/generate-sub-pillars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userPrompt }),
        });
        if (!response.ok) {
          throw new Error('Failed to generate sub-pillars');
        }
        const data = await response.json();
        setContentPillar(data.contentPillar);
        setClientPersona(data.clientPersona);
        setSubPillars(data.subPillars);
        setSelectedSubPillars([]);

        if (isAutomatic) {
          // For automatic mode, select first 5 sub-pillars and generate scripts
          const selected = data.subPillars.slice(0, 5).map((sp: { value: string }) => sp.value);
          setSelectedSubPillars(selected);
          setHookType([
            'fix-a-problem',
            'quick-wins',
            'reactions-reviews',
            'personal-advice',
            'step-by-step-guides',
            'curiosity-surprises',
            'direct-targeting',
          ]); // Use all hook types
          // Trigger automatic script generation
          await fetch('/split-v2/api/generate-automatic-scripts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userPrompt,
              clientPersona: data.clientPersona,
              contentPillar: data.contentPillar,
              subPillars: data.subPillars,
              chosenSubPillars: selected.map(
                (value: string) => data.subPillars.find((sp: { value: string }) => sp.value === value)?.label || value
              ),
              hookType: [
                'fix-a-problem',
                'quick-wins',
                'reactions-reviews',
                'personal-advice',
                'step-by-step-guides',
                'curiosity-surprises',
                'direct-targeting',
              ],
            }),
          }).then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to generate scripts');
            }
            const scriptData = await response.json();
            setScripts(scriptData.scripts);
            setValidated(new Array(scriptData.scripts.length).fill(false));
            setHistoryId(scriptData.historyId);
            await loadPromptHistory();
            toast({ type: 'success', description: 'Scripts generated successfully' });
          });
        } else {
          if (data.subPillars.length < 25) {
            toast({
              type: 'error',
              description: `Generated ${data.subPillars.length} sub-pillars instead of 25.`,
            });
          } else {
            toast({ type: 'success', description: 'Sub-pillars generated successfully' });
          }
        }
      } catch (error) {
        console.error('Error generating sub-pillars:', error);
        toast({ type: 'error', description: 'Failed to generate sub-pillars' });
      } finally {
        setIsLoadingSubPillars(false);
      }
    },
    [userPrompt, loadPromptHistory]
  );

  const generateScripts = useCallback(async () => {
    if (!userPrompt.trim()) {
      toast({ type: 'error', description: 'User prompt is required' });
      return;
    }
    if (!clientPersona.trim()) {
      toast({ type: 'error', description: 'Client persona is required. Please generate sub-pillars first.' });
      return;
    }
    if (!contentPillar.trim()) {
      toast({ type: 'error', description: 'Content pillar is required. Please generate sub-pillars first.' });
      return;
    }
    if (!Array.isArray(subPillars) || subPillars.length === 0) {
      toast({ type: 'error', description: 'Sub-pillars are required. Please generate sub-pillars first.' });
      return;
    }
    if (!Array.isArray(selectedSubPillars) || selectedSubPillars.length === 0) {
      toast({ type: 'error', description: 'Please select at least one sub-pillar' });
      return;
    }
    if (!Array.isArray(hookType) || hookType.length === 0) {
      toast({ type: 'error', description: 'Please select at least one hook type' });
      return;
    }

    setIsLoadingScripts(true);
    try {
      const response = await fetch('/split-v2/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt,
          clientPersona,
          contentPillar,
          subPillars,
          chosenSubPillars: selectedSubPillars.map(
            (value) => subPillars.find((sp) => sp.value === value)?.label || value
          ),
          hookType,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate scripts');
      }
      const data = await response.json();
      setScripts(data.scripts);
      setValidated(new Array(data.scripts.length).fill(false));
      setHistoryId(data.historyId);
      await loadPromptHistory();
      toast({ type: 'success', description: 'Scripts generated successfully' });
    } catch (error: any) {
      console.error('Error generating scripts:', error);
      toast({ type: 'error', description: `Failed to generate scripts: ${error.message}` });
    } finally {
      setIsLoadingScripts(false);
    }
  }, [userPrompt, clientPersona, contentPillar, subPillars, selectedSubPillars, hookType, loadPromptHistory]);

  const validateScript = useCallback(
    async (scriptIndex: number, historyId: string) => {
      if (!scripts[scriptIndex]) {
        toast({ type: 'error', description: 'Invalid script index' });
        return;
      }

      try {
        const validateResponse = await fetch('/split-v2/api/validate-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userPrompt,
            clientPersona,
            contentPillar,
            subPillars,
            chosenSubPillars: selectedSubPillars.map(
              (value) => subPillars.find((sp) => sp.value === value)?.label || value
            ),
            hookType: hookType[scriptIndex % hookType.length],
            script: scripts[scriptIndex],
            historyId,
          }),
        });

        if (!validateResponse.ok) {
          const errorData = await validateResponse.json();
          throw new Error(errorData.error || 'Failed to validate script');
        }

        const validateData = await validateResponse.json();

        setScripts((prev) => {
          const newScripts = [...prev];
          newScripts[scriptIndex] = { ...newScripts[scriptIndex], isValidated: true };
          return newScripts;
        });
        setValidated((prev) => {
          const newValidated = [...prev];
          newValidated[scriptIndex] = true;
          return newValidated;
        });

        toast({
          type: 'success',
          description: `Script "${scripts[scriptIndex].subtitle}" validated and saved successfully`,
        });
      } catch (error: any) {
        console.error('Error validating/saving script:', error);
        toast({ type: 'error', description: `Failed to validate/save script: ${error.message}` });
      }
    },
    [userPrompt, clientPersona, contentPillar, subPillars, selectedSubPillars, hookType, scripts]
  );

  const handleDelete = (scriptIndex: number) => {
    setScripts((prev) => prev.filter((_, i) => i !== scriptIndex));
    setValidated((prev) => prev.filter((_, i) => i !== scriptIndex));
  };

  return (
    <ScriptGeneratorContext.Provider
      value={{
        userPrompt,
        setUserPrompt,
        contentPillar,
        setContentPillar,
        clientPersona,
        setClientPersona,
        subPillars,
        setSubPillars,
        selectedSubPillars,
        setSelectedSubPillars,
        hookType,
        setHookType,
        scripts,
        setScripts,
        isLoadingSubPillars,
        isLoadingScripts,
        validated,
        setValidated,
        generateSubPillars,
        generateScripts,
        validateScript,
        handleDelete,
        promptHistory,
        selectPrompt,
        deletePrompt,
        loadPromptHistory,
        historyId,
        setHistoryId,
        mode,
        setMode,
      }}
    >
      {children}
    </ScriptGeneratorContext.Provider>
  );
};

export const useScriptGenerator = () => {
  const context = useContext(ScriptGeneratorContext);
  if (!context) {
    throw new Error('useScriptGenerator must be used within a ScriptGeneratorProvider');
  }
  return context;
};