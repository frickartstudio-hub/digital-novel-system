/**
 * ファイルローダー
 * localStorageに保存されたファイルを読み込む
 */
export class FileLoader {
  /**
   * ファイルパスからソースを取得
   * localStorageに保存されている場合はそれを返し、なければ通常のパスを返す
   */
  static getSource(path: string): string {
    if (!path) return '';

    // localStorageから読み込みを試みる
    const storedFile = localStorage.getItem(`file_${path}`);
    if (storedFile) {
      return storedFile;
    }

    // 通常のパスを返す
    return path;
  }

  /**
   * ファイルが存在するかチェック
   */
  static exists(path: string): boolean {
    if (!path) return false;

    // localStorageにあるかチェック
    const storedFile = localStorage.getItem(`file_${path}`);
    if (storedFile) {
      return true;
    }

    // 通常のパスの場合はtrueを返す（実際の存在チェックはできない）
    return true;
  }

  /**
   * すべてのアップロードファイルを取得
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
   * ファイルを削除
   */
  static remove(path: string): void {
    localStorage.removeItem(`file_${path}`);
  }

  /**
   * すべてのアップロードファイルを削除
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
