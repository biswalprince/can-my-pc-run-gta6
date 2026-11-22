import cpuRanking from "@/data/fpshq-cpu-ranking.json";
import gpuRanking from "@/data/fpshq-gpu-ranking.json";
import gameMedians from "@/data/fpshq-game-fps-medians.json";

type RankingRow = { cpu: string; gaming_score: number; segment: string };
type GpuRow = { gpu: string; bench_score: number; segment: string };
type MedianRow = {
  game: string;
  resolution: string;
  preset: string;
  fps_median: number;
  fps_p25: number;
  fps_p75: number;
  gpu_score_median: number;
  gpus_measured: number;
  measurements: number;
  url: string;
};

const cpus = (cpuRanking as { rows: RankingRow[] }).rows;
const gpus = (gpuRanking as { rows: GpuRow[] }).rows;
const medians = (gameMedians as { rows: MedianRow[] }).rows;

// Keep the proxy set focused on demanding open-world games. GTA V is much
// older and is left out of the estimate rather than treated as current evidence.
const proxyGames = [
  "Cyberpunk 2077",
  "Kingdom Come: Deliverance II",
  "STALKER 2: Heart of Chornobyl",
  "The Witcher 3: Wild Hunt",
];

const qualityPreset: Record<string, string[]> = {
  Low: ["medium", "high"],
  Medium: ["medium", "high"],
  High: ["high", "ultra"],
  Ultra: ["ultra", "high"],
};

export type EstimateInput = {
  gpu: string;
  cpu: string;
  memory: number;
  resolution: "1080p" | "1440p" | "4K";
  quality: "Low" | "Medium" | "High" | "Ultra";
};

export type EstimateResult =
  | {
      status: "estimated";
      low: number;
      high: number;
      confidence: "Very low";
      summary: string;
      assumptions: string[];
      proxyPreset: string;
      evidence: { game: string; fps: number; machines: number; url: string }[];
      hardware: { gpu: string; cpu: string; memory: number; resolution: string; quality: string };
    }
  | { status: "unsupported"; message: string };

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/^(amd|intel|nvidia|ati)\s+/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

function quantile(values: number[], probability: number) {
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const fraction = position - lower;
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

export function estimate(input: EstimateInput): EstimateResult {
  const gpu = gpus.find((row) => !row.segment.toLowerCase().includes("integrated") && normalize(row.gpu) === normalize(input.gpu));
  const cpu = cpus.find((row) => !row.segment.toLowerCase().includes("integrated") && normalize(row.cpu) === normalize(input.cpu));

  if (!gpu || !cpu) {
    const missing = [!gpu && "GPU", !cpu && "CPU"].filter(Boolean).join(" and ");
    return {
      status: "unsupported",
      message: `We don't have a compatible benchmark ranking for this ${missing} yet, so we're withholding an FPS number. Try selecting a catalog model with benchmark data.`,
    };
  }

  const acceptablePresets = qualityPreset[input.quality];
  const candidates = medians.filter((row) =>
    proxyGames.includes(row.game) &&
    row.resolution === input.resolution &&
    acceptablePresets.includes(row.preset) &&
    row.gpu_score_median > 0 &&
    row.fps_median > 0,
  );
  const usedPreset = acceptablePresets.find((preset) => candidates.some((row) => row.preset === preset));
  if (!usedPreset) {
    return {
      status: "unsupported",
      message: "Comparable benchmark coverage is too thin for this resolution and quality combination, so we're withholding an FPS number.",
    };
  }
  const matchingRows = candidates.filter((row) => row.preset === usedPreset);

  if (matchingRows.length < 2) {
    return {
      status: "unsupported",
      message: "Comparable benchmark coverage is too thin for this resolution and quality combination, so we're withholding an FPS number.",
    };
  }

  // Scale each proxy against its own GPU score before combining, since source
  // rows can represent different score levels from title to title. CPU and
  // memory are deliberately excluded from the center until that effect can be
  // calibrated on comparable per-system benchmark records.
  const scaledRows = matchingRows.map((row) => {
    // A sub-linear power avoids assuming that 2x GPU score means 2x FPS.
    // The exponent is a conservative v0 heuristic, not a learned relationship.
    const gpuScale = Math.pow(gpu.bench_score / row.gpu_score_median, 0.65);
    return {
      center: row.fps_median * gpuScale,
      low: row.fps_p25 * gpuScale,
      high: row.fps_p75 * gpuScale,
    };
  });
  const center = quantile(scaledRows.map((row) => row.center), 0.5);

  // Combine each source's within-game percentile spread with between-game
  // variation. The outer multipliers widen further for the unknown target PC
  // build and the unvalidated GPU-score transfer.
  const observedLow = quantile(scaledRows.map((row) => row.low), 0.25);
  const observedHigh = quantile(scaledRows.map((row) => row.high), 0.75);
  const low = Math.max(10, Math.floor(Math.min(center * 0.55, observedLow * 0.75)));
  const high = Math.min(300, Math.ceil(Math.max(center * 1.6, observedHigh * 1.25)));

  const assumptions = [
    "Comparable-game FPS medians are transferred to GTA 6 using GPU ranking scores; this relationship has not been validated on GTA 6.",
    "CPU ranking and memory are shown in your configuration but do not adjust the FPS center yet; we do not have a validated GTA 6 bottleneck or memory model.",
    ...(input.quality === "Low" ? ["Low quality is represented by medium-tier proxy settings; we do not apply a guessed FPS uplift."] : []),
    ...(usedPreset !== (input.quality === "Ultra" ? "ultra" : input.quality === "High" ? "high" : "medium") ? [`Comparable data did not include the requested tier at ${input.resolution}; ${usedPreset} proxy results were used without an extra quality multiplier.`] : []),
    "Laptop GPU power limits and cooling can change performance; the ranking does not encode every laptop configuration.",
    "This is a projected average-FPS range. It does not predict 1% lows, ray tracing, upscaling, or frame generation.",
    ...(input.memory < 16 ? ["Less than 16 GB system memory increases uncertainty; this is a caution flag, not an official GTA 6 requirement, and it does not change the FPS center."] : []),
  ];

  return {
    status: "estimated",
    low,
    high,
    confidence: "Very low",
    summary: "Projected range from comparable games, not a GTA 6 PC benchmark.",
    assumptions,
    proxyPreset: usedPreset,
    evidence: matchingRows.map((row) => ({ game: row.game, fps: Math.round(row.fps_median), machines: row.gpus_measured, url: row.url })),
    hardware: { gpu: gpu.gpu, cpu: cpu.cpu, memory: input.memory, resolution: input.resolution, quality: input.quality },
  };
}
