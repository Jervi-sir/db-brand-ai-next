'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Editor from "react-simple-wysiwyg";
import DOMPurify from "dompurify";
import { useForm } from "react-hook-form";

// Mock AI-generated scripts (replace with actual AI API call)
const mockScripts = [
  "<p>Generated script 1: <b>Happy</b> story about <i>topic</i>.</p>",
  "<p>Generated script 2: A <u>serious</u> take on <i>description</i>.</p>",
];

export default function Page() {
  // Form setup with react-hook-form
  const form = useForm({
    defaultValues: {
      topic: "",
      description: "",
      mood: "",
    },
  });

  // State for scripts
  const [scripts, setScripts] = useState(mockScripts);

  // Handle form submission (mock AI generation)
  const onSubmit = (data: any) => {
    // Mock adding a new script based on form input
    const newScript = `<p>New script: ${data.mood} content about ${data.topic}. ${data.description}</p>`;
    setScripts([...scripts, DOMPurify.sanitize(newScript)]);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Form (Left Side) */}
        <div className="w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">Script Generator</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Topic */}
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Adventure Story" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the script context..."
                        className="resize-vertical"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Mood */}
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mood</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mood" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Happy">Happy</SelectItem>
                        <SelectItem value="Serious">Serious</SelectItem>
                        <SelectItem value="Funny">Funny</SelectItem>
                        <SelectItem value="Dramatic">Dramatic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Generate Script</Button>
            </form>
          </Form>
        </div>

        {/* Editors (Right Side) */}
        <div className="w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">Generated Scripts</h2>
          <div className="space-y-4">
            {scripts.length === 0 ? (
              <p className="text-gray-500">No scripts generated yet.</p>
            ) : (
              scripts.map((script, index) => (
                <div key={index} className="border rounded-md p-2">
                  <Editor
                    value={script}
                    onChange={() => {}} // Read-only for simplicity
                    containerProps={{
                      style: { resize: "vertical", minHeight: "150px", },
                    }}
                  />
                  
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
