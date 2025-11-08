export type MediaType = "image" | "video" | "audio";

export interface UploadMediaPayload {
  file: File;
  mediaType: MediaType;
  scenarioId?: string;
  sceneId?: string;
}

export interface UploadMediaResponse {
  mediaId: string;
  mediaUrl: string;
  mimeType: string;
  size: number;
}
