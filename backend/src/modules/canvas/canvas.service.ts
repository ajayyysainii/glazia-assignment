import type { Types } from "mongoose";
import { Canvas } from "../../models/Canvas.js";
import { AppError } from "../../utils/AppError.js";
import { buildPreview } from "./canvas.preview.js";

function toCanvasResponse(canvas: {
  _id: { toString(): string };
  owner: { toString(): string };
  title: string;
  shapes: unknown[];
  viewport: { x: number; y: number; scale: number };
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: canvas._id.toString(),
    owner: canvas.owner.toString(),
    title: canvas.title,
    shapes: canvas.shapes,
    viewport: canvas.viewport,
    createdAt: canvas.createdAt,
    updatedAt: canvas.updatedAt,
  };
}

function toCanvasSummary(canvas: {
  _id: { toString(): string };
  owner: { toString(): string };
  title: string;
  shapes: unknown[];
  viewport: { x: number; y: number; scale: number };
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const { preview, bounds, previewTruncated } = buildPreview(canvas.shapes);

  return {
    id: canvas._id.toString(),
    owner: canvas.owner.toString(),
    title: canvas.title,
    shapeCount: canvas.shapes.length,
    viewport: canvas.viewport,
    // Thumbnail data for the dashboard. The query already reads every shape
    // to count them, so this is free apart from the response bytes.
    preview,
    previewBounds: bounds,
    previewTruncated,
    createdAt: canvas.createdAt,
    updatedAt: canvas.updatedAt,
  };
}

async function getOwnedCanvas(canvasId: string, userId: string) {
  const canvas = await Canvas.findById(canvasId);
  if (!canvas) {
    throw AppError.notFound("Canvas not found");
  }
  if (canvas.owner.toString() !== userId) {
    throw AppError.forbidden("You do not have access to this canvas");
  }
  return canvas;
}

export async function createCanvas(
  userId: string,
  input: {
    title: string;
    shapes: unknown[];
    viewport: { x: number; y: number; scale: number };
  },
) {
  const canvas = await Canvas.create({
    owner: userId as unknown as Types.ObjectId,
    title: input.title,
    shapes: input.shapes,
    viewport: input.viewport,
  });

  return toCanvasResponse(canvas);
}

export async function listCanvases(userId: string) {
  const canvases = await Canvas.find({ owner: userId })
    .sort({ updatedAt: -1 })
    .select("owner title shapes viewport createdAt updatedAt");

  return canvases.map(toCanvasSummary);
}

export async function getCanvasById(canvasId: string, userId: string) {
  const canvas = await getOwnedCanvas(canvasId, userId);
  return toCanvasResponse(canvas);
}

export async function updateCanvas(
  canvasId: string,
  userId: string,
  input: {
    title?: string;
    shapes?: unknown[];
    viewport?: { x: number; y: number; scale: number };
  },
) {
  const canvas = await getOwnedCanvas(canvasId, userId);

  if (input.title !== undefined) canvas.title = input.title;
  if (input.shapes !== undefined) canvas.shapes = input.shapes;
  if (input.viewport !== undefined) canvas.viewport = input.viewport;

  await canvas.save();
  return toCanvasResponse(canvas);
}

export async function deleteCanvas(canvasId: string, userId: string) {
  const canvas = await getOwnedCanvas(canvasId, userId);
  await canvas.deleteOne();
  return { id: canvasId };
}
