# Product brief: GTA 6 PC FPS estimator

## Target user and problem

PC gamers deciding whether their current or planned build is likely to run GTA 6 acceptably. They need a useful, understandable performance expectation despite there being no confirmed PC requirements or PC benchmark results to base it on.

## First user journey

1. Select or enter CPU and GPU; provide RAM and display resolution.
2. Choose target graphics quality and optional features that materially affect performance.
3. See a projected FPS range, the assumptions behind it, and which comparable-game data informed it.
4. Adjust a setting or component to compare projections. The result remains clearly marked as an estimate, not a guarantee.

## Inputs

Required: CPU model, GPU model, system RAM, target resolution, and target quality level (or a small set of quality options).

Optional where supported by the evidence: ray tracing, upscaling technology and mode, frame generation, and desired performance target. Collecting these should not imply that GTA 6 will support a particular feature.

## Result and disclosure

Show projected average FPS as a range, with a projected 1% low range only if the underlying benchmark data supports it. Include a plain-language confidence indicator, the comparable games and test conditions used, and key assumptions or missing evidence. Distinguish native rendering from upscaling/frame generation where applicable; never present generated frames as equivalent to rendered FPS.

Prominently state: **GTA 6 PC requirements and PC benchmark results are not available for this estimate. This is a projection based on benchmarks from comparable games, not confirmed GTA 6 performance. Actual performance may differ substantially.**

## Initial estimation approach

Use measured results from selected, demanding open-world games as proxies—not as GTA 6 benchmarks. Compare configurations at matching resolution and similar quality settings; use GPU results for GPU-bound estimates and CPU scaling data for CPU-bound limits. Normalize for benchmark source, game version, settings, and test environment where possible. Produce a conservative range from relevant comparable results rather than a single precise number. Label the proxy titles, explain the mapping and uncertainty, and avoid extrapolating beyond available evidence without widening or withholding the estimate.

## Benchmark record fields

- Game title, version/build, benchmark date, source and source URL
- Test scene or benchmark method; test-system and capture notes
- CPU model, GPU model, VRAM, RAM capacity/configuration
- Resolution, graphics preset and material individual settings (including ray tracing)
- Upscaling technology/mode and frame generation state
- Average FPS, 1% low FPS, and other metrics only when reported with definitions
- Driver version, graphics API, and relevant operating-system notes
- Data quality/provenance notes and any known caveats

## First version scope

**In:** manual component selection/entry, a small supported list of benchmarked configurations, resolution and quality selection, transparent proxy-based FPS ranges, assumptions and uncertainty, and clear projection disclosures.

**Out:** claims of confirmed GTA 6 performance or requirements; scraping or crowdsourcing unverified results; exact per-component guarantees; build purchasing advice, price tracking, compatibility checks, account features, and detailed per-scene simulation.

## Open questions before implementation

- Which comparable games and benchmark sources meet the quality bar, and who reviews additions?
- Should unsupported or poorly matched hardware return a broad range, a qualitative result, or no estimate?
- What confidence labels and minimum evidence thresholds should be used?
- Which CPU/GPU catalog and manual-entry behavior are practical for the first release?
- Which quality levels, resolutions, and performance metrics are essential at launch?
- Should optional upscaling/frame-generation inputs be included before GTA 6 PC feature support is known?
- How should the product communicate and revise projections when official PC requirements or reliable GTA 6 PC benchmarks eventually become available?
