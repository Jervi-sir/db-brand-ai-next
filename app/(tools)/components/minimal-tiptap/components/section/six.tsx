// components/section/six.tsx
import * as React from "react";
import type { Editor } from "@tiptap/react";
import type { toggleVariants } from "@/components/ui/toggle";
import type { VariantProps } from "class-variance-authority";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";
import { ToolbarButton } from "../toolbar-button";
import { FormatAction } from "../../types";

type AlignmentAction = "left" | "center" | "right" | "justify";
interface Alignment extends FormatAction {
  value: AlignmentAction;
}

const formatActions: Alignment[] = [
  {
    value: "left",
    label: "Align Left",
    icon: <AlignLeft className="size-5" />,
    action: (editor) => editor.chain().focus().setTextAlign("left").run(),
    isActive: (editor) => editor.isActive({ textAlign: "left" }),
    canExecute: (editor) => editor.can().chain().focus().setTextAlign("left").run(),
    shortcuts: ["mod", "shift", "L"],
  },
  {
    value: "center",
    label: "Align Center",
    icon: <AlignCenter className="size-5" />,
    action: (editor) => editor.chain().focus().setTextAlign("center").run(),
    isActive: (editor) => editor.isActive({ textAlign: "center" }),
    canExecute: (editor) => editor.can().chain().focus().setTextAlign("center").run(),
    shortcuts: ["mod", "shift", "E"],
  },
  {
    value: "right",
    label: "Align Right (RTL)",
    icon: <AlignRight className="size-5" />,
    action: (editor) => editor.chain().focus().setTextAlign("right").run(),
    isActive: (editor) => editor.isActive({ textAlign: "right" }),
    canExecute: (editor) => editor.can().chain().focus().setTextAlign("right").run(),
    shortcuts: ["mod", "shift", "R"],
  },
  {
    value: "justify",
    label: "Justify",
    icon: <AlignJustify className="size-5" />,
    action: (editor) => editor.chain().focus().setTextAlign("justify").run(),
    isActive: (editor) => editor.isActive({ textAlign: "justify" }),
    canExecute: (editor) => editor.can().chain().focus().setTextAlign("justify").run(),
    shortcuts: ["mod", "shift", "J"],
  },
];

interface SectionSixProps extends VariantProps<typeof toggleVariants> {
  editor: Editor;
  activeActions?: AlignmentAction[];
  mainActionCount?: number;
}

export const SectionSix: React.FC<SectionSixProps> = ({
  editor,
  activeActions = formatActions.map((action) => action.value),
  mainActionCount = 4, // Show all buttons directly
  size,
  variant,
}) => {
  return (
    <div className="flex items-center gap-1">
      {formatActions
        .filter((action) => activeActions.includes(action.value))
        .slice(0, mainActionCount)
        .map((action) => (
          <ToolbarButton
            key={action.label}
            onClick={() => action.action(editor)}
            disabled={!action.canExecute(editor)}
            isActive={action.isActive(editor)}
            tooltip={`${action.label} ${action.shortcuts.join(" + ")}`}
            aria-label={action.label}
            size={size}
            variant={variant}
          >
            {action.icon}
          </ToolbarButton>
        ))}
    </div>
  );
};

SectionSix.displayName = "SectionSix";

export default SectionSix;