import type { UploadMediaPayload, UploadMediaResponse } from "@/types/media";
import { buildApiUrl } from "./apiClient";

export async function uploadMedia(
  payload: UploadMediaPayload,
): Promise<UploadMediaResponse> {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("mediaType", payload.mediaType);
  if (payload.scenarioId) {
    formData.append("scenarioId", payload.scenarioId);
  }
  if (payload.sceneId) {
    formData.append("sceneId", payload.sceneId);
  }

  const response = await fetch(buildApiUrl("/api/media"), {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Media upload failed (${response.status}): ${
        body || response.statusText
      }`,
    );
  }

  const data = (await response.json()) as { data: UploadMediaResponse };
  return data.data;
}
