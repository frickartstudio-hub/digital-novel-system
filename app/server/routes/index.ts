import { Router } from "express";
import healthRouter from "./health";
import mediaRouter from "./media";
import scenarioRouter from "./scenarios";

const router = Router();

router.use("/health", healthRouter);
router.use("/media", mediaRouter);
router.use("/scenarios", scenarioRouter);

export default router;
