import type { SaveData, SaveSlot } from '@/types/novel';

/**
 * セーブマネージャー
 * 進行状況の保存と読み込みを管理
 */
export class SaveManager {
  private readonly STORAGE_KEY = 'digital_novel_saves';
  private readonly MAX_SLOTS = 5;

  /**
   * データを保存
   */
  save(slotId: number, data: SaveData): void {
    if (slotId < 1 || slotId > this.MAX_SLOTS) {
      throw new Error(`Invalid slot ID: ${slotId}`);
    }

    const saves = this.getAllSaves();
    saves[`slot${slotId}`] = data;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
      console.log(`Saved to slot ${slotId}`);
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    }
  }

  /**
   * データを読み込む
   */
  load(slotId: number): SaveData | null {
    if (slotId < 1 || slotId > this.MAX_SLOTS) {
      throw new Error(`Invalid slot ID: ${slotId}`);
    }

    const saves = this.getAllSaves();
    return saves[`slot${slotId}`] || null;
  }

  /**
   * セーブデータを削除
   */
  deleteSave(slotId: number): void {
    if (slotId < 1 || slotId > this.MAX_SLOTS) {
      throw new Error(`Invalid slot ID: ${slotId}`);
    }

    const saves = this.getAllSaves();
    delete saves[`slot${slotId}`];
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
    console.log(`Deleted slot ${slotId}`);
  }

  /**
   * すべてのセーブデータを取得
   */
  getAllSaves(): Record<string, SaveData> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load saves:', error);
      return {};
    }
  }

  /**
   * セーブスロットのリストを取得
   */
  getSaveList(): SaveSlot[] {
    const saves = this.getAllSaves();
    const list: SaveSlot[] = [];

    for (let i = 1; i <= this.MAX_SLOTS; i++) {
      list.push({
        slotId: i,
        data: saves[`slot${i}`] || null
      });
    }

    return list;
  }
}
