import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.DB_URI);
  console.log("MongoDB connected");
}
