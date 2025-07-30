import { test, expect } from "bun:test";
import { existsSync, rmSync } from "fs";
import path from "path";
import { hfdownload } from "./index";

test("hfdownload downloads split files", async () => {
  const dataset = "deepvk/NonverbalTTS";
  const split = "train";
  
  // Clean up datasets directory before test
  const datasetsDir = "datasets";
  if (existsSync(datasetsDir)) {
    rmSync(datasetsDir, { recursive: true, force: true });
  }
  
  // Download the dataset
  const result = await hfdownload({ dataset, split });
  
  // Verify the result is returned
  expect(result).toBeDefined();
  
  // Verify expected parquet files exist (train_0 through train_5)
  const baseDir = path.join("datasets", "deepvk", "NonverbalTTS", "train");
  for (let i = 0; i <= 5; i++) {
    const filePath = path.join(baseDir, `train_${i}.parquet`);
    expect(existsSync(filePath)).toBe(true);
  }
}, { timeout: 60_000 });