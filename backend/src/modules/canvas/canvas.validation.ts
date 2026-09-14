import { z } from "zod";

const baseShapeSchema = z.object({
  id: z.string().min(1),
  stroke: z.string().min(1),
  strokeWidth: z.number().nonnegative(),
  fill: z.string().nullable().optional(),
  rotation: z.number().optional(),
});

const lineShapeSchema = baseShapeSchema.extend({
  kind: z.literal("line"),
  tool: z.enum(["pen", "eraser"]),
  points: z.array(z.number()).min(2),
});

const rectShapeSchema = baseShapeSchema.extend({
  kind: z.literal("rect"),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const ellipseShapeSchema = baseShapeSchema.extend({
  kind: z.literal("ellipse"),
  x: z.number(),
  y: z.number(),
  radiusX: z.number().nonnegative(),
  radiusY: z.number().nonnegative(),
});

const arrowShapeSchema = baseShapeSchema.extend({
  kind: z.literal("arrow"),
  points: z.array(z.number()).length(4),
});

const textShapeSchema = baseShapeSchema.extend({
  kind: z.literal("text"),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  fontSize: z.number().positive(),
  width: z.number().positive().optional(),
});

export const canvasShapeSchema = z.discriminatedUnion("kind", [
  lineShapeSchema,
  rectShapeSchema,
  ellipseShapeSchema,
  arrowShapeSchema,
  textShapeSchema,
]);

export const viewportSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  scale: z.number().min(0.05).max(16).default(1),
});

export const createCanvasSchema = z.object({
  title: z.string().trim().min(1).max(120).default("Untitled canvas"),
  shapes: z.array(canvasShapeSchema).default([]),
  viewport: viewportSchema.default({ x: 0, y: 0, scale: 1 }),
});

export const updateCanvasSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    shapes: z.array(canvasShapeSchema).optional(),
    viewport: viewportSchema.optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.shapes !== undefined ||
      value.viewport !== undefined,
    { message: "At least one of title, shapes, or viewport is required" },
  );

export const canvasIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid canvas id"),
});
