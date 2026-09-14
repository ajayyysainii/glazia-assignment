import mongoose, { type Document, type Model, Schema, Types } from "mongoose";

export type CanvasViewport = {
  x: number;
  y: number;
  scale: number;
};

export type CanvasDocument = Document & {
  owner: Types.ObjectId;
  title: string;
  shapes: unknown[];
  viewport: CanvasViewport;
  createdAt: Date;
  updatedAt: Date;
};

const viewportSchema = new Schema<CanvasViewport>(
  {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    scale: { type: Number, default: 1, min: 0.05, max: 16 },
  },
  { _id: false },
);

const canvasSchema = new Schema<CanvasDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: "Untitled canvas",
    },
    shapes: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    viewport: {
      type: viewportSchema,
      default: () => ({ x: 0, y: 0, scale: 1 }),
    },
  },
  { timestamps: true },
);

canvasSchema.index({ owner: 1, updatedAt: -1 });

canvasSchema.set("toJSON", {
  transform(_doc, ret) {
    const { __v, ...rest } = ret;
    return rest;
  },
});

export const Canvas: Model<CanvasDocument> =
  mongoose.models.Canvas ??
  mongoose.model<CanvasDocument>("Canvas", canvasSchema);
