/**
 * ファイルローダー
 * localStorage を利用した過去の実装と、サーバー配信の両方を扱う。
 */
export class FileLoader {
  private static isRemote(path: string) {
    return /^https?:\/\//.test(path) || path.startsWith('/uploads/');
  }

  /**
   * ファイルパスからソースを取得する。
   * 1) サーバー上の URL の場合はそのまま返却。
   * 2) localStorage に保存されている場合は Base64 を返却。
   * 3) それ以外は元のパスを返す（後方互換用）。
   */
  static getSource(path: string): string {
    if (!path) return '';
    if (this.isRemote(path)) {
      return path;
    }

    const storedFile = localStorage.getItem(`file_${path}`);
    if (storedFile) {
      return storedFile;
    }

    return path;
  }

  /**
   * ファイルが存在するか判定する。
   */
  static exists(path: string): boolean {
    if (!path) return false;
    if (this.isRemote(path)) {
      return true;
    }

    const storedFile = localStorage.getItem(`file_${path}`);
    if (storedFile) {
      return true;
    }

    return true;
  }

  /**
   * localStorage からすべてのファイルを取得。
   */
  static getAllFiles(): { path: string; dataUrl: string }[] {
    const files: { path: string; dataUrl: string }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('file_')) {
        const path = key.replace('file_', '');
        const dataUrl = localStorage.getItem(key);
        if (dataUrl) {
          files.push({ path, dataUrl });
        }
      }
    }

    return files;
  }

  /**
   * localStorage から削除。
   */
  static remove(path: string): void {
    localStorage.removeItem(`file_${path}`);
  }

  /**
   * localStorage 内のアップロードファイルをすべて削除。
   */
  static clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('file_')) {
        keys.push(key);
      }
    }

    keys.forEach((key) => localStorage.removeItem(key));
  }
}

