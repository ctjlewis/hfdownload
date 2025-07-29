import path from "path";
import ora from "ora";
import chalk from "chalk";
import { mkdirSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { DuckDBInstance } from "@duckdb/node-api";

interface HfdownloadArgs {
  /**
   * The Hugging Face dataset name in the format `org/dataset`.
   */
  dataset: string;
  /**
   * The split of the dataset to download, e.g. `train`, `test`, `validation`.
   */
  split?: string;
  /**
   * The dataset config or subset.
   */
  config?: string;
  /**
   * Whether to only download files without loading them into DuckDB.
   */
  downloadOnly?: boolean;
}

export async function hfdownload({
  dataset,
  split = "train",
  config = "default",
  downloadOnly = false,
}: HfdownloadArgs) {
  const spinner = ora().start(chalk.dim(`Preparing ${dataset}:${split}`));

  try {
    /** Local paths. */
    spinner.text = chalk.dim("Checking dataset name…");
    const [org, name] = dataset.split("/");
    if (!org || !name) {
      throw new Error(`Invalid dataset name: ${dataset}`);
    }

    const baseDir = path.join("datasets", org, name, split);
    mkdirSync(baseDir, { recursive: true });

    /** Discover parquet URLs. */
    spinner.text = chalk.dim("Fetching metadata from Hugging Face…");
    const metadataURL =
      `https://huggingface.co/api/datasets/${dataset}/parquet/${config}/${split}`;

    const metadata = await fetch(metadataURL, { redirect: "follow"});
    if (!metadata.ok) {
      throw new Error(`Parquet lookup failed: ${metadata.status} ${metadata.statusText}`);
    }

    const parquetFiles = await metadata.json() as string[];
    if (parquetFiles.length === 0) {
      throw new Error("No Parquet files returned for this split");
    }

    /** Download uncached files. */
    for (let i = 0; i < parquetFiles.length; i++) {
      const url = parquetFiles[i];
      const filename = parquetFiles.length === 1
        ? `${split}.parquet`
        : `${split}_${i}.parquet`;

      if (!url) {
        throw new Error(`Invalid URL for Parquet file at index ${i}`);
      }

      const filePath = path.join(baseDir, filename);
      if (!existsSync(filePath)) {
        spinner.text = chalk.dim(`Downloading ${filename} (${i + 1}/${parquetFiles.length})…\n${url}`);

        const shell = spawnSync("curl", ["-L", url, "-o", filePath], { stdio: "ignore" });
        if (shell.error) {
          throw new Error(`Failed to download ${filename}: ${shell.error.message}`);
        }
      }
    }

    if (downloadOnly) {
      spinner.succeed(chalk.green(`Downloaded ${parquetFiles.length} files to ${baseDir}`));
      return
    }

    /** Open DuckDB connection to parquet files with hive partitioning. */
    spinner.text = chalk.dim("Creating DuckDB instance...");
    const instance = await DuckDBInstance.create();
    const db = await instance.connect();

    const globPath = `datasets/${org}/${name}/${split}/**/*.parquet`;
    const table = await db.runAndReadAll(
      `SELECT * FROM read_parquet($filepaths, hive_partitioning=true)`,
      { filepaths: globPath },
    );

    spinner.succeed(`Ready – loaded ${dataset}:${split} into DuckDB`);
    return table;
  } catch (err) {
    spinner.fail(chalk.red((err as Error).message));
    throw err;
  }
}