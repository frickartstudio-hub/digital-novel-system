import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool } from "../db/pool";
import { slugify } from "../utils/slugify";

const audioSchema = z
  .object({
    voice: z.string().optional(),
    bgm: z.string().optional(),
    se: z.string().optional(),
  })
  .partial();

const subtitleSchema = z.object({
  speaker: z.string().optional(),
  text: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});

const sceneSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(["image", "video"]),
  source: z.string().default(""),
  duration: z.number().int().nonnegative().optional(),
  audio: audioSchema.default({}),
  subtitles: z.array(subtitleSchema).default([]),
  transitions: z
    .object({
      nextSceneId: z.number().int().positive().nullable(),
      effect: z.enum(["fade", "slide", "none"]).optional(),
    })
    .default({
      nextSceneId: null,
      effect: "fade",
    }),
});

export const scenarioSchema = z.object({
  title: z.string(),
  author: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  scenes: z.array(sceneSchema),
  metadata: z
    .object({
      totalScenes: z.number().optional(),
      estimatedDuration: z.number().optional(),
      tags: z.array(z.string()).optional(),
      rating: z.string().optional(),
    })
    .partial()
    .optional(),
});

export type ScenarioData = z.infer<typeof scenarioSchema>;

export interface ScenarioRecord {
  id: string;
  slug: string;
  data: ScenarioData;
}

async function ensureTable() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      title TEXT,
      author TEXT,
      version TEXT,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}

export const scenarioService = {
  async getScenarioBySlug(slug: string): Promise<ScenarioRecord | null> {
    await ensureTable();
    const result = await pool.query(
      `SELECT id, slug, data FROM scenarios WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    if (result.rowCount === 0) return null;
    return result.rows[0];
  },

  async createScenario({
    slug,
    scenario,
  }: {
    slug?: string;
    scenario: ScenarioData;
  }): Promise<ScenarioRecord> {
    await ensureTable();
    const validated = scenarioSchema.parse(scenario);
    const fallbackTitle =
      validated.title || `scenario-${randomUUID().slice(0, 8)}`;
    const finalSlug = slugify(slug ?? fallbackTitle);
    const result = await pool.query(
      `
      INSERT INTO scenarios (slug, title, author, version, data)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (slug)
      DO UPDATE SET title = EXCLUDED.title,
                    author = EXCLUDED.author,
                    version = EXCLUDED.version,
                    data = EXCLUDED.data,
                    updated_at = now()
      RETURNING id, slug, data
      `,
      [
        finalSlug,
        validated.title,
        validated.author ?? null,
        validated.version ?? null,
        JSON.stringify(validated),
      ],
    );

    return result.rows[0];
  },

  async updateScenario({
    slug,
    scenario,
  }: {
    slug: string;
    scenario: ScenarioData;
  }): Promise<ScenarioRecord> {
    await ensureTable();
    const validated = scenarioSchema.parse(scenario);
    const result = await pool.query(
      `
      UPDATE scenarios
      SET title = $2,
          author = $3,
          version = $4,
          data = $5,
          updated_at = now()
      WHERE slug = $1
      RETURNING id, slug, data
      `,
      [
        slug,
        validated.title,
        validated.author ?? null,
        validated.version ?? null,
        JSON.stringify(validated),
      ],
    );

    if (result.rowCount === 0) {
      throw new Error(`Scenario with slug "${slug}" not found`);
    }

    return result.rows[0];
  },
};
