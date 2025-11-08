import type { ScenarioData } from "@/types/novel";
import { apiFetch } from "./apiClient";

export interface ScenarioRecord {
  id: string;
  slug: string;
  data: ScenarioData;
}

export async function fetchScenario(
  slug: string,
): Promise<ScenarioRecord> {
  const response = await apiFetch<{ data: ScenarioRecord }>(
    `/api/scenarios/${slug}`,
  );
  return response.data;
}

export async function saveScenario(
  slug: string,
  scenario: ScenarioData,
): Promise<ScenarioRecord> {
  const response = await apiFetch<{ data: ScenarioRecord }>(
    `/api/scenarios/${slug}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scenario }),
    },
  );
  return response.data;
}

export async function createScenario(
  scenario: ScenarioData,
  slug?: string,
): Promise<ScenarioRecord> {
  const response = await apiFetch<{ data: ScenarioRecord }>(`/api/scenarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ slug, scenario }),
  });
  return response.data;
}
