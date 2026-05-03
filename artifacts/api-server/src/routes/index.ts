import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scentRouter from "./scent";
import authRouter from "./auth";
import wardrobeRouter from "./wardrobe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scentRouter);
router.use(authRouter);
router.use(wardrobeRouter);

export default router;
