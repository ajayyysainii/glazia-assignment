import {
  ArrowRight,
  Circle,
  Eraser,
  Hand,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  Undo2,
  type LucideProps,
} from "lucide-react";

const iconProps: LucideProps = {
  size: 18,
  strokeWidth: 1.8,
  "aria-hidden": true,
};

export function IconSelect() {
  return <MousePointer2 {...iconProps} />;
}

export function IconHand() {
  return <Hand {...iconProps} />;
}

export function IconPen() {
  return <Pencil {...iconProps} />;
}

export function IconRect() {
  return <Square {...iconProps} />;
}

export function IconEllipse() {
  return <Circle {...iconProps} />;
}

export function IconArrow() {
  return <ArrowRight {...iconProps} />;
}

export function IconEraser() {
  return <Eraser {...iconProps} />;
}

export function IconUndo() {
  return <Undo2 {...iconProps} />;
}

export function IconRedo() {
  return <Redo2 {...iconProps} />;
}
