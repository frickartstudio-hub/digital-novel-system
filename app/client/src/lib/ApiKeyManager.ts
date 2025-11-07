/**
 * APIキー管理
 * localStorageにAPIキーを安全に保存・取得
 */

const STORAGE_KEY = 'novel_api_keys';

export interface ApiKeys {
  openrouter?: string;
  gemini?: string;
}

/**
 * 簡易的な暗号化（Base64エンコード）
 * 注意: これは完全な暗号化ではなく、難読化です
 */
function encode(text: string): string {
  return btoa(encodeURIComponent(text));
}

/**
 * 簡易的な復号化（Base64デコード）
 */
function decode(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return '';
  }
}

export class ApiKeyManager {
  /**
   * APIキーを保存
   */
  static save(keys: ApiKeys): void {
    const encoded = encode(JSON.stringify(keys));
    localStorage.setItem(STORAGE_KEY, encoded);
  }

  /**
   * APIキーを取得
   */
  static load(): ApiKeys {
    const encoded = localStorage.getItem(STORAGE_KEY);
    if (!encoded) return {};

    try {
      const decoded = decode(encoded);
      return JSON.parse(decoded);
    } catch {
      return {};
    }
  }

  /**
   * 特定のAPIキーを取得
   */
  static get(service: keyof ApiKeys): string | undefined {
    const keys = this.load();
    return keys[service];
  }

  /**
   * 特定のAPIキーを設定
   */
  static set(service: keyof ApiKeys, key: string): void {
    const keys = this.load();
    keys[service] = key;
    this.save(keys);
  }

  /**
   * APIキーを削除
   */
  static remove(service: keyof ApiKeys): void {
    const keys = this.load();
    delete keys[service];
    this.save(keys);
  }

  /**
   * すべてのAPIキーを削除
   */
  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * APIキーが設定されているかチェック
   */
  static has(service: keyof ApiKeys): boolean {
    const key = this.get(service);
    return !!key && key.length > 0;
  }
}
