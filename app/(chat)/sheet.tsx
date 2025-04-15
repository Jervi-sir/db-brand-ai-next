'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";

interface ChatToneSettingsProps {
  onSave?: (settings: { brandName: string; productName: string; tone: string; context?: string }) => void;
  initialSettings?: {
    brandName?: string;
    productName?: string;
    tone?: string;
    context?: string;
  };
}

export function ChatToneSettings({ onSave, initialSettings = {} }: ChatToneSettingsProps) {

  const [brandName, setBrandName] = useState(initialSettings.brandName || "");
  const [productName, setProductName] = useState(initialSettings.productName || "");
  const [tone, setTone] = useState(initialSettings.tone || "professional");
  const [context, setContext] = useState(initialSettings.context || "");

  const handleSave = () => {
    const settings = {
      brandName,
      productName,
      tone,
      context,
    };
    onSave?.(settings);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          <Settings2 className="size-4" />
          <span className="sr-only">Chat Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chat Settings</SheetTitle>
          <SheetDescription>
            Configure the tone and context for the AI chat. Save your changes to apply them.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="items-center gap-4">
            <Label htmlFor="brandName" className="text-right">
              Brand Name
            </Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., xAI"
            />
          </div>
          <div className="items-center gap-4">
            <Label htmlFor="productName" className="text-right">
              Product Name
            </Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Grok"
            />
          </div>
          <div className="items-center gap-4">
            <Label htmlFor="tone" className="text-right">
              Tone
            </Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="humorous">Humorous</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="items-center gap-4">
            <Label htmlFor="context" className="text-right">
              Additional Context
            </Label>
            <Input
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Customer support for AI tools"
            />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" onClick={handleSave}>
              Save changes
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}