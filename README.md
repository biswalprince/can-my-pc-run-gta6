# Can My PC Run GTA 6?

A fan-made prototype that projects average FPS ranges for a PC setup using benchmark summaries from comparable games. It is not affiliated with Rockstar Games.

> **Important:** There is no official GTA 6 PC version or PC system requirements to check against. These are speculative projections, not GTA 6 benchmarks, and they cannot tell whether the game will launch on a PC.

## What it does

- Accepts a graphics card, processor, system memory, resolution, and quality tier.
- Shows projected FPS ranges across 1080p, 1440p, and 4K at Low, Medium, High, and Ultra settings.
- Lists the proxy settings and comparable-game benchmark summaries behind the selected estimate.
- Shows whether the selected hardware has ranking data available.
- Keeps PC launch compatibility marked **Unknown** until official PC requirements exist.
- Includes a light/dark theme and a feedback form.

Every estimate has **Very low confidence**. The calculator currently uses GPU ranking scores to scale FPS summaries from Cyberpunk 2077, Kingdom Come: Deliverance II, STALKER 2: Heart of Chornobyl, and The Witcher 3: Wild Hunt. CPU and memory are included in the selected setup, but do not change the FPS center because there is not enough per-system evidence to justify those adjustments. When benchmark coverage is insufficient, the calculator withholds a range.

The GPU score scaling and range widening are prototype heuristics, not a trained machine-learning model. See [docs/ESTIMATOR-LEARNING.md](docs/ESTIMATOR-LEARNING.md) for the method, evaluation notes, and planned ML work.

## Run locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other commands:

```bash
npm run build                 # Create a production build
npm run start                 # Run the production build
npm run lint                  # Run ESLint
npm run catalog:sync          # Refresh the hardware catalog
npm run benchmarks:sync       # Refresh benchmark data snapshots
npm run estimator:evaluate    # Compare GPU-score scaling on held-out proxy games
```

The feedback form needs a Resend API key and verified sender address. See [FEEDBACK-SETUP.md](FEEDBACK-SETUP.md) and `.env.example` for setup instructions. Keep real credentials in `.env.local` or your hosting provider’s server-side environment variables; do not commit them.

## Data and attribution

Benchmark snapshots and their licenses are documented in [src/data/BENCHMARK-DATA.md](src/data/BENCHMARK-DATA.md). Hardware catalog attribution is documented in [src/data/HARDWARE-DATA.md](src/data/HARDWARE-DATA.md). Preserve source attribution when redistributing the data or deploying the project.

## Project status

This is an early prototype. There are no GTA 6 PC benchmark labels to train against, so the current calculator is a transparent baseline. Better projections will require consistent comparable-game benchmark data and, eventually, real GTA 6 PC results. Console hardware may be used as an internal calibration reference later; console comparison cards are not part of the interface.
