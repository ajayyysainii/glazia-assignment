import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import * as authController from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.post("/logout-all", authenticate, authController.logoutAll);
authRouter.get("/me", authenticate, authController.me);

export default authRouter;
