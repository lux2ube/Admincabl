import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sourcingRouter from "./sourcing";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sourcingRouter);
router.use(adminRouter);

export default router;
