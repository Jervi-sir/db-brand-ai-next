// app/dashboard/models/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function ModelsDashboard() {
  // Placeholder state for demonstration; replace with real data from your DB
  const existingModels = [
    { id: 1, name: "Copywriting AI", endpoint: "https://api.example.com/copy", capability: "copywriting" },
    { id: 2, name: "Calendar AI", endpoint: "https://api.example.com/calendar", capability: "calendar" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const modelData = {
      name: formData.get("name") as string,
      prompt: formData.get("prompt") as string,
      endpoint: formData.get("endpoint") as string,
      apiKey: formData.get("apiKey") as string,
      capabilities: formData.get("capabilities") as string,
    };
    console.log("New Model Data:", modelData);
    // Add logic to save to your database (e.g., API call)
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="create" className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Model</TabsTrigger>
          <TabsTrigger value="manage">Manage Models</TabsTrigger>
        </TabsList>

        {/* Create Model Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Model/Assistant</CardTitle>
              <CardDescription>
                Configure a new AI model or assistant here. Save when done.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Model/Assistant Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Copywriting AI"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prompt">Prompt System</Label>
                  <Textarea
                    id="prompt"
                    name="prompt"
                    placeholder="e.g., You are a copywriting expert..."
                    rows={4}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endpoint">API Endpoint</Label>
                  <Input
                    id="endpoint"
                    name="endpoint"
                    placeholder="e.g., https://api.example.com/copywriting"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="apiKey">API Key (optional)</Label>
                  <Input
                    id="apiKey"
                    name="apiKey"
                    placeholder="Enter API key if required"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="capabilities">Capabilities</Label>
                  <Input
                    id="capabilities"
                    name="capabilities"
                    placeholder="e.g., copywriting,calendar"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter capabilities as a comma-separated list
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Save Model</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Manage Models Tab */}
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Manage Existing Models</CardTitle>
              <CardDescription>
                View and edit your existing AI models/assistants.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {existingModels.length === 0 ? (
                <p className="text-muted-foreground">No models created yet.</p>
              ) : (
                existingModels.map((model) => (
                  <div key={model.id} className="border p-4 rounded-md space-y-2">
                    <div>
                      <Label>Name:</Label>
                      <p>{model.name}</p>
                    </div>
                    <div>
                      <Label>Endpoint:</Label>
                      <p>{model.endpoint}</p>
                    </div>
                    <div>
                      <Label>Capabilities:</Label>
                      <p>{model.capability}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter>
              <Button variant="secondary" disabled>
                Load More (placeholder)
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}