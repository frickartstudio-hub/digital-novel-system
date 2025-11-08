import { Router } from "express";
import { upload } from "../middleware/upload";
import { uploadMedia } from "../controllers/mediaController";

const router = Router();

router.post("/", upload.single("file"), uploadMedia);

export default router;
