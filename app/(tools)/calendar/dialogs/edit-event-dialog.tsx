// File: components/dialogs/edit-event-dialog.tsx
"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { useCalendar } from "../calendar-context";
import { IEvent, TEventColor } from "../types";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogClose, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinimalTiptapEditor } from "@/app/(tools)/components/minimal-tiptap";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface IFormData {
  title: string;
  userPrompt: string;
  generatedScript: string;
}

interface IProps {
  children: React.ReactNode;
  event: IEvent;
}

export function EditEventDialog({ children, event }: IProps) {
  const { updateEvent } = useCalendar();
  const [open, setOpen] = React.useState(false);

  const form = useForm<IFormData>({
    defaultValues: {
      title: event.title,
      userPrompt: event.userPrompt || "",
      generatedScript: event.generatedScript || "",
    },
  });

  const onSubmit = async (values: IFormData) => {
    try {
      await updateEvent({
        ...event,
        title: values.title,
        userPrompt: values.userPrompt,
        generatedScript: values.generatedScript,
      });
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update event");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="description">Generated Script</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    {...form.register("title", { required: "Title is required" })}
                    placeholder="Enter a title"
                  />
                  {form.formState.errors.title && (
                    <p className="text-red-500 text-xs">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">Deadline</Label>
                  <Input
                    id="endDate"
                    type="text"
                    disabled
                    value={format(parseISO(event.endDate), "MMM d, yyyy")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Input
                    id="stage"
                    type="text"
                    disabled
                    value={event.stage || "script"}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="description">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="generatedScript">Generated Script</Label>
                  <Controller
                    name="generatedScript"
                    control={form.control}
                    rules={{ required: "Generated script is required" }}
                    render={({ field }) => (
                      <MinimalTiptapEditor
                        value={field.value}
                        onChange={field.onChange}
                        className="min-h-[200px] p-2 w-full"
                        output="html"
                        editable={true}
                        placeholder="Edit generated script..."
                      />
                    )}
                  />
                  {form.formState.errors.generatedScript && (
                    <p className="text-red-500 text-xs">
                      {form.formState.errors.generatedScript.message}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}