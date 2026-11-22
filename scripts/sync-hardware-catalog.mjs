import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const apiBase = "https://gettechapi.github.io/TechAPI";
const categories = ["cpus", "gpus"];

async function fetchCatalog(category) {
  const response = await fetch(apiBase + "/v1/" + category + "/index.json");
  if (!response.ok) {
    throw new Error("Failed to fetch " + category + ": HTTP " + response.status);
  }

  const payload = await response.json();
  if (!Array.isArray(payload.results) || typeof payload.count !== "number") {
    throw new Error("Unexpected " + category + " catalog response.");
  }

  if (payload.results.length !== payload.count) {
    throw new Error(
      category + " count mismatch: expected " + payload.count + ", received " + payload.results.length,
    );
  }

  return payload.results.map((record) => {
    if (typeof record.name !== "string" || typeof record.slug !== "string") {
      throw new Error("Invalid record in " + category + ".");
    }

    return {
      name: record.name.trim(),
      slug: record.slug,
      sourceUrl: new URL(record.url, apiBase).toString(),
    };
  });
}

const [cpus, gpus] = await Promise.all(categories.map(fetchCatalog));
const outputPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/hardware-catalog.json",
);
const catalog = {
  source: "TechAPI",
  sourceUrl: apiBase,
  license: "CC-BY-SA-4.0",
  retrievedAt: new Date().toISOString(),
  counts: { cpus: cpus.length, gpus: gpus.length },
  cpus,
  gpus,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
console.log("Wrote " + cpus.length + " CPUs and " + gpus.length + " GPUs to " + outputPath);
