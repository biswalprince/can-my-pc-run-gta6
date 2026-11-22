import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const outputDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../src/data");
const fpshqUrl = "https://fpshq.com/data/game-fps-medians.json";
const fpshqGpuRankingUrl = "https://fpshq.com/data/gpu-rating.json";
const fpshqCpuRankingUrl = "https://fpshq.com/data/cpu-rating.json";
const openGpuBenchmarksUrl = "https://opengpubenchmarks.com/api/v1/official.json";
const proxyGameIds = new Set(["cyberpunk_2077_benchmark", "helldivers_2"]);

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error("Failed to fetch " + url + ": HTTP " + response.status);
  }
  return response.json();
}

const [fpshq, fpshqGpuRanking, fpshqCpuRanking, openGpuBenchmarks] = await Promise.all([
  fetchJson(fpshqUrl),
  fetchJson(fpshqGpuRankingUrl),
  fetchJson(fpshqCpuRankingUrl),
  fetchJson(openGpuBenchmarksUrl),
]);

if (!Array.isArray(fpshq.rows) || fpshq.meta?.license !== "CC BY 4.0" || fpshq.rows.length !== fpshq.meta.rows) {
  throw new Error("Unexpected FPSHQ dataset format or license.");
}

for (const ranking of [fpshqGpuRanking, fpshqCpuRanking]) {
  if (!Array.isArray(ranking.rows) || ranking.meta?.license !== "CC BY 4.0" || ranking.rows.length !== ranking.meta.rows) {
    throw new Error("Unexpected FPSHQ hardware ranking format or license.");
  }
}

if (!Array.isArray(openGpuBenchmarks.records) || openGpuBenchmarks._license?.name !== "CC-BY-4.0") {
  throw new Error("Unexpected Open GPU Benchmarks dataset format or license.");
}

const proxyRecords = openGpuBenchmarks.records.filter((record) =>
  proxyGameIds.has(record.game_id) && record.frame_generation === false,
);

if (proxyRecords.length === 0) {
  throw new Error("The benchmark source returned no supported proxy game records.");
}

const openGpuSnapshot = {
  source: "Open GPU Benchmarks",
  sourceUrl: openGpuBenchmarksUrl,
  license: openGpuBenchmarks._license.name,
  licenseUrl: openGpuBenchmarks._license.url,
  attribution: openGpuBenchmarks._license.attribution,
  attributionUrl: openGpuBenchmarks._license.attribution_url,
  retrievedAt: new Date().toISOString(),
  sourceRecordCount: openGpuBenchmarks.records.length,
  includedGames: [...proxyGameIds],
  records: proxyRecords,
};

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(
    resolve(outputDirectory, "fpshq-game-fps-medians.json"),
    JSON.stringify(fpshq, null, 2) + "\n",
    "utf8",
  ),
  writeFile(
    resolve(outputDirectory, "fpshq-gpu-ranking.json"),
    JSON.stringify(fpshqGpuRanking, null, 2) + "\n",
    "utf8",
  ),
  writeFile(
    resolve(outputDirectory, "fpshq-cpu-ranking.json"),
    JSON.stringify(fpshqCpuRanking, null, 2) + "\n",
    "utf8",
  ),
  writeFile(
    resolve(outputDirectory, "open-gpu-benchmarks.json"),
    JSON.stringify(openGpuSnapshot, null, 2) + "\n",
    "utf8",
  ),
]);

console.log(
  "Wrote " + fpshq.rows.length + " FPSHQ aggregate rows, " +
    fpshqGpuRanking.rows.length + " GPU scores, " +
    fpshqCpuRanking.rows.length + " CPU scores, and " +
    proxyRecords.length + " Open GPU Benchmarks runs.",
);
