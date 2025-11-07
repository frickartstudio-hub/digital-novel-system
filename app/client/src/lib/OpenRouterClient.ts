import { ApiKeyManager } from './ApiKeyManager';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

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
   * テキスト生成（チャット）
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
        'Authorization': `Bearer ${apiKey}`,
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
   * 画像生成
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

    // Flux モデルの場合
    if (model.includes('flux')) {
      const response = await fetch(`${OPENROUTER_API_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
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

    throw new Error('サポートされていない画像生成モデルです');
  }

  /**
   * 利用可能なモデル一覧を取得
   */
  static async getModels(): Promise<any[]> {
    const apiKey = ApiKeyManager.get('openrouter');
    if (!apiKey) {
      throw new Error('OpenRouter APIキーが設定されていません');
    }

    const response = await fetch(`${OPENROUTER_API_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('モデル一覧の取得に失敗しました');
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * 音声生成（TTS）
   */
  static async generateSpeech(
    text: string,
    model: string = 'google/gemini-2.0-flash-exp:free',
    voice: string = 'alloy'
  ): Promise<string> {
    const apiKey = ApiKeyManager.get('openrouter');
    if (!apiKey) {
      throw new Error('OpenRouter APIキーが設定されていません');
    }

    // OpenRouter経由でGeminiのTTSを使用
    // 注: OpenRouterのTTS APIは標準的なものと異なる可能性があるため、
    // まずはテキストから音声への変換リクエストを試みます
    const response = await fetch(`${OPENROUTER_API_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Digital Novel System',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter TTS API error: ${error}`);
    }

    // 音声データをBlobとして取得
    const audioBlob = await response.blob();
    
    // BlobをBase64に変換
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }
}

/**
 * 推奨モデル
 */
export const RECOMMENDED_MODELS = {
  text: {
    'Claude 3.5 Sonnet': 'anthropic/claude-3.5-sonnet',
    'GPT-4 Turbo': 'openai/gpt-4-turbo',
    'GPT-4o': 'openai/gpt-4o',
    'Gemini Pro': 'google/gemini-pro',
  },
  image: {
    'Flux Schnell (Free)': 'black-forest-labs/flux-schnell-free',
    'Flux Pro': 'black-forest-labs/flux-pro',
    'DALL-E 3': 'openai/dall-e-3',
  },
};
