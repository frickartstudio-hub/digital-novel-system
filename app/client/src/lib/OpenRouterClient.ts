import { ApiKeyManager } from './ApiKeyManager';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_TTS_DEFAULT_MODEL = 'gemini-2.5-pro-preview-tts';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  /**
   * Text generation via OpenRouter chat completions.
   */
  static async chat(
    messages: OpenRouterMessage[],
    model: string = 'anthropic/claude-3.5-sonnet',
    options: {
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<string> {
    const apiKey = ApiKeyManager.get('openrouter');
    if (!apiKey) {
      throw new Error('OpenRouter APIキーが設定されていません');
    }

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Digital Novel System',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Image generation via OpenRouter.
   */
  static async generateImage(
    prompt: string,
    model: string = 'black-forest-labs/flux-schnell-free',
    options: {
      width?: number;
      height?: number;
      steps?: number;
    } = {}
  ): Promise<string> {
    const apiKey = ApiKeyManager.get('openrouter');
    if (!apiKey) {
      throw new Error('OpenRouter APIキーが設定されていません');
    }

    if (model.includes('flux')) {
      const response = await fetch(`${OPENROUTER_API_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Digital Novel System',
        },
        body: JSON.stringify({
          model,
          prompt,
          width: options.width ?? 1024,
          height: options.height ?? 1024,
          steps: options.steps ?? 4,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${error}`);
      }

      const data = await response.json();
      return data.data[0]?.url || '';
    }

    throw new Error('指定したモデルは画像生成に対応していません');
  }

  /**
   * Fetch available models from OpenRouter.
   */
  static async getModels(): Promise<any[]> {
    const apiKey = ApiKeyManager.get('openrouter');
    if (!apiKey) {
      throw new Error('OpenRouter APIキーが設定されていません');
    }

    const response = await fetch(`${OPENROUTER_API_URL}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('モデル一覧の取得に失敗しました');
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Speech generation powered by Gemini 2.5 Pro Preview TTS.
   */
  static async generateSpeech(
    text: string,
    model: string = GEMINI_TTS_DEFAULT_MODEL,
    voice: string = 'studio-male-1'
  ): Promise<string> {
    const geminiKey = ApiKeyManager.get('gemini');
    if (!geminiKey) {
      throw new Error('Gemini APIキーが設定されていません');
    }

    const endpoint = `${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        generationConfig: {
          responseMimeType: 'audio/mp3',
          ...(voice
            ? {
                voiceConfig: {
                  voiceName: voice,
                },
              }
            : {}),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini TTS API error: ${error}`);
    }

    const data = await response.json();
    const audioPart = data?.candidates?.[0]?.content?.parts?.find(
      (part: any) => part?.inlineData?.mimeType?.startsWith('audio/')
    );

    const audioData = audioPart?.inlineData?.data;
    const mimeType = audioPart?.inlineData?.mimeType || 'audio/mp3';

    if (!audioData) {
      throw new Error('音声データを取得できませんでした');
    }

    return `data:${mimeType};base64,${audioData}`;
  }
}

/**
 * Recommended model presets.
 */
export const RECOMMENDED_MODELS = {
  text: {
    'Claude 3.5 Sonnet': 'anthropic/claude-3.5-sonnet',
    'GPT-4 Turbo': 'openai/gpt-4-turbo',
    'GPT-4o': 'openai/gpt-4o',
    'Gemini Pro': 'google/gemini-pro',
    'Minimax M2': 'minimax/minimax-m2',
    'Grok 4 Fast': 'x-ai/grok-4-fast',
    'DeepSeek Chat v3.1': 'deepseek/deepseek-chat-v3.1',
  },
  image: {
    'Flux Schnell (Free)': 'black-forest-labs/flux-schnell-free',
    'Flux Pro': 'black-forest-labs/flux-pro',
    'DALL-E 3': 'openai/dall-e-3',
  },
};

