import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../middleware/errorHandler";
import {
  scenarioSchema,
  scenarioService,
} from "../services/scenarioService";

const createSchema = z.object({
  slug: z.string().min(1).optional(),
  scenario: scenarioSchema,
});

const updateSchema = z.object({
  scenario: scenarioSchema,
});

export async function getScenario(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const slug = req.params.slug;
    const record = await scenarioService.getScenarioBySlug(slug);
    if (!record) {
      throw new HttpError(404, `Scenario "${slug}" not found`);
    }
    res.json({ data: record });
  } catch (error) {
    next(error);
  }
}

export async function createScenario(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        "Invalid scenario payload",
        parsed.error.flatten(),
      );
    }

    const record = await scenarioService.createScenario(parsed.data);
    res.status(201).json({ data: record });
  } catch (error) {
    next(error);
  }
}

export async function updateScenario(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const slug = req.params.slug;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        "Invalid scenario payload",
        parsed.error.flatten(),
      );
    }

    const record = await scenarioService.updateScenario({
      slug,
      scenario: parsed.data.scenario,
    });
    res.json({ data: record });
  } catch (error) {
    if (error instanceof Error && /not found/.test(error.message)) {
      next(new HttpError(404, error.message));
      return;
    }
    next(error);
  }
}
