// app/(tools)/split-v2/page.tsx
'use client';
import { cn } from '@/lib/utils';
import { Form1 } from './form-1';
import { Form2 } from './form-2';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import { MinimalTiptapEditor } from '../components/minimal-tiptap';
import { ScriptGeneratorProvider, useScriptGenerator } from './script-generator-context';
import { Separator } from '@/components/ui/separator';

const ITEMS_PER_PAGE = 5;

function PageContent() {
  const {
    scripts,
    isLoadingScripts,
    validated,
    validateScript,
    handleDelete,
    setScripts,
    historyId,
  } = useScriptGenerator();
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedScripts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return scripts.slice(start, start + ITEMS_PER_PAGE);
  }, [scripts, currentPage]);

  const totalPages = Math.ceil(scripts.length / ITEMS_PER_PAGE);

  return (
    <div className={cn('container mx-auto p-4')}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Form (Left Side) */}
        <div className="flex-1 w-full md:w-1/3 md:pr-4 border-r-zinc-800 md:border-r">
          <h2 className="text-2xl font-bold mb-4">Script Generator</h2>
          <div>
            <Form1 />
            <Form2 />
          </div>
        </div>
        {/* Scripts (Right Side) */}
        <div className="flex-2 w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">Generated Scripts</h2>
          <div className="space-y-4">
            {isLoadingScripts ? (
              <p className="text-gray-500 dark:text-gray-400">Generating scripts...</p>
            ) : scripts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No scripts generated yet. Fill out the form and click &quot;Generate Scripts&quot;.
              </p>
            ) : (
              paginatedScripts.map((script, index) => (
                <div key={index} className="border rounded-xl dark:border-zinc-800">
                  <h3 className="text-xl font-semibold text-right text-wrap pb-2 pt-4 px-5">{script.subtitle}</h3>
                  <MinimalTiptapEditor
                    value={script.content}
                    onChange={(value) =>
                      // @ts-ignore
                      setScripts((prev) => {
                        const newScripts = [...prev];
                        newScripts[(currentPage - 1) * ITEMS_PER_PAGE + index].content = value;
                        return newScripts;
                      })
                    }
                    throttleDelay={2000}
                    className={cn('h-full min-h-[150px] w-full rounded-xl border-0')}
                    editorContentClassName="overflow-auto h-full"
                    output="html"
                    placeholder={`Script ${(currentPage - 1) * ITEMS_PER_PAGE + index + 1}...`}
                    editable={true}
                    editorClassName="focus:outline-none px-5 py-4 h-full"
                  />
                  <div className="p-2 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => validateScript((currentPage - 1) * ITEMS_PER_PAGE + index, historyId)}
                      disabled={validated[(currentPage - 1) * ITEMS_PER_PAGE + index]}
                    >
                      {validated[(currentPage - 1) * ITEMS_PER_PAGE + index] ? 'Validated' : 'Validate'}
                    </Button>
                    {!validated[(currentPage - 1) * ITEMS_PER_PAGE + index] && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete((currentPage - 1) * ITEMS_PER_PAGE + index)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          )}
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