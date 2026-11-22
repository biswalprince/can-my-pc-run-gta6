# Benchmark data sources

The local snapshots in this folder are evidence inputs for the estimator. They
are not GTA VI PC benchmarks and must not be presented as if they were.

## FPSHQ measured medians

`fpshq-game-fps-medians.json` is a snapshot of FPSHQ's **Median FPS by game
(review data and measurements)** dataset. It contains game, resolution, preset,
measured GPU-class median and percentile fields. FPSHQ states that this dataset
excludes its own model estimates. Its methodology says many rows aggregate
review tables and may be rescaled, so the rows are aggregate evidence rather
than raw per-PC captures.

Attribution: [Source: FPSHQ — Median FPS by game (review data and
measurements)](https://fpshq.com/en/data/game-fps-medians/), dataset version
2026.10.14, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Open GPU Benchmarks runs

`open-gpu-benchmarks.json` contains non-frame-generated official runs for
Cyberpunk 2077 and Helldivers 2 from Open GPU Benchmarks. The source keeps the
GPU, game version, resolution, preset, upscaling, operating system, CPU, RAM,
test bench, FPS metrics, run count, and provenance fields together.

Attribution: [Data from Open GPU Benchmarks](https://opengpubenchmarks.com/),
licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The current Open GPU Benchmarks snapshot is a small calibration set: it covers
three GPU products, so it cannot support reliable predictions for the full
hardware catalog by itself. The sync script only includes Cyberpunk 2077 and
Helldivers 2 because the source's OpenBenchmarker Neon Flythrough is synthetic
and is not a game workload.

## How to refresh

Run `npm run benchmarks:sync`. The script validates both source licenses and
their expected JSON shape before replacing the snapshots. These sources can be
used in a commercial project with attribution. Keep measured data, source
model estimates, and our own predictions separately labeled in any later model
training data.
