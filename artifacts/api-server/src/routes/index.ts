import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scentRouter from "./scent";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scentRouter);

export default router;
