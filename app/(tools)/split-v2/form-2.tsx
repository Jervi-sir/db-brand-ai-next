// app/form-2.tsx
'use client';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MultiSelect } from './multi-select';
import { Turtle, Cat, Dog, Rabbit, Fish } from 'lucide-react';
import { useScriptGenerator } from './script-generator-context';

const HOOK_TYPES = [
  { name: 'Fix a Problem' },
  { name: 'Quick Wins' },
  { name: 'Reactions & Reviews' },
  { name: 'Personal Advice' },
  { name: 'Step-by-Step Guides' },
  { name: 'Curiosity & Surprises' },
  { name: 'Direct Targeting' },
];

const ICONS = [Turtle, Cat, Dog, Rabbit, Fish];

export const Form2 = () => {
  const { subPillars, selectedSubPillars, setSelectedSubPillars, hookType, setHookType, generateScripts, isLoadingScripts } = useScriptGenerator();

  // Add icons to sub-pillars dynamically
  const subPillarsWithIcons = subPillars.map((sp: any, index: any) => ({
    ...sp,
    icon: ICONS[index % ICONS.length],
  }));

  return (
    <div className="p-4 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Sub Pillars</h1>
      <MultiSelect
        options={subPillarsWithIcons}
        onValueChange={setSelectedSubPillars}
        defaultValue={selectedSubPillars}
        placeholder="Select sub-pillars"
        variant="inverted"
        animation={2}
        maxCount={3}
      />

      <div className="mt-4">
        <Select onValueChange={setHookType} value={hookType}>
          <SelectTrigger>
            <SelectValue placeholder="Select Hook Type" />
          </SelectTrigger>
          <SelectContent>
            {HOOK_TYPES.map((item) => (
              <SelectItem key={item.name} value={item.name}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        className="mt-4"
        onClick={generateScripts}
        disabled={isLoadingScripts || selectedSubPillars.length === 0 || !hookType}
      >
        {isLoadingScripts ? 'Generating...' : 'Generate Scripts'}
      </Button>
    </div>
  );
};