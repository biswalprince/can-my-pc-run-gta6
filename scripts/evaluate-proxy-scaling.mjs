import { readFile } from "node:fs/promises";

const datasetPath = new URL("../src/data/fpshq-game-fps-medians.json", import.meta.url);
const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
const proxyGames = new Set([
  "Cyberpunk 2077",
  "Kingdom Come: Deliverance II",
  "STALKER 2: Heart of Chornobyl",
  "The Witcher 3: Wild Hunt",
]);
const exponents = [0, 0.25, 0.5, 0.65, 0.75, 1];
const rows = dataset.rows.filter((row) =>
  proxyGames.has(row.game) &&
  ["1080p", "1440p", "4K"].includes(row.resolution) &&
  ["medium", "high", "ultra"].includes(row.preset) &&
  row.fps_median > 0 &&
  row.gpu_score_median > 0,
);

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

console.log("Leave-one-game-out check of GPU-score scaling on proxy summaries");
console.log("Each held-out title is predicted from the other titles at the same resolution and preset.");
console.log("This checks transfer between proxy games; it is not GTA 6 validation.");

for (const exponent of exponents) {
  const percentageErrors = [];

  for (const target of rows) {
    const peers = rows.filter((row) =>
      row.game !== target.game &&
      row.resolution === target.resolution &&
      row.preset === target.preset,
    );
    if (peers.length < 2) continue;

    const predictions = peers.map((row) =>
      row.fps_median * Math.pow(target.gpu_score_median / row.gpu_score_median, exponent),
    );
    const estimate = median(predictions);
    percentageErrors.push(Math.abs(estimate - target.fps_median) / target.fps_median);
  }

  const meanError = percentageErrors.reduce((sum, error) => sum + error, 0) / percentageErrors.length;
  const medianError = median(percentageErrors);
  console.log(
    `exponent ${exponent.toFixed(2)} | cases ${percentageErrors.length} | ` +
    `mean absolute percentage error ${(meanError * 100).toFixed(1)}% | ` +
    `median absolute percentage error ${(medianError * 100).toFixed(1)}%`,
  );
}
