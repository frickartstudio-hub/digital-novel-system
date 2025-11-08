import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { Express } from "express";
import { env } from "../config/env";
import { pool } from "../db/pool";

type MulterFile = Express.Multer.File;

const uploadsDir = env.UPLOAD_DIR;

async function ensureUploadDir() {
  await fs.mkdir(uploadsDir, { recursive: true });
}

function getExtension(file: MulterFile) {
  const ext = path.extname(file.originalname);
  if (ext) return ext;
  switch (file.mimetype) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "audio/mpeg":
      return ".mp3";
    case "audio/wav":
      return ".wav";
    case "video/mp4":
      return ".mp4";
    default:
      return "";
  }
}

export const mediaService = {
  async saveMedia({
    file,
    scenarioId,
    sceneId,
    mediaType,
  }: {
    file: MulterFile;
    scenarioId?: string;
    sceneId?: string;
    mediaType: "image" | "video" | "audio";
  }) {
    await ensureUploadDir();

    const id = randomUUID();
    const extension = getExtension(file);
    const fileName = `${id}${extension}`;
    const absolutePath = path.join(uploadsDir, fileName);

    await fs.writeFile(absolutePath, file.buffer);

    const storageUrl = `/uploads/${fileName}`;

    try {
      await pool.query(
        `
        INSERT INTO media_assets (id, scenario_id, scene_id, media_type, storage_url, storage_key, mime_type, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          id,
          scenarioId ?? null,
          sceneId ?? null,
          mediaType,
          storageUrl,
          fileName,
          file.mimetype,
          JSON.stringify({
            originalName: file.originalname,
            size: file.size,
          }),
        ],
      );
    } catch (error) {
      console.warn(
        "[mediaService] Failed to persist metadata in DB. Ensure migrations are applied.",
        error,
      );
    }

    return {
      mediaId: id,
      mediaUrl: storageUrl,
      mimeType: file.mimetype,
      size: file.size,
    };
  },
};
