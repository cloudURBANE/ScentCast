import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scentRouter from "./scent";
import authRouter from "./auth";
import oauthRouter from "./oauth";
import wardrobeRouter from "./wardrobe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scentRouter);
router.use(authRouter);
router.use(oauthRouter);
router.use(wardrobeRouter);

export default router;
