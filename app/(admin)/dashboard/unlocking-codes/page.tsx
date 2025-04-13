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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Pencil, Infinity } from 'lucide-react';

interface Code {
  id: string;
  code: string;
  createdAt: string;
  maxUses: number | null;
  isActive: boolean;
  usageCount: number;
}

interface PaginatedResponse {
  data: Code[];
  current_page: number;
  last_page: number;
  prev_page_url: string | null;
  next_page_url: string | null;
}

export default function CodeManagement() {
  const [codes, setCodes] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [newCode, setNewCode] = useState({ code: '', maxUses: '', isActive: true });
  const [editCode, setEditCode] = useState<Code | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null);

  // Fetch codes with usage stats
  const fetchCodes = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/codes?page=${pageNum}&per_page=${perPage}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch codes');
      const data = await response.json();
      setCodes(data);
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new code
  const handleAddCode = async () => {
    try {
      const response = await fetch('/api/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.code,
          // maxUses: newCode.maxUses ? parseInt(newCode.maxUses, 10) : null,
          isActive: newCode.isActive,
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to add code');
      setNewCode({ code: '', maxUses: '', isActive: true });
      setAddOpen(false);
      fetchCodes(page);
    } catch (error) {
      console.error('Error adding code:', error);
    }
  };

  // Update existing code
  const handleUpdateCode = async () => {
    if (!editCode) return;
    try {
      const response = await fetch(`/api/codes/${editCode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editCode.code,
          maxUses: editCode.maxUses,
          isActive: editCode.isActive,
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update code');
      setEditCode(null);
      setEditOpen(false);
      fetchCodes(page);
    } catch (error) {
      console.error('Error updating code:', error);
    }
  };

  // Delete code
  const handleDeleteCode = async (id: string) => {
    try {
      const response = await fetch(`/api/codes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete code');
      setDeleteOpen(null);
      fetchCodes(page);
    } catch (error) {
      console.error('Error deleting code:', error);
    }
  };

  useEffect(() => {
    fetchCodes(page);
  }, [page]);

  const totalUsage = codes?.data?.reduce((sum: any, item: any) => sum + item.usageCount, 0) || 0;

  const handlePrevious = () => {
    if (codes?.prev_page_url) setPage(page - 1);
  };

  const handleNext = () => {
    if (codes?.next_page_url) setPage(page + 1);
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
        <div className="mb-4">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild className='flex'>
              <Button size='sm' variant='secondary' className='ml-auto mt-2'>Add New Code</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Code</DialogTitle>
                <DialogDescription>Create a new unlock code.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    Code
                  </Label>
                  <Input
                    id="code"
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive" className="text-right">
                    Active
                  </Label>
                  <Switch
                    id="isActive"
                    checked={newCode.isActive}
                    onCheckedChange={(checked) => setNewCode({ ...newCode, isActive: checked })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCode} disabled={!newCode.code.trim()}>
                  Save Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableCaption>A list of unlock codes and their usage.</TableCaption>
          <TableHeader>
            <TableRow>
              {/* <TableHead>ID</TableHead> */}
              <TableHead>Code</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Max Uses</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Usage Count</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes?.data?.length > 0 ? (
              codes.data.map((item: any) => (
                <TableRow key={item.id}>
                  {/* <TableCell className='font-medium max-w-[100px] truncate cursor-pointer'>{item.id}</TableCell> */}
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{item.maxUses ?? <Infinity />}</TableCell>
                  <TableCell>{item.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{item.usageCount}</TableCell>
                  <TableCell className="flex gap-2 justify-end">
                    <Dialog open={editOpen && editCode?.id === item.id} onOpenChange={(open) => { if (!open) setEditCode(null); setEditOpen(open); }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditCode(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Code</DialogTitle>
                          <DialogDescription>Update the unlock code details.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-code" className="text-right">
                              Code
                            </Label>
                            <Input
                              id="edit-code"
                              value={editCode?.code || ''}
                              onChange={(e) =>
                                setEditCode((prev) => prev ? { ...prev, code: e.target.value } : null)
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-isActive" className="text-right">
                              Active
                            </Label>
                            <Switch
                              id="edit-isActive"
                              checked={editCode?.isActive}
                              onCheckedChange={(checked) =>
                                setEditCode((prev) => prev ? { ...prev, isActive: checked } : null)
                              }
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleUpdateCode} disabled={!editCode?.code.trim()}>
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={deleteOpen === item.id} onOpenChange={(open) => setDeleteOpen(open ? item.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Code</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete the code "{item.code}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteOpen(null)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={() => handleDeleteCode(item.id)}>
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No codes available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {/* <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>Total Usage</TableCell>
              <TableCell>{totalUsage}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter> */}
        </Table>

        {/* Pagination Controls */}
        <div className="mt-4 flex justify-end gap-4 items-center">
          <Button
            onClick={handlePrevious}
            disabled={!codes?.prev_page_url}
            className={`${!codes?.prev_page_url ? 'pointer-events-none opacity-50' : ''} cursor-pointer`}
            size='sm'
            variant='outline'
          >
            Previous
          </Button>
          <span>
            Page {codes?.current_page || 1} of {codes?.last_page || 1}
          </span>
          <Button
            onClick={handleNext}
            disabled={!codes?.next_page_url}
            className={`${!codes?.next_page_url ? 'pointer-events-none opacity-50' : ''} cursor-pointer`}
            size='sm'
            variant='outline'
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}