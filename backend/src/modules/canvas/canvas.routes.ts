import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import * as canvasController from "./canvas.controller.js";

const canvasRouter = Router();

canvasRouter.use(authenticate);

canvasRouter.post("/", canvasController.create);
canvasRouter.get("/", canvasController.list);
canvasRouter.get("/:id", canvasController.getById);
canvasRouter.put("/:id", canvasController.update);
canvasRouter.delete("/:id", canvasController.remove);

export default canvasRouter;
