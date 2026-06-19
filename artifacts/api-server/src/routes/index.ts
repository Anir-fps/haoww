import { Router, type IRouter } from "express";
import healthRouter from "./health";
import promptsRouter from "./prompts";
import categoriesRouter from "./categories";
import usersRouter from "./users";
import enhanceRouter from "./enhance";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/prompts", promptsRouter);
router.use("/categories", categoriesRouter);
router.use("/users", usersRouter);
router.use("/enhance", enhanceRouter);
router.use("/stats", statsRouter);

export default router;
