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

// These comparable titles are demanding and have aggregate results at all three
// requested resolutions. GTA V is deliberately omitted because its much older
// workload is less useful for this first-generation, open-world projection.
const proxyGames = [
  "Cyberpunk 2077",
  "Kingdom Come: Deliverance II",
  "Black Myth: Wukong",
  "Baldur's Gate 3",
];

const targetCpuAnchor = "Ryzen 7 3700X";
const cpuAnchorScore = cpus.find((row) => row.cpu === targetCpuAnchor)?.gaming_score ?? 4300;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function estimate(input: EstimateInput): EstimateResult {
  const gpu = gpus.find((row) => row.segment !== "integrated" && normalize(row.gpu) === normalize(input.gpu));
  const cpu = cpus.find((row) => row.segment !== "integrated" && normalize(row.cpu) === normalize(input.cpu));

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
  const matchingRows = candidates.filter((row) => row.preset === usedPreset);

  if (matchingRows.length < 2) {
    return {
      status: "unsupported",
      message: "Comparable benchmark coverage is too thin for this resolution and quality combination, so we're withholding an FPS number.",
    };
  }

  // CPU ranking scores use a different scale from GPU scores. This small,
  // capped adjustment is anchored to a rough console-class CPU equivalent and
  // only nudges the center; it is explicitly an assumption, not a measurement.
  const cpuRatio = cpu.gaming_score / cpuAnchorScore;
  const cpuScale = clamp(Math.pow(cpuRatio, 0.18), 0.88, 1.08);
  const memoryScale = input.memory < 12 ? 0.9 : input.memory < 16 ? 0.96 : 1;
  const qualityScale = input.quality === "Low" ? 1.2 : input.quality === "Medium" ? 1.1 : 1;

  // Scale each proxy against its own GPU score before averaging, since source
  // rows can represent different score levels from title to title.
  const scaledRows = matchingRows.map((row) => {
    // A sub-linear power avoids assuming that 2x GPU score means 2x FPS.
    // The exponent is a conservative v0 heuristic, not a learned relationship.
    const gpuScale = Math.pow(gpu.bench_score / row.gpu_score_median, 0.65);
    const adjustment = gpuScale * cpuScale * memoryScale * qualityScale;
    return {
      center: row.fps_median * adjustment,
      low: row.fps_p25 * adjustment,
      high: row.fps_p75 * adjustment,
    };
  });
  const center = scaledRows.reduce((sum, row) => sum + row.center, 0) / scaledRows.length;

  // Preserve observed spread, then widen it for the unknown GTA 6 PC build,
  // aggregation differences, and our score-based transfer assumptions.
  const observedLow = scaledRows.reduce((sum, row) => sum + row.low, 0) / scaledRows.length;
  const observedHigh = scaledRows.reduce((sum, row) => sum + row.high, 0) / scaledRows.length;
  const low = Math.max(10, Math.floor(Math.min(center * 0.55, observedLow * 0.75)));
  const high = Math.min(300, Math.ceil(Math.max(center * 1.6, observedHigh * 1.25)));

  const assumptions = [
    "Comparable-game FPS medians are transferred to GTA 6 using GPU ranking scores; this relationship has not been validated on GTA 6.",
    "The CPU ranking score applies a small capped adjustment against a fixed internal anchor; it is a heuristic, not a GTA 6 benchmark.",
    "Low quality uses comparable-game medium settings because low-setting coverage is incomplete.",
    ...(usedPreset !== (input.quality === "Ultra" ? "ultra" : input.quality === "High" ? "high" : "medium") ? [`Comparable data did not include the requested quality tier at ${input.resolution}; ${usedPreset} results were used and a small quality adjustment was applied.`] : []),
    "Laptop GPU power limits and cooling can change performance; the ranking does not encode every laptop configuration.",
    "This is a projected average-FPS range. It does not predict 1% lows, ray tracing, upscaling, or frame generation.",
    ...(input.memory < 16 ? ["Less than 16 GB system memory widens uncertainty; the small center adjustment is only a cautious heuristic."] : []),
  ];

  return {
    status: "estimated",
    low,
    high,
    confidence: "Very low",
    summary: "Projected range from comparable games, not a GTA 6 PC benchmark.",
    assumptions,
    evidence: matchingRows.map((row) => ({ game: row.game, fps: Math.round(row.fps_median), machines: row.gpus_measured, url: row.url })),
    hardware: { gpu: gpu.gpu, cpu: cpu.cpu, memory: input.memory, resolution: input.resolution, quality: input.quality },
  };
}
