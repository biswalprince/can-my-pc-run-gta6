# Estimator and ML learning log

This file records what the first estimator does and why. The current result is
a heuristic projection, not a model trained to predict GTA 6. There are no
GTA 6 PC benchmark labels to train against.

## What is known

- Rockstar's current platform information and public reporting do not provide
  an official GTA 6 PC benchmark dataset. Comparable-game results are proxy
  evidence; they do not prove how a future PC version will run.
- Console hardware and performance can later be added as internal calibration
  features, as requested. The UI must not show console comparison cards.
- FPSHQ's benchmark tables provide aggregate summaries and hardware scores.
  Open GPU Benchmarks provides detailed runs, but the snapshot currently has
  narrow GPU coverage. Source licenses and attribution are recorded in
  `src/data/BENCHMARK-DATA.md`.

## What the v0 estimator does

The web form sends GPU, CPU, memory, resolution, and quality to
`POST /api/estimate`. The server:

1. Requires an exact normalized GPU and CPU name in the FPSHQ rankings. An
   unknown component returns a reason and no FPS number.
2. Finds proxy rows for Cyberpunk 2077, Kingdom Come: Deliverance II,
   Black Myth: Wukong, and Baldur's Gate 3 at the requested resolution and a
   corresponding preset. GTA V is excluded because its much older workload is
   less representative for this first pass.
3. Scales each proxy row by `(selected GPU score / that row's GPU score median)
   ^ 0.65`, then averages the scaled FPS medians. The exponent is a hand-chosen
   sub-linear heuristic: it avoids assuming that a 2x score means 2x FPS. It
   has not been calibrated on GTA 6.
4. Applies a small CPU adjustment using the CPU ranking score relative to an
   internal Ryzen 7 3700X anchor: `(CPU score / anchor score) ^ 0.18`, capped
   between 0.88 and 1.08. The CPU and GPU rankings are separate scales, so the
   CPU value only nudges the estimate. This is a provisional assumption.
5. Applies a small center adjustment for less than 16 GB system memory. This
   is also a heuristic; it is not a stated GTA 6 requirement.
6. Makes a wide interval by comparing the scaled proxy median and observed
   25th/75th percentile summaries, then widening the bottom and top. The UI
   labels confidence “Very low” for every estimate because there is no target
   game PC benchmark set.
7. Shows each proxy title, its source FPS median, the GPU sample count, and
   the source page. It also lists assumptions beside the range.

Low quality uses comparable-game medium results when available, with a small
uplift. If that preset is missing at a resolution, the estimator uses the
closest covered tier and explicitly says so. This is another heuristic.
Ultra uses ultra results when available, otherwise high. The result does not
claim 1% lows and does not model ray tracing, upscaling, or frame generation.

The rough shape of the first estimate is:

```text
proxy median FPS
  × (selected GPU score / proxy GPU score) ^ 0.65
  × capped CPU score adjustment
  × cautious memory adjustment
  × quality fallback adjustment
  = provisional center estimate
```

Then the estimator uses the proxy percentile spread and expands it into a
conservative range. Every multiplier after the measured source median is an
assumption. This is useful as an understandable starting point, not as a
validated predictor.

## Why the first range is deliberately broad

The target game build, graphics options, CPU behavior, and PC optimization are
unknown. FPSHQ summaries aggregate different benchmark systems and may include
rescaled review data. GPU score is not a universal FPS conversion. Laptop
power limits and cooling also vary by model. A narrow range would imply more
certainty than the data supports.

## Data rules for the future ML phase

- Keep measured, aggregated, modeled, and synthetic benchmark records labeled
  separately. Never treat model-generated FPS as a measured label.
- Keep average FPS, 1% lows, native/upscaled rendering, and frame generation
  as separate targets/features. Generated frames are not rendered FPS.
- Use the PS5, PS5 Pro, Xbox Series X, and Xbox Series S internally only if we
  document what console test data and PC-equivalent assumptions support each
  anchor. Do not display console comparison cards.
- Preserve each source URL, license, attribution, game version, hardware,
  resolution, preset, scaling mode, and benchmark-run conditions when supplied.
- Before training, validate benchmark records and remove duplicate or
  near-duplicate runs.
- Hold out entire hardware models and preferably data sources during
  validation so near-duplicate rows cannot leak across train and test sets.
- Compare any model against this deterministic baseline with error and
  prediction-interval coverage metrics. Do not ship a model that performs
  worse than the baseline or reports falsely narrow ranges.

## Next learning steps

1. Run and inspect projections for a few known GPUs/CPUs and verify that every
   evidence link and assumption is clear.
2. Collect wider, licensed proxy benchmark coverage and record settings
   consistently.
3. Replace the hand-tuned score exponent and quality/memory adjustments with
   relationships fitted and evaluated only on comparable-game data.
4. Keep a hardware-grouped holdout set and compare the fitted predictor against
   this v0 baseline.
5. Add console-derived calibration only after documenting the source and
   uncertainty of each internal reference.

When we reach the ML phase, extend this log with each cleaning decision,
feature choice, split, training run, evaluation result, and what it means.
