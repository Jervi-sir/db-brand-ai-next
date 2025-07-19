// app/(tools)/split-v2/page.tsx
'use client';
import { cn } from '@/lib/utils';
import { Form1 } from './form-1';
import { Form2 } from './form-2';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { MinimalTiptapEditor } from '../components/minimal-tiptap';
import { ScriptGeneratorProvider, useScriptGenerator } from './script-generator-context';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

function PageContent() {
  const {
    scripts,
    isLoadingScripts,
    validated,
    validateScript,
    handleDelete,
    setScripts,
    historyId,
    mode,
    clientPersona,
    contentPillar,
    subPillars,
    selectedSubPillars,
  } = useScriptGenerator();

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b pr-10">
        <div className="flex items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h4>Split</h4>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Panel: Form and Metadata */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto md:border-r-2">
          <h2 className="text-2xl font-bold mb-4">Script Generator</h2>
          <div>
            <Form1 />
            {mode === 'custom' && <Form2 />}
            {mode === 'automatic' && clientPersona && contentPillar && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Generated Metadata</h3>
                <p><strong>Client Persona:</strong> {clientPersona}</p>
                <p><strong>Content Pillar:</strong> {contentPillar}</p>
                <p>
                  <strong>Sub-Pillars:</strong>{' '}
                  {selectedSubPillars
                    .map((value) => subPillars.find((sp) => sp.value === value)?.label || value)
                    .join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Right Panel: Scripts */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Generated Scripts ({scripts.length})</h2>
          <div className="space-y-4">
            {isLoadingScripts ? (
              <div className='flex items-end gap-4'>
                <p className="text-gray-500 dark:text-gray-400">Generating scripts...</p>
                <Loader2 className='animate-spin' />
              </div>
            ) : scripts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No scripts generated yet. Fill out the form and click &quot;Generate Scripts&quot;.
              </p>
            ) : (
              scripts.map((script, index) => (
                <div key={index} className="border rounded-xl dark:border-zinc-800">
                  <h3 className="text-xl font-semibold text-right text-wrap pb-2 pt-4 px-5">{script.subtitle}</h3>
                  <MinimalTiptapEditor
                    value={script.content}
                    onChange={(value) =>
                      // @ts-ignore
                      setScripts((prev) => {
                        const newScripts = [...prev];
                        newScripts[index].content = value;
                        return newScripts;
                      })
                    }
                    throttleDelay={2000}
                    className={cn('h-full min-h-[150px] w-full rounded-xl border-0')}
                    editorContentClassName="overflow-auto h-full"
                    output="html"
                    placeholder={`Script ${index + 1}...`}
                    editable={true}
                    editorClassName="focus:outline-none px-5 py-4 h-full"
                  />
                  <div className="p-2 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => validateScript(index, historyId)}
                      disabled={validated[index]}
                    >
                      {validated[index] ? 'Validated' : 'Validate'}
                    </Button>
                    {!validated[index] && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(index)}
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

export default function Page() {
  return (
    <ScriptGeneratorProvider>
      <PageContent />
    </ScriptGeneratorProvider>
  );
}