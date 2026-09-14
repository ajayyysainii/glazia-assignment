import type { PreviewBounds, PreviewShape } from "@/lib/canvas";
import { GRID_SIZE } from "./constants";

type CanvasThumbnailProps = {
  shapes?: PreviewShape[];
  bounds?: PreviewBounds | null;
  /** Rendered aspect; the board is fitted inside it. */
  width?: number;
  height?: number;
};

const PADDING = 14;
/** Never magnify a tiny sketch to fill the frame — it reads as a mistake. */
const MAX_FIT_SCALE = 1;

function fit(bounds: PreviewBounds, width: number, height: number) {
  const boardW = Math.max(bounds.maxX - bounds.minX, 1);
  const boardH = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.min(
    MAX_FIT_SCALE,
    (width - PADDING * 2) / boardW,
    (height - PADDING * 2) / boardH,
  );
  return {
    scale,
    // Centre whatever is on the board inside the frame.
    x: (width - boardW * scale) / 2 - bounds.minX * scale,
    y: (height - boardH * scale) / 2 - bounds.minY * scale,
  };
}

function toPolyline(points: number[]) {
  const out: string[] = [];
  for (let i = 0; i < points.length; i += 2) {
    out.push(`${points[i]},${points[i + 1]}`);
  }
  return out.join(" ");
}

export function CanvasThumbnail({
  shapes,
  bounds,
  width = 320,
  height = 200,
}: CanvasThumbnailProps) {
  const empty = !shapes?.length || !bounds;
  const view = empty ? null : fit(bounds, width, height);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* The same dot grid as the board itself, so a thumbnail reads as a
            small window onto the canvas rather than a generic card image. */}
        <pattern
          id="thumb-grid"
          width={GRID_SIZE}
          height={GRID_SIZE}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={1} cy={1} r={1} className="fill-[#d3d7e0]" />
        </pattern>
      </defs>

      <rect width={width} height={height} className="fill-[#fbfbfc]" />
      <rect width={width} height={height} fill="url(#thumb-grid)" opacity={0.6} />

      {view ? (
        <g
          transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {shapes!.map((shape, i) => {
            // Hairlines vanish once a big board is scaled down; hold a floor.
            const strokeWidth =
              shape.kind === "text"
                ? 0
                : Math.max(shape.strokeWidth, 1.2 / view.scale);

            switch (shape.kind) {
              case "line":
                return (
                  <polyline
                    key={i}
                    points={toPolyline(shape.points)}
                    fill="none"
                    stroke={shape.stroke}
                    strokeWidth={strokeWidth}
                  />
                );
              case "arrow": {
                const [x1, y1, x2, y2] = shape.points as [
                  number,
                  number,
                  number,
                  number,
                ];
                // A headless arrow reads as a plain line, which changes what
                // the board looks like it says.
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const head = Math.max(strokeWidth * 2.6, 6 / view.scale);
                const spread = Math.PI / 7;
                return (
                  <g key={i} stroke={shape.stroke} strokeWidth={strokeWidth}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} />
                    <polyline
                      fill="none"
                      points={[
                        `${x2 - head * Math.cos(angle - spread)},${
                          y2 - head * Math.sin(angle - spread)
                        }`,
                        `${x2},${y2}`,
                        `${x2 - head * Math.cos(angle + spread)},${
                          y2 - head * Math.sin(angle + spread)
                        }`,
                      ].join(" ")}
                    />
                  </g>
                );
              }
              case "rect":
                return (
                  <rect
                    key={i}
                    x={shape.x}
                    y={shape.y}
                    width={Math.abs(shape.width)}
                    height={Math.abs(shape.height)}
                    fill={shape.fill ?? "none"}
                    stroke={shape.stroke}
                    strokeWidth={strokeWidth}
                  />
                );
              case "ellipse":
                return (
                  <ellipse
                    key={i}
                    cx={shape.x}
                    cy={shape.y}
                    rx={Math.abs(shape.radiusX)}
                    ry={Math.abs(shape.radiusY)}
                    fill={shape.fill ?? "none"}
                    stroke={shape.stroke}
                    strokeWidth={strokeWidth}
                  />
                );
              case "text": {
                // Text is drawn as its block: legible as "a note lives here",
                // without rendering glyphs too small to read.
                const w = shape.width ?? shape.fontSize * 6;
                const lineH = shape.fontSize * 0.42;
                return (
                  <g key={i} fill={shape.stroke} opacity={0.75}>
                    <rect
                      x={shape.x}
                      y={shape.y + shape.fontSize * 0.2}
                      width={w}
                      height={lineH}
                      rx={lineH / 2}
                    />
                    <rect
                      x={shape.x}
                      y={shape.y + shape.fontSize * 0.85}
                      width={w * 0.62}
                      height={lineH}
                      rx={lineH / 2}
                    />
                  </g>
                );
              }
              default:
                return null;
            }
          })}
        </g>
      ) : null}
    </svg>
  );
}
