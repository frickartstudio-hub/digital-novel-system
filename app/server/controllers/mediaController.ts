import type { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../middleware/errorHandler";
import { mediaService } from "../services/mediaService";

const uploadSchema = z.object({
  mediaType: z.enum(["image", "video", "audio"]),
  scenarioId: z.string().uuid().optional(),
  sceneId: z.string().uuid().optional(),
});

export async function uploadMedia(req: Request, res: Response) {
  if (!req.file) {
    throw new HttpError(400, "File is required");
  }

  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid payload", parsed.error.flatten());
  }

  const result = await mediaService.saveMedia({
    file: req.file,
    ...parsed.data,
  });

  res.status(201).json({
    data: result,
  });
}

export async function serveMedia(req: Request, res: Response) {
  const { id } = req.params;

  if (!id) {
    throw new HttpError(400, "Media ID is required");
  }

  const media = await mediaService.getMedia(id);

  if (!media) {
    throw new HttpError(404, "Media not found");
  }

  res.setHeader("Content-Type", media.mimeType);
  res.setHeader("Cache-Control", "public, max-age=31536000");
  res.send(media.data);
}
