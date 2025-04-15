// app/(some-path)/ai-usage/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export default function AiUsage() {
  const [usage, setUsage] = useState<any>(null); // Usage data from API
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // Current page
  const perPage = 10; // Items per page

  // Fetch usage data
  const fetchUsage = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/usage?page=${pageNum}&per_page=${perPage}`, {
        credentials: 'include', // Include cookies for auth
      });
      if (!response.ok) throw new Error('Failed to fetch usage data');
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when page changes
  useEffect(() => {
    fetchUsage(page);
  }, [page]);

  const totalTokens = usage?.data?.reduce((sum: number, item: any) => sum + item.totalTokens, 0) || 0;

  const handlePrevious = () => {
    if (usage?.prev_page_url) setPage(page - 1);
  };

  const handleNext = () => {
    if (usage?.next_page_url) setPage(page + 1);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </div>
      </header>
      <div className="p-0">
        <Table>
          <TableCaption>A list of your recent OpenAI API usage.</TableCaption>
          <TableHeader>
            <TableRow>
              {/* <TableHead>ID</TableHead> */}
              <TableHead>Chat ID</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Prompt Tokens</TableHead>
              <TableHead>Completion Tokens</TableHead>
              <TableHead>Total Tokens</TableHead>
              <TableHead>Duration (s)</TableHead>
              <TableHead>Completed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usage?.data?.length > 0 ? (
              usage.data.map((item: any) => (
                <TableRow key={item.id}>
                  {/* <TableCell className='whitespace-nowrap max-w-[100px] truncate'>{item.id}</TableCell> */}
                  <TableCell className="whitespace-nowrap max-w-[100px] truncate">
                    {item.chatId || 'N/A'}
                  </TableCell>
                  <TableCell>{item.model}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.promptTokens}</TableCell>
                  <TableCell>{item.completionTokens}</TableCell>
                  <TableCell>{item.totalTokens}</TableCell>
                  <TableCell>{item.duration ? Number(item.duration).toFixed(3) : 'N/A'}</TableCell>
                  <TableCell>{new Date(item.completedAt).toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No usage data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6}>Total</TableCell>
              <TableCell>{totalTokens}</TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
          </TableFooter>
        </Table>

        {/* Pagination Controls */}
        <div className="mt-4 flex justify-end gap-4 items-center">
          <Button
            onClick={handlePrevious}
            disabled={!usage?.prev_page_url}
            className={!usage?.prev_page_url ? 'pointer-events-none opacity-50' : ''}
          >
            Previous
          </Button>
          <span>
            Page {usage?.current_page || 1} of {usage?.last_page || 1}
          </span>
          <Button
            onClick={handleNext}
            disabled={!usage?.next_page_url}
            className={!usage?.next_page_url ? 'pointer-events-none opacity-50' : ''}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}