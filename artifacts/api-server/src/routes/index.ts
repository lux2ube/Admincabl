import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sourcingRouter from "./sourcing";
import adminAuthRouter from "./admin-auth";
import adminRouter from "./admin";
import storeRouter from "./store";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sourcingRouter);
router.use(storeRouter);
router.use(adminAuthRouter);
router.use(adminRouter);

export default router;
