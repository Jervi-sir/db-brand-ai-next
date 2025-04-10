'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AiModelPage() {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch all models on mount
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/ai-models', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        setModels(data);
        // Optionally select the first model by default
        if (data.length > 0 && !selectedModel) setSelectedModel(data[0]);
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const sidebarNavItems = models.map((model) => ({
    title: model.displayName || model.name,
    href: `/dashboard/ai-settings?id=${model.id}`,
    icon: null,
  }));

  const handleSelectModel = (model: any) => {
    setSelectedModel(model);
    router.push(`/dashboard/ai-settings?id=${model.id}`);
  };

  const handleCreateNew = () => {
    setSelectedModel(null); // Clear selection for new model form
    router.push('/dashboard/ai-settings'); // Reset URL or use a dedicated create route
  };

  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </div>
      </header>

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12 p-4">
        <aside className="w-full max-w-xl lg:w-48">
          {loading ? (
            <div>Loading models...</div>
          ) : models.length === 0 ? (
            <div>No models available</div>
          ) : (
            <nav className="flex flex-col space-y-1">
              {sidebarNavItems.map((item, index) => (
                <Button
                  key={`${item.href}-${index}`}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSelectModel(models[index])}
                  className={cn('w-full justify-start', {
                    'bg-muted': selectedModel?.id === models[index].id,
                  })}
                >
                  {item.title}
                </Button>
              ))}
              <Button variant="outline" onClick={handleCreateNew} className="mt-2">
                Create New Model
              </Button>
            </nav>
          )}
        </aside>

        <Separator className="my-6 md:hidden" />

        <div className="flex-1 md:max-w-2xl">
          <FormData model={selectedModel} onModelUpdate={setModels} />
        </div>
      </div>
    </div>
  );
}

function FormData({ model, onModelUpdate, setSelectedModel }: any) {
  const [formData, setFormData] = useState(model || {});
  const [isEditing, setIsEditing] = useState(!model); // Auto-edit for new models
  const router = useRouter();

  useEffect(() => {
    setFormData(model || {});
    setIsEditing(!model); // Reset editing state when model changes
  }, [model]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData((prev: any) => ({ ...prev, [name]: checked }));
  };

  const handleSave = async () => {
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `/api/ai-models/${formData.id}` : '/api/ai-models';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to save model');
      const updatedModel = await response.json();

      // Update models list
      const fetchModels = await fetch('/api/ai-models', { credentials: 'include' });
      const updatedModels = await fetchModels.json();
      onModelUpdate(updatedModels);

      setFormData(updatedModel);
      setIsEditing(false);
      if (!model) router.push(`/dashboard/ai-settings?id=${updatedModel.id}`);
    } catch (error) {
      console.error('Error saving AI model:', error);
    }
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    try {
      const response = await fetch(`/api/ai-models/${formData.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete model');
      const fetchModels = await fetch('/api/ai-models', { credentials: 'include' });
      const updatedModels = await fetchModels.json();
      onModelUpdate(updatedModels);
      setFormData({});
      setSelectedModel(null);
      router.push('/dashboard/ai-settings');
    } catch (error) {
      console.error('Error deleting AI model:', error);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{formData?.displayName || 'New Model'}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Stop Editing' : 'Enable Edit'}
            </Button>
            {formData.id && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="displayName" className="text-right">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              value={formData?.displayName || ''}
              onChange={handleInputChange}
              className="col-span-3"
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="provider" className="text-right">Provider</Label>
            <Input
              id="provider"
              name="provider"
              value={formData?.provider || 'openai'}
              onChange={handleInputChange}
              className="col-span-3"
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData?.name || ''}
              onChange={handleInputChange}
              className="col-span-3"
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Input
              id="type"
              name="type"
              value={formData?.type || ''}
              onChange={handleInputChange}
              className="col-span-3"
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endpoint" className="text-right">Endpoint</Label>
            <Input
              id="endpoint"
              name="endpoint"
              value={formData?.endpoint || ''}
              onChange={handleInputChange}
              className="col-span-3"
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">API Key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              value={formData?.apiKey || ''}
              onChange={handleInputChange}
              className="col-span-3"
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="capability" className="text-right">Capability</Label>
            <Input
              id="capability"
              name="capability"
              value={formData?.capability || ''}
              onChange={handleInputChange}
              className="col-span-3"
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">Active</Label>
            <Switch
              id="isActive"
              name="isActive"
              checked={formData?.isActive ?? true}
              onCheckedChange={handleSwitchChange('isActive')}
              className="col-span-3"
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxTokens" className="text-right">Max Tokens</Label>
            <Input
              id="maxTokens"
              name="maxTokens"
              type="number"
              value={formData?.maxTokens || ''}
              onChange={handleInputChange}
              className="col-span-3"
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="temperature" className="text-right">Temperature</Label>
            <Input
              id="temperature"
              name="temperature"
              type="number"
              value={formData?.temperature || ''}
              onChange={handleInputChange}
              className="col-span-3"
              disabled={!isEditing}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customPrompts" className="text-right">Custom Prompts</Label>
            <Textarea
              id="customPrompts"
              name="customPrompts"
              value={formData?.customPrompts || ''}
              onChange={handleInputChange}
              className="col-span-3 h-full min-h-36"
              disabled={!isEditing}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Stop Editing' : 'Enable Edit'}
            </Button>
            <Button onClick={handleSave} disabled={!isEditing}>Save</Button>
          </div>
        </div>
      </div>
    </>
  );
}