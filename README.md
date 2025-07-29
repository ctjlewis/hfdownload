# hfdownload

A simplistic TypeScript version of Hugging Face's `hf_download` for Python. 

Downloads Hugging Face datasets as Parquet files and loads them into DuckDB
using [hive partitioning](https://duckdb.org/docs/stable/data/partitioning/hive_partitioning.html).

- Parquet files are stored in `datasets/{org}/{name}/{split}`. 
- Returns a DuckDB table ready for querying.

## Installation

```shell
bun i -g hfdownload
```

## Usage

#### TypeScript
```typescript
import { hfdownload } from "hfdownload";

const table = await hfdownload({ dataset: "MathArena/aime_2025" })
const rows = table.getRowObjects()

console.table(rows.at(0))
/**
┌──────────────┬─────────────────────┬──────────────────────────────────────────────────────────────────────────────────┐
│              │ items               │ Values                                                                           │
├──────────────┼─────────────────────┼──────────────────────────────────────────────────────────────────────────────────┤
│  problem_idx │                     │ 1n                                                                               │
│      problem │                     │ Find the sum of all integer bases $b>9$ for which $17_b$ is a divisor of $97_b.$ │
│       answer │                     │ 70n                                                                              │
│ problem_type │ [ "Number Theory" ] │                                                                                  │
└──────────────┴─────────────────────┴──────────────────────────────────────────────────────────────────────────────────┘
*/
```

#### CLI
```shell
hfdownload MathArena/aime_2025
```

### Parameters

- `dataset`: Hugging Face dataset name (`org/dataset`)
- `split?`: Dataset split (default: `"train"`)  
- `config?`: Dataset config/subset (default: `"default"`)

### Module

This is published as a pure TypeScript module without bundling. Use Bun for the
easiest experience. On Node, you will need to bundle this package yourself. 