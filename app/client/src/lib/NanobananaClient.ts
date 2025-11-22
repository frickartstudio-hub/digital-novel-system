import { ApiKeyManager } from "./ApiKeyManager";

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_IMAGE_MODEL = "gemini-3-pro-image-preview";
const GENERATE_CONTENT_API = "generateContent";

export interface NanobananaImageOptions {
  model?: string;
  width?: number;
  height?: number;
}

export const NANOBANANA_MODELS: Record<string, string> = {
  "Gemini 3 Pro Image Preview": "gemini-3-pro-image-preview",
  "Gemini 2.5 Flash Image": "gemini-2.5-flash-image",
};

function toImageSize(width?: number, height?: number): string {
  const maxDimension = Math.max(width ?? 1024, height ?? 1024);
  if (maxDimension >= 2048) return "2K";
  if (maxDimension >= 1536) return "1536";
  if (maxDimension >= 1024) return "1K";
  if (maxDimension >= 768) return "768";
  return "512";
}

export class NanobananaClient {
  private static async fileToBase64(
    file: File,
  ): Promise<{ data: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const commaIdx = result.indexOf(",");
        const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
        resolve({ data: base64, mimeType: file.type || "image/png" });
      };
      reader.onerror = () =>
        reject(new Error("Failed to read image file for Gemini API"));
      reader.readAsDataURL(file);
    });
  }

  static async generateImage(
    prompt: string,
    options: NanobananaImageOptions = {},
  ): Promise<string> {
    const apiKey =
      ApiKeyManager.get("nanobanana") || ApiKeyManager.get("gemini");
    if (!apiKey) {
      throw new Error("Gemini APIキーが設定されていません");
    }

    const model = options.model || DEFAULT_IMAGE_MODEL;
    const endpoint = `${GEMINI_API_BASE}/${model}:${GENERATE_CONTENT_API}?key=${encodeURIComponent(
      apiKey,
    )}`;

    const payload: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    };

    // gemini-2.5-flash-image does not support imageSize
    if (model !== "gemini-2.5-flash-image") {
      payload.generationConfig.imageConfig = {
        imageSize: toImageSize(options.width, options.height),
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini image API error: ${errorText || response.statusText}`,
      );
    }

    const data = await response.json();
    const candidates = data?.candidates || [];

    for (const candidate of candidates) {
      const parts = candidate?.content?.parts || [];
      const inlinePart = parts.find(
        (part: any) =>
          part?.inlineData?.mimeType?.startsWith("image/") &&
          part?.inlineData?.data,
      );
      if (inlinePart) {
        const mimeType = inlinePart.inlineData.mimeType || "image/png";
        const base64 = inlinePart.inlineData.data;
        return `data:${mimeType};base64,${base64}`;
      }
    }

    throw new Error("Gemini APIから画像データを取得できませんでした");
  }

  static async editImageWithPrompt(imageFile: File, prompt: string) {
    if (!prompt.trim()) {
      throw new Error("プロンプトを入力してください");
    }

    const apiKey =
      ApiKeyManager.get("nanobanana") || ApiKeyManager.get("gemini");
    if (!apiKey) {
      throw new Error("Gemini APIキーが設定されていません");
    }

    const model = DEFAULT_IMAGE_MODEL;
    const endpoint = `${GEMINI_API_BASE}/${model}:${GENERATE_CONTENT_API}?key=${encodeURIComponent(
      apiKey,
    )}`;

    const { data, mimeType } = await this.fileToBase64(imageFile);

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini image edit API error: ${errorText || response.statusText}`,
      );
    }

    const dataResponse = await response.json();
    const imagePart =
      dataResponse?.candidates?.[0]?.content?.parts?.find(
        (part: any) => part?.inlineData?.data,
      );

    if (imagePart?.inlineData?.data) {
      const mime = imagePart.inlineData.mimeType || "image/png";
      return `data:${mime};base64,${imagePart.inlineData.data}`;
    }

    throw new Error("Gemini APIから編集済み画像データを取得できませんでした");
  }
}
