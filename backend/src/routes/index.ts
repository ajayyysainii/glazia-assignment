import { Router } from "express";
import authRouter from "../modules/auth/auth.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "OK" });
});

router.use("/auth", authRouter);

export default router;
