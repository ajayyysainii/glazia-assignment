import mongoose, { type Document, type Model, Schema, Types } from "mongoose";

export type RefreshTokenDocument = Document & {
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken: Model<RefreshTokenDocument> =
  mongoose.models.RefreshToken ??
  mongoose.model<RefreshTokenDocument>("RefreshToken", refreshTokenSchema);
