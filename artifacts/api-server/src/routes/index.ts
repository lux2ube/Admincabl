import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sourcingRouter from "./sourcing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sourcingRouter);

export default router;
