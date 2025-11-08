import { Router } from "express";
import {
  createScenario,
  getScenario,
  updateScenario,
} from "../controllers/scenarioController";

const router = Router();

router.get("/:slug", getScenario);
router.post("/", createScenario);
router.put("/:slug", updateScenario);

export default router;
