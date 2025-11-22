import { randomUUID } from "node:crypto";
import type { Express } from "express";
import { pool } from "../db/pool";

type MulterFile = Express.Multer.File;

function getExtension(file: MulterFile) {
  const ext = file.originalname.split(".").pop();
  if (ext) return `.${ext}`;
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

async function ensureTable() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      scenario_id UUID,
      scene_id UUID,
      media_type TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      data BYTEA NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
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
    await ensureTable();

    const id = randomUUID();
    const extension = getExtension(file);
    const storageUrl = `/api/media/${id}`;

    await pool.query(
      `
      INSERT INTO media_assets (id, scenario_id, scene_id, media_type, mime_type, data, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        id,
        scenarioId ?? null,
        sceneId ?? null,
        mediaType,
        file.mimetype,
        file.buffer,
        JSON.stringify({
          originalName: file.originalname,
          size: file.size,
          extension,
        }),
      ],
    );

    return {
      mediaId: id,
      mediaUrl: storageUrl,
      mimeType: file.mimetype,
      size: file.size,
    };
  },

  async getMedia(id: string): Promise<{ data: Buffer; mimeType: string } | null> {
    await ensureTable();
    const result = await pool.query(
      `SELECT data, mime_type FROM media_assets WHERE id = $1 LIMIT 1`,
      [id],
    );
    if (result.rowCount === 0) return null;
    return {
      data: result.rows[0].data,
      mimeType: result.rows[0].mime_type,
    };
  },
};
