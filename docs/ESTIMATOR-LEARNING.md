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
- PC launch compatibility remains unknown until Rockstar announces a PC version
  and publishes requirements. A missing ranking match or a low proxy estimate
  must never be presented as proof that a PC cannot launch the game.
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
   STALKER 2: Heart of Chornobyl, and The Witcher 3: Wild Hunt at the requested
   resolution and a corresponding preset. These cover demanding open-world
   workloads. GTA V is not included because its much older workload would not
   be equivalent evidence for the current proxy set.
3. Scales each proxy row by `(selected GPU score / that row's GPU score median)
   ^ 0.65`, then takes the median of the scaled FPS medians. The exponent is a
   hand-chosen sub-linear heuristic: it avoids assuming that a 2x score means
   2x FPS. It has not been calibrated on GTA 6.
4. Uses the proxy games' 25th/75th percentile FPS summaries and their
   between-game spread to form a broad interval, then widens the edges further
   for the unknown GTA 6 PC build and the unvalidated score transfer.
5. Requires the selected CPU and GPU to exist in the rankings, but does not
   change the FPS center based on CPU score or system memory. Those effects
   need comparable per-system evidence before we can use them responsibly.
6. Shows the comparable settings tier actually used, each proxy's source FPS
   median, GPU sample count, source page, and assumptions. Confidence stays
   “Very low” because there is no target-game PC benchmark set.
7. Returns all 12 combinations of 1080p/1440p/4K and Low/Medium/High/Ultra so
   the page can display a range grid after one hardware submission. A cell
   without enough source coverage says “No range.”

Low quality is represented by comparable-game medium results without an
invented FPS uplift. If the requested tier is missing at a resolution, the
estimator uses the nearest available preset without applying a guessed quality
multiplier, and names that proxy tier in the result. Ultra uses ultra results
when available, otherwise high. The result does not claim 1% lows and does not
model ray tracing, upscaling, or frame generation.

The rough shape of the first estimate is:

```text
proxy median FPS
  × (selected GPU score / proxy GPU score) ^ 0.65
  = provisional center estimate
```

The estimator takes the median of the scaled proxy medians, combines the
within-game percentile spread with between-game variation, then expands it into
a conservative range. GPU score transfer is still an assumption. CPU, memory,
and proxy setting mismatches are disclosed rather than hidden in extra
unvalidated multipliers. This remains a starting point, not a validated
predictor.

The current interval expands the lower edge to the smaller of `center × 0.55`
and `proxy lower quartile × 0.75`; it expands the upper edge to the larger of
`center × 1.6` and `proxy upper quartile × 1.25`. These are conservative v0
constants, not learned confidence intervals.

## Why the first range is deliberately broad

The target game build, graphics options, CPU behavior, and PC optimization are
unknown. FPSHQ summaries aggregate different benchmark systems and may include
rescaled review data. GPU score is not a universal FPS conversion. Laptop
power limits and cooling also vary by model. A narrow range would imply more
certainty than the data supports.

## First proxy transfer evaluation

Before changing the GPU-score exponent, we compared several candidates with a
leave-one-game-out check. For each proxy row, we estimated its median FPS from
the other proxy titles at the same resolution and preset, then compared that
estimate with the held-out source median. This used 28 held-out cases. The
mean absolute percentage errors were approximately:

| GPU-score exponent | Mean absolute percentage error |
| ---: | ---: |
| 0.00 | 11.0% |
| 0.25 | 11.0% |
| 0.50 | 11.0% |
| 0.65 | 11.2% |
| 0.75 | 11.3% |
| 1.00 | 11.5% |

The differences are small, and these cases only measure transfer among four
proxy games. They do not validate GPU-score extrapolation across all hardware
or predict GTA 6. We therefore keep the current 0.65 heuristic for now and
label it as unvalidated instead of claiming the lowest rounded error is a
reliable optimum. Reproduce the comparison with `npm run estimator:evaluate`.

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
