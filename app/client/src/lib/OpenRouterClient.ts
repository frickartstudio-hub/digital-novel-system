import { ApiKeyManager } from './ApiKeyManager';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
export const GEMINI_TTS_DEFAULT_MODEL = 'gemini-2.5-pro-preview-tts';

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function convertLinear16ToWavBase64(
  pcmBase64: string,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16,
): string {
  const pcmBytes = base64ToUint8Array(pcmBase64);
  const headerSize = 44;
  const wavBuffer = new ArrayBuffer(headerSize + pcmBytes.length);
  const view = new DataView(wavBuffer);
  let offset = 0;

  const writeString = (value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset, value.charCodeAt(i));
      offset += 1;
    }
  };

  const writeUint32 = (value: number) => {
    view.setUint32(offset, value, true);
    offset += 4;
  };

  const writeUint16 = (value: number) => {
    view.setUint16(offset, value, true);
    offset += 2;
  };

  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;

  writeString('RIFF');
  writeUint32(36 + pcmBytes.length);
  writeString('WAVE');

  writeString('fmt ');
  writeUint32(16);
  writeUint16(1);
  writeUint16(numChannels);
  writeUint32(sampleRate);
  writeUint32(byteRate);
  writeUint16(blockAlign);
  writeUint16(bitsPerSample);

  writeString('data');
  writeUint32(pcmBytes.length);

  new Uint8Array(wavBuffer, headerSize).set(pcmBytes);

  return arrayBufferToBase64(wavBuffer);
}

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
      throw new Error('Gemini APIキーが設定されてぁE��せん');
    }

    const endpoint = `${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;

    const generationConfig: Record<string, any> = {
      responseModalities: ['AUDIO'],
      responseMimeType: 'text/plain',
    };

    if (voice) {
      generationConfig.speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice,
          },
        },
      };
    }

    const payload: Record<string, any> = {
      contents: [
        {
          role: 'user',
          parts: [{ text }],
        },
      ],
      generationConfig,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
    const mimeType = audioPart?.inlineData?.mimeType || 'audio/l16';

    if (!audioData) {
      throw new Error('Failed to retrieve audio data from Gemini response');
    }

    const [baseMimeType] = mimeType.split(';');
    const normalizedMime = baseMimeType?.toLowerCase();
    const playableMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/aac'];

    if (normalizedMime && playableMimeTypes.includes(normalizedMime)) {
      return `data:${baseMimeType};base64,${audioData}`;
    }

    const wavBase64 = convertLinear16ToWavBase64(audioData);
    return `data:audio/wav;base64,${wavBase64}`;
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
