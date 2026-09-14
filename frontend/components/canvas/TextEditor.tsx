"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type Konva from "konva";
import type { TextShape } from "./types";

type TextEditorProps = {
  shape: TextShape;
  stage: Konva.Stage;
  stageScale: number;
  onChange: (text: string) => void;
  onClose: () => void;
};

export function TextEditor({
  shape,
  stage,
  stageScale,
  onChange,
  onClose,
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const absPos = {
      x: stage.x() + shape.x * stageScale,
      y: stage.y() + shape.y * stageScale,
    };

    textarea.value = shape.text;
    textarea.style.position = "absolute";
    textarea.style.left = `${absPos.x}px`;
    textarea.style.top = `${absPos.y}px`;
    textarea.style.width = `${Math.max(120, (shape.width ?? 200) * stageScale)}px`;
    textarea.style.fontSize = `${shape.fontSize * stageScale}px`;
    textarea.style.lineHeight = "1.2";
    textarea.style.transform = `rotate(${shape.rotation ?? 0}deg)`;
    textarea.style.transformOrigin = "left top";
    textarea.style.color = shape.stroke;
    textarea.focus();
    textarea.select();
  }, [shape, stage, stageScale]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const commit = () => {
      onChange(textarea.value);
      onClose();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        commit();
      }
    };

    const onBlur = () => commit();

    textarea.addEventListener("keydown", onKeyDown);
    textarea.addEventListener("blur", onBlur);
    return () => {
      textarea.removeEventListener("keydown", onKeyDown);
      textarea.removeEventListener("blur", onBlur);
    };
  }, [onChange, onClose]);

  return (
    <textarea
      ref={textareaRef}
      className="absolute z-30 resize-none overflow-hidden rounded-md border border-[#1c202a]/20 bg-white/95 p-1 font-sans shadow-sm outline-none"
      rows={2}
      spellCheck={false}
    />
  );
}
