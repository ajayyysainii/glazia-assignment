import { apiRequest } from "@/lib/api/client";
import type { CanvasDocument, CanvasSnapshot, CanvasSummary } from "./types";

export async function listCanvases() {
  const data = await apiRequest<{ canvases: CanvasSummary[] }>("/canvases", {
    method: "GET",
    auth: true,
  });
  return data.canvases;
}

export async function getCanvas(id: string) {
  const data = await apiRequest<{ canvas: CanvasDocument }>(`/canvases/${id}`, {
    method: "GET",
    auth: true,
  });
  return data.canvas;
}

export async function createCanvas(input: CanvasSnapshot & { title?: string }) {
  const data = await apiRequest<{ canvas: CanvasDocument }>("/canvases", {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      title: input.title ?? "Untitled canvas",
      shapes: input.shapes,
      viewport: input.viewport,
    }),
  });
  return data.canvas;
}

export async function updateCanvas(
  id: string,
  input: Partial<CanvasSnapshot> & { title?: string },
) {
  const data = await apiRequest<{ canvas: CanvasDocument }>(`/canvases/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(input),
  });
  return data.canvas;
}

export async function deleteCanvas(id: string) {
  return apiRequest<{ id: string }>(`/canvases/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
