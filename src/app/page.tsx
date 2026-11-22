"use client";

import { FormEvent, useState } from "react";
import { HardwareAutocomplete } from "@/components/HardwareAutocomplete";
import { cpuOptions, gpuOptions } from "@/data/hardwareCatalog";

type Setup = {
  gpu: string;
  cpu: string;
  memory: string;
  resolution: string;
  quality: string;
};

const initialSetup: Setup = {
  gpu: "",
  cpu: "",
  memory: "16",
  resolution: "1440p",
  quality: "High",
};

export default function Home() {
  const [setup, setSetup] = useState(initialSetup);
  const [submitted, setSubmitted] = useState(false);

  function update(field: keyof Setup, value: string) {
    setSetup((current) => ({ ...current, [field]: value }));
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Can My PC Run GTA 6 home">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span className="brand-name">CAN MY PC RUN <b>GTA 6?</b></span>
        </a>
        <div className="topbar-status"><span className="status-dot" /> PROJECTION PREVIEW</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span>01</span> PC PERFORMANCE FORECAST</p>
          <h1>Will your rig<br /><em>keep up?</em></h1>
          <p className="hero-lede">
            Get a grounded estimate for your setup, resolution, and graphics target.
            Every projection will show its evidence and uncertainty.
          </p>
          <a className="text-link" href="#estimator">BUILD YOUR ESTIMATE <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-visual" aria-label="Performance estimate preview">
          <div className="visual-grid" />
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-core"><span>FPS</span><strong>—</strong><small>PROJECTION</small></div>
          <div className="visual-caption"><span className="status-dot" /> CALIBRATING AGAINST COMPARABLE GAMES</div>
          <div className="visual-coordinate">VICE CITY / PC</div>
        </div>
      </section>

      <section className="disclosure" role="note">
        <span className="disclosure-icon" aria-hidden="true">i</span>
        <p><strong>Early projection, not a benchmark.</strong> GTA 6 PC requirements and PC benchmark results are not available for this estimate. We’ll use comparable-game data and show the assumptions.</p>
      </section>

      <section className="workspace" id="estimator">
        <div className="form-panel">
          <div className="section-heading">
            <div><p className="eyebrow"><span>02</span> YOUR HARDWARE</p><h2>Build your setup</h2></div>
            <span className="required-note">* REQUIRED</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="field-grid">
              <label className="field field-wide">
                <span>Graphics card <b>*</b></span>
                <HardwareAutocomplete id="gpu" value={setup.gpu} options={gpuOptions} onChange={(value) => update("gpu", value)} placeholder="Search a desktop or laptop GPU" />
              </label>
              <label className="field field-wide">
                <span>Processor <b>*</b></span>
                <HardwareAutocomplete id="cpu" value={setup.cpu} options={cpuOptions} onChange={(value) => update("cpu", value)} placeholder="Search a desktop or laptop CPU" />
              </label>
              <label className="field">
                <span>System memory <b>*</b></span>
                <span className="input-suffix"><input type="number" min="4" max="256" step="4" value={setup.memory} onChange={(event) => update("memory", event.target.value)} required /><i>GB</i></span>
              </label>
              <label className="field">
                <span>Resolution <b>*</b></span>
                <select value={setup.resolution} onChange={(event) => update("resolution", event.target.value)}>
                  <option>1080p</option><option>1440p</option><option>4K</option>
                </select>
              </label>
              <label className="field field-wide">
                <span>Target quality tier <b>*</b></span>
                <select value={setup.quality} onChange={(event) => update("quality", event.target.value)}>
                  <option>Low</option><option>Medium</option><option>High</option><option>Ultra</option>
                </select>
                <small>Generic comparison tier until GTA 6 PC settings are confirmed.</small>
              </label>
            </div>
            <button className="submit-button" type="submit">CHECK MY PROJECTION <span aria-hidden="true">↗</span></button>
          </form>
        </div>

        <aside className="result-panel" aria-live="polite">
          <div className="result-topline"><span className="eyebrow">YOUR PROJECTION</span><span className="result-index">01 / PC</span></div>
          <div className="result-main">
            <span className="result-label">ESTIMATED FRAME RATE</span>
            <div className="result-number">— <span>FPS</span></div>
            <p className="result-status"><span className="status-dot" /> {submitted ? "NO MATCHING DATA YET" : "AWAITING HARDWARE INPUT"}</p>
          </div>
          <div className="result-divider" />
          <p className="result-copy">
            {submitted
              ? "Your setup is captured in this preview. We’re withholding a number until the comparison data supports a defensible range."
              : "Enter your components to see the projection status for your setup. An FPS range will appear once comparable benchmark data is available."}
          </p>
          <div className="result-meta">
            <span>CONFIDENCE</span><b>NOT RATED</b>
          </div>
          <div className="result-meta">
            <span>DATA BASIS</span><b>COMPARABLE GAMES</b>
          </div>
          {submitted && <div className="submitted-setup"><span>YOUR CONFIG</span><b>{setup.gpu} · {setup.cpu} · {setup.memory} GB · {setup.resolution}</b></div>}
        </aside>
      </section>

      <section className="method-section" id="method">
        <div className="method-intro">
          <p className="eyebrow"><span>03</span> HOW IT WORKS</p>
          <h2>Evidence first.<br /><em>Guesswork labeled.</em></h2>
          <p>Comparable games can give us a useful starting point—but they can’t guarantee how a different PC version will run.</p>
        </div>
        <div className="method-steps">
          <article className="method-step"><span>01</span><div><h3>Match the workload</h3><p>Compare your parts against demanding open-world games at similar settings.</p></div><b>↗</b></article>
          <article className="method-step"><span>02</span><div><h3>Build a range</h3><p>Use relevant benchmark results and widen the range when evidence is thin.</p></div><b>↗</b></article>
          <article className="method-step"><span>03</span><div><h3>Show the basis</h3><p>See which comparisons informed the estimate, with the assumptions made clear.</p></div><b>↗</b></article>
        </div>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true">C</span><span className="brand-name">CAN MY PC RUN <b>GTA 6?</b></span></a>
        <p>Independent fan-made performance projection. Not affiliated with Rockstar Games.</p>
        <a href="#top" className="back-top">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}

