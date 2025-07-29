#!/usr/bin/env bun
import { Command } from "commander";
import { hfdownload } from ".";
import chalk from "chalk";

const program = new Command();

program
  .name(chalk.bold.blue("hfdownload"))
  .description(chalk.dim("Download datasets from Hugging Face. Saved to datasets/."))
  .version("1.0.0")
  .argument("<dataset>", chalk.dim("Dataset name (e.g., MathArena/aime_2025)"))
  .argument("[split]", chalk.dim("Dataset split"), "train")
  .argument("[config]", chalk.dim("Dataset configuration"), "default")
  .action(async (dataset, split, config) => {
    try {
      console.log(chalk.dim(`Dataset: ${chalk.white(dataset)}`));
      console.log(chalk.dim(`Split: ${chalk.white(split)}`));
      console.log(chalk.dim(`Config: ${chalk.white(config)}`));
      console.log();
      
      await hfdownload({ dataset, split, config, downloadOnly: true });
      
      console.log();
    } catch (error) {
      console.log();
      console.log(chalk.red.bold("❌ Download failed:"));
      console.log(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();