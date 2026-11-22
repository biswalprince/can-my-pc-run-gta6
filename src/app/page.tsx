"use client";

import { FormEvent, useEffect, useState } from "react";
import { HardwareAutocomplete } from "@/components/HardwareAutocomplete";
import { FeedbackForm } from "@/components/FeedbackForm";

type Setup = {
  gpu: string;
  cpu: string;
  memory: string;
  resolution: string;
  quality: string;
};

type EstimateResponse = {
  status: "estimated";
  low: number;
  high: number;
  confidence: string;
  summary: string;
  assumptions: string[];
  evidence: { game: string; fps: number; machines: number; url: string }[];
  hardware: { gpu: string; cpu: string; memory: number; resolution: string; quality: string };
} | { status: "unsupported"; message: string };

const initialSetup: Setup = {
  gpu: "",
  cpu: "",
  memory: "16",
  resolution: "1440p",
  quality: "High",
};

export default function Home() {
  const [setup, setSetup] = useState(initialSetup);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [estimateError, setEstimateError] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const initialTheme = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
  }

  function update(field: keyof Setup, value: string) {
    setSetup((current) => ({ ...current, [field]: value }));
    setEstimate(null);
    setEstimateError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEstimating(true);
    setEstimate(null);
    setEstimateError("");
    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...setup, memory: Number(setup.memory) }),
      });
      const payload = await response.json() as EstimateResponse | { error: string };
      if (!response.ok) throw new Error("error" in payload ? payload.error : "The estimate could not be created.");
      setEstimate(payload as EstimateResponse);
    } catch (error) {
      setEstimateError(error instanceof Error ? error.message : "The estimate could not be created.");
    } finally {
      setEstimating(false);
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Can My PC Run GTA 6 home">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span className="brand-name">CAN MY PC RUN <b>GTA 6?</b></span>
        </a>
        <div className="topbar-actions">
          <div className="topbar-status"><span className="status-dot" /> PROJECTION PREVIEW</div>
          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "dark"}
          >
            <span aria-hidden="true">{theme === "dark" ? "☼" : "◐"}</span>
            {theme === "dark" ? "LIGHT" : "DARK"}
          </button>
        </div>
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
                <HardwareAutocomplete id="gpu" value={setup.gpu} kind="gpu" onChange={(value) => update("gpu", value)} placeholder="Search the GPU catalog" />
              </label>
              <label className="field field-wide">
                <span>Processor <b>*</b></span>
                <HardwareAutocomplete id="cpu" value={setup.cpu} kind="cpu" onChange={(value) => update("cpu", value)} placeholder="Search the CPU catalog" />
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
            <button className="submit-button" type="submit" disabled={estimating}>{estimating ? "CALCULATING…" : "CHECK MY PROJECTION"} <span aria-hidden="true">↗</span></button>
          </form>
        </div>

        <aside className="result-panel" aria-live="polite">
          <div className="result-topline"><span className="eyebrow">YOUR PROJECTION</span><span className="result-index">01 / PC</span></div>
          <div className="result-main">
            <span className="result-label">ESTIMATED FRAME RATE</span>
            <div className="result-number">{estimate?.status === "estimated" ? <>{estimate.low}–{estimate.high} <span>FPS</span></> : <>— <span>FPS</span></>}</div>
            <p className="result-status"><span className="status-dot" /> {estimating ? "BUILDING PROJECTION" : estimate?.status === "estimated" ? "VERY LOW CONFIDENCE · PROJECTION" : estimate?.status === "unsupported" ? "NO DEFENSIBLE RANGE" : estimateError ? "ESTIMATE ERROR" : "AWAITING HARDWARE INPUT"}</p>
          </div>
          <div className="result-divider" />
          <p className="result-copy">
            {estimate?.status === "estimated" ? estimate.summary : estimate?.status === "unsupported" ? estimate.message : estimateError || "Enter your components to see a projected range based on comparable-game benchmark summaries."}
          </p>
          <div className="result-meta">
            <span>CONFIDENCE</span><b>{estimate?.status === "estimated" ? estimate.confidence.toUpperCase() : "NOT RATED"}</b>
          </div>
          <div className="result-meta">
            <span>DATA BASIS</span><b>{estimate?.status === "estimated" ? `${estimate.evidence.length} PROXIES` : "COMPARABLE GAMES"}</b>
          </div>
          {estimate?.status === "estimated" && <>
            <div className="submitted-setup"><span>YOUR CONFIG</span><b>{estimate.hardware.gpu} · {estimate.hardware.cpu} · {estimate.hardware.memory} GB · {estimate.hardware.resolution} · {estimate.hardware.quality}</b></div>
            <div className="estimate-details">
              <h3>Comparable evidence</h3>
              <ul>{estimate.evidence.map((item) => <li key={item.game}><a href={item.url} target="_blank" rel="noreferrer">{item.game}</a><span>{item.fps} FPS source median · {item.machines} GPUs</span></li>)}</ul>
              <h3>Assumptions</h3>
              <ul className="assumption-list">{estimate.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </>}
        </aside>
      </section>

      <section className="method-section" id="method">
        <div className="method-intro">
          <p className="eyebrow"><span>03</span> HOW IT WORKS</p>
          <h2>Evidence first.<br /><em>Guesswork labeled.</em></h2>
          <p>Comparable games can give us a useful starting point—but they can’t guarantee how a different PC version will run.</p>
        </div>
        <div className="method-steps">
            <article className="method-step"><span>01</span><div><h3>Match the workload</h3><p>Compare your parts against demanding games at the selected resolution and a similar quality tier.</p></div><b>↗</b></article>
          <article className="method-step"><span>02</span><div><h3>Build a range</h3><p>Use relevant benchmark results and widen the range when evidence is thin.</p></div><b>↗</b></article>
          <article className="method-step"><span>03</span><div><h3>Show the basis</h3><p>See which comparisons informed the estimate, with the assumptions made clear.</p></div><b>↗</b></article>
        </div>
      </section>

      <section className="feedback-section" id="feedback">
        <div className="feedback-intro">
          <p className="eyebrow"><span>04</span> YOUR FEEDBACK</p>
          <h2>Help us make<br /><em>this better.</em></h2>
          <p>Tell us what’s confusing, what’s missing, or what you’d like to see next. Your note goes straight to the project owner.</p>
        </div>
        <FeedbackForm />
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true">C</span><span className="brand-name">CAN MY PC RUN <b>GTA 6?</b></span></a>
        <p>Independent fan-made performance projection. Not affiliated with Rockstar Games.<br />Hardware names from <a href="https://gettechapi.github.io/TechAPI/" target="_blank" rel="noreferrer">TechAPI</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>.<br />Benchmark summaries from <a href="https://fpshq.com/en/data/" target="_blank" rel="noreferrer">FPSHQ</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</p>
        <a href="#top" className="back-top">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}


