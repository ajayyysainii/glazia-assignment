import { GRID_SIZE } from "./constants";

type CanvasGridProps = {
  stageScale: number;
  stagePos: { x: number; y: number };
};

export function CanvasGrid({ stageScale, stagePos }: CanvasGridProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-70"
      style={{
        backgroundColor: "#f4f5f7",
        backgroundImage: "radial-gradient(circle, #c5c9d2 1px, transparent 1px)",
        backgroundSize: `${GRID_SIZE * stageScale}px ${GRID_SIZE * stageScale}px`,
        backgroundPosition: `${stagePos.x}px ${stagePos.y}px`,
      }}
    />
  );
}
