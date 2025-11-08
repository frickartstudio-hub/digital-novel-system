import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";
import { scenarioService } from "../services/scenarioService";
import { env } from "../config/env";
import { initDb } from "../db/pool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDefaultScenario() {
  try {
    // データベース接続を初期化
    await initDb();
    console.log("[seed] Database connection initialized");

    // scenario.json ファイルを読み込み
    const scenarioPath = path.resolve(__dirname, "../../client/public/scenario.json");
    console.log("[seed] Loading scenario from:", scenarioPath);
    
    const scenarioData = await readFile(scenarioPath, "utf-8");
    const scenario = JSON.parse(scenarioData);
    console.log("[seed] Scenario data loaded successfully");

    // デフォルトシナリオを作成
    console.log("[seed] Creating default scenario...");
    const result = await scenarioService.createScenario({
      slug: "default",
      scenario
    });

    console.log("[seed] Default scenario created successfully:", result);
    process.exit(0);
  } catch (error) {
    console.error("[seed] Failed to create default scenario:", error);
    process.exit(1);
  }
}

seedDefaultScenario();