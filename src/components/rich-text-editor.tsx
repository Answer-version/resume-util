"use client";

import { Bold, Eraser, Italic, List, ListOrdered, Underline } from "lucide-react";
import { useEffect, useRef } from "react";

import { isRichTextEmpty, sanitizeRichText } from "@/lib/rich-text";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeightClassName?: string;
};

function runCommand(command: string) {
  document.execCommand(command);
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeightClassName = "min-h-[120px]",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = editorRef.current;

    if (!element) {
      return;
    }

    const nextValue = value || "";

    if (element.innerHTML !== nextValue) {
      element.innerHTML = nextValue;
    }
  }, [value]);

  function handleInput() {
    const nextValue = sanitizeRichText(editorRef.current?.innerHTML || "");
    onChange(nextValue);
  }

  const toolbarButtonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-foreground transition hover:bg-panel-soft";

  return (
    <div className="rounded-md border border-line bg-white">
      <div className="flex flex-wrap gap-2 border-b border-line px-3 py-3">
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={() => runCommand("bold")}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={() => runCommand("italic")}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={() => runCommand("underline")}
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={() => runCommand("insertUnorderedList")}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={() => runCommand("insertOrderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={() => runCommand("removeFormat")}
        >
          <Eraser className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className={`resume-rich-editor ${minHeightClassName} px-3 py-3 text-sm outline-none`}
        data-placeholder={placeholder}
        data-empty={isRichTextEmpty(value) ? "true" : "false"}
      />
    </div>
  );
}
