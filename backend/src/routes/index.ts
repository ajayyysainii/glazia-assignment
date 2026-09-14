import { Router } from "express";
import { HttpStatus } from "../constants/httpStatus.js";
import authRouter from "../modules/auth/auth.routes.js";
import canvasRouter from "../modules/canvas/canvas.routes.js";
import { sendSuccess } from "../utils/apiResponse.js";

const router = Router();

router.get("/health", (_req, res) => {
  sendSuccess(res, HttpStatus.OK, { message: "OK" });
});

router.use("/auth", authRouter);
router.use("/canvases", canvasRouter);

export default router;
