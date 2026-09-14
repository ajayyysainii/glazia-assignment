import bcrypt from "bcryptjs";
import mongoose, { type Document, type Model, Schema } from "mongoose";

export type UserDocument = Document & {
  name: string;
  email: string;
  password: string;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(
  candidate: string,
) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform(_doc, ret) {
    const { password: _password, __v, ...rest } = ret;
    return rest;
  },
});

export const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>("User", userSchema);
