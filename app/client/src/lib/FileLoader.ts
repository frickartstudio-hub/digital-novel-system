import { getApiAssetUrl } from "./apiClient";

/**
 * ファイルローダー
 * localStorage を利用した過去の実裁E��、サーバ�E配信の両方を扱ぁE��E */
export class FileLoader {
  private static isExternal(path: string) {
    return /^https?:\/\//.test(path);
  }

  private static isUploadedAsset(path: string) {
    return path.startsWith("/uploads/") || path.startsWith("/api/media/");
  }

  /**
   * ファイルパスからソースを取得する
   * 1) サーバー上の URL の場合、そのまま返却
   * 2) localStorage に保存されている場合、Base64 を返却
   * 3) それ以外の場合、パスを返す（後方互換用）
   */
  static getSource(path: string): string {
    if (!path) return "";
    if (this.isExternal(path)) {
      return path;
    }

    if (this.isUploadedAsset(path)) {
      return getApiAssetUrl(path);
    }

    const storedFile = localStorage.getItem(`file_${path}`);
    if (storedFile) {
      return storedFile;
    }

    return path;
  }

  /**
   * ファイルが存在するか判定する、E   */
  static exists(path: string): boolean {
    if (!path) return false;
    if (this.isExternal(path) || this.isUploadedAsset(path)) {
      return true;
    }

    const storedFile = localStorage.getItem(`file_${path}`);
    if (storedFile) {
      return true;
    }

    return true;
  }

  /**
   * localStorage からすべてのファイルを取得、E   */
  static getAllFiles(): { path: string; dataUrl: string }[] {
    const files: { path: string; dataUrl: string }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("file_")) {
        const path = key.replace("file_", "");
        const dataUrl = localStorage.getItem(key);
        if (dataUrl) {
          files.push({ path, dataUrl });
        }
      }
    }

    return files;
  }

  /**
   * localStorage から削除、E   */
  static remove(path: string): void {
    localStorage.removeItem(`file_${path}`);
  }

  /**
   * localStorage 冁E�EアチE�Eロードファイルをすべて削除、E   */
  static clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("file_")) {
        keys.push(key);
      }
    }

    keys.forEach(key => localStorage.removeItem(key));
  }
}

