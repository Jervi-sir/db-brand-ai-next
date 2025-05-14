// app/context/ScriptGeneratorContext.tsx
import { toast } from '@/components/toast';
import React, { createContext, useContext, useState, useCallback } from 'react';

interface ScriptGeneratorContextType {
  userPrompt: string;
  setUserPrompt: (prompt: string) => void;
  subPillars: { value: string; label: string }[];
  setSubPillars: (subPillars: { value: string; label: string }[]) => void;
  selectedSubPillars: string[];
  setSelectedSubPillars: (subPillars: string[]) => void;
  hookType: string;
  setHookType: (hookType: string) => void;
  scripts: { subtitle: string; content: string }[];
  setScripts: (scripts: { subtitle: string; content: string }[]) => void;
  isLoadingSubPillars: boolean;
  isLoadingScripts: boolean;
  validated: boolean[];
  setValidated: (validated: boolean[]) => void;
  generateSubPillars: () => Promise<void>;
  generateScripts: () => Promise<void>;
  handleDelete: (scriptIndex: number) => void;
  handleValidate: (scriptIndex: number) => void;
}

const ScriptGeneratorContext = createContext<ScriptGeneratorContextType | undefined>(undefined);

export const ScriptGeneratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [subPillars, setSubPillars] = useState<{ value: string; label: string }[]>([]);
  const [selectedSubPillars, setSelectedSubPillars] = useState<string[]>([]);
  const [hookType, setHookType] = useState<string>('');
  const [scripts, setScripts] = useState<{ subtitle: string; content: string }[]>([]);
  const [isLoadingSubPillars, setIsLoadingSubPillars] = useState<boolean>(false);
  const [isLoadingScripts, setIsLoadingScripts] = useState<boolean>(false);
  const [validated, setValidated] = useState<boolean[]>([]);

const generateSubPillars = useCallback(async () => {
  if (!userPrompt.trim()) {
    toast({ type: 'error', description: 'User prompt is required' });
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
    const formattedSubPillars = data.subPillars.map((sp: string, index: number) => ({
      value: `sub-pillar-${index}`,
      label: sp,
    }));
    setSubPillars(formattedSubPillars);
    if (formattedSubPillars.length < 25) {
      toast({
        type: 'error',
        description: `Generated ${formattedSubPillars.length} sub-pillars instead of 25. Some content may be missing.`,
      });
    } else {
      toast({ type: 'success', description: 'Sub-pillars generated successfully' });
    }
  } catch (error) {
    console.error('Error generating sub-pillars:', error);
    toast({ type: 'error', description: 'Failed to generate sub-pillars' });
  } finally {
    setIsLoadingSubPillars(false);
  }
}, [userPrompt]);



const generateScripts = useCallback(async () => {
  if (selectedSubPillars.length === 0 || !hookType) {
    toast({ type: 'error', description: 'Please select sub-pillars and hook type' });
    return;
  }
  setIsLoadingScripts(true);
  try {
    const payload = {
      subPillars: selectedSubPillars.map((value) => subPillars.find((sp) => sp.value === value)?.label),
      hookType,
      userPrompt,
    };
    const response = await fetch('/split-v2/api/generate-scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Failed to generate scripts');
    }
    const data = await response.json();
    setScripts(data.scripts);
    setValidated(new Array(data.scripts.length).fill(false));
    toast({ type: 'success', description: 'Scripts generated successfully' });
  } catch (error) {
    console.error('Error generating scripts:', error);
    toast({ type: 'error', description: 'Failed to generate scripts' });
  } finally {
    setIsLoadingScripts(false);
  }
}, [selectedSubPillars, hookType, subPillars, userPrompt]);

  const handleDelete = (scriptIndex: number) => {
    setScripts((prev) => prev.filter((_, i) => i !== scriptIndex));
    setValidated((prev) => prev.filter((_, i) => i !== scriptIndex));
  };

  const handleValidate = (scriptIndex: number) => {
    setValidated((prev) => {
      const newValidated = [...prev];
      newValidated[scriptIndex] = true;
      return newValidated;
    });
  };

  return (
    <ScriptGeneratorContext.Provider
      value={{
        userPrompt,
        setUserPrompt,
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
        handleDelete,
        handleValidate,
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