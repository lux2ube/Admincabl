import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const indexPath = resolve(process.cwd(), "..", "api-zod", "src", "index.ts");
const source = await readFile(indexPath, "utf8");
const normalized = source
  .split(/\r?\n/)
  .filter((line) => line.trim() !== "export * from './generated/types';")
  .join("\n")
  .replace(/\n{3,}/g, "\n\n");

if (normalized !== source) {
  await writeFile(indexPath, normalized);
}