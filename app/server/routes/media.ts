import { Router } from "express";
import { upload } from "../middleware/upload";
import { uploadMedia, serveMedia } from "../controllers/mediaController";

const router = Router();

router.post("/", upload.single("file"), uploadMedia);
router.get("/:id", serveMedia);

export default router;
