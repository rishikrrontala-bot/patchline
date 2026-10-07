import { generateScenario, trainSyntheticModel, analyze } from "./engine.js";

const channels = [
  { key: "temperature", name: "Patch temperature", unit: "°C", min: 20, max: 45, step: 0.01, digits: 2 },
  { key: "moisture", name: "Dressing wetness", unit: "%", min: 0, max: 100, step: 0.01, digits: 1 },
  { key: "ph", name: "Wound-fluid pH", unit: "pH", min: 4, max: 10, step: 0.01, digits: 2 },
  { key: "glucose", name: "Wound-fluid glucose*", unit: "AU", min: 0, max: 100, step: 0.01, digits: 1 },
];

const $ = (selector) => document.querySelector(selector);
const svgNS = "http://www.w3.org/2000/svg";
const model = trainSyntheticModel();
let scenario;
let samples;
let result;
let highlightedSamples = new Set();
let hasManualEdit = false;

function format(value, digits = 1) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function percent(value) {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value * 100)}%` : "—";
}

function svgNode(name, attributes = {}) {
  const element = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

function sampleNumber(index) {
  return `S${String(index + 1).padStart(2, "0")}`;
}

function currentScore() {
  return result.patternScore == null ? "—" : String(Math.round(result.patternScore * 100));
}

function loadScenario(key) {
  scenario = generateScenario(key);
  samples = scenario.samples.map((sample) => ({ ...sample }));
  highlightedSamples = new Set();
  $("#trace-grid").removeAttribute("aria-label");
  hasManualEdit = false;
  document.querySelectorAll(".scenario-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.scenario === key));
  });
  renderControls();
  update();
}

function update() {
  result = analyze(samples, model);
  renderTraces();
  renderDecision();
  renderReport();
  renderLog();
}

function renderControls() {
  const container = $("#manual-controls");
  container.replaceChildren();
  const latest = samples.at(-1);
  for (const channel of channels) {
    const wrapper = document.createElement("div");
    wrapper.className = "manual-control";
    const label = document.createElement("label");
    const labelName = document.createElement("span");
    labelName.textContent = channel.name;
    const value = document.createElement("strong");
    value.className = "manual-value";
    value.textContent = latest[channel.key] == null ? "MISSING" : `${format(latest[channel.key], channel.digits)} ${channel.unit}`;
    const id = `manual-${channel.key}`;
    label.htmlFor = id;
    label.append(labelName, value);
    const input = document.createElement("input");
    input.id = id;
    input.type = "range";
    input.min = String(channel.min);
    input.max = String(channel.max);
    input.step = String(channel.step);
    input.value = String(latest[channel.key] == null ? (channel.min + channel.max) / 2 : latest[channel.key]);
    input.setAttribute("aria-label", `Last synthetic ${channel.name.toLowerCase()} reading`);
    input.addEventListener("input", () => {
      const reading = Number(input.value);
      samples[samples.length - 1][channel.key] = reading;
      value.textContent = `${format(reading, channel.digits)} ${channel.unit}`;
      hasManualEdit = true;
      update();
    });
    const ends = document.createElement("div");
    ends.className = "range-ends";
    const low = document.createElement("span");
    const high = document.createElement("span");
    low.textContent = String(channel.min);
    high.textContent = `${channel.max} ${channel.unit}`;
    ends.append(low, high);
    wrapper.append(label, input, ends);
    container.append(wrapper);
  }
}

function createTraceSvg(channel, evidence) {
  const width = 320;
  const height = 93;
  const top = 8;
  const bottom = 8;
  const x = (index) => 5 + (index / (samples.length - 1)) * (width - 10);
  const numeric = samples.map((sample) => sample[channel.key]).filter((value) => typeof value === "number" && Number.isFinite(value));
  const rawMin = Math.min(...numeric);
  const rawMax = Math.max(...numeric);
  const spread = Math.max(rawMax - rawMin, channel.key === "ph" ? 0.25 : channel.key === "temperature" ? 0.6 : 5);
  const min = rawMin - spread * 0.18;
  const max = rawMax + spread * 0.18;
  const y = (value) => top + (1 - (value - min) / (max - min)) * (height - top - bottom);
  const svg = svgNode("svg", { class: "trace-svg", viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": `${channel.name} across 24 synthetic samples` });
  svg.append(svgNode("line", { x1: 0, x2: width, y1: 28, y2: 28, class: "trace-gridline" }));
  svg.append(svgNode("line", { x1: 0, x2: width, y1: 64, y2: 64, class: "trace-gridline" }));
  svg.append(svgNode("line", { x1: 0, x2: width, y1: height - 1, y2: height - 1, class: "trace-baseline" }));
  let path = "";
  let started = false;
  samples.forEach((sample, index) => {
    const value = sample[channel.key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      started = false;
      svg.append(svgNode("path", { d: `M ${x(index) - 4} 45 l 8 8 M ${x(index) + 4} 45 l -8 8`, class: `trace-gap${highlightedSamples.has(index) ? " is-highlighted" : ""}`, stroke: highlightedSamples.has(index) ? "#ce5b3a" : "#a74236", "stroke-width": highlightedSamples.has(index) ? 3 : 1.7, fill: "none" }));
      return;
    }
    path += `${started ? " L" : " M"} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`;
    started = true;
  });
  svg.append(svgNode("path", { d: path, class: "trace-path" }));
  samples.forEach((sample, index) => {
    const value = sample[channel.key];
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    if (index !== samples.length - 1 && !evidence.includes(index) && !highlightedSamples.has(index)) return;
    const point = svgNode("circle", { cx: x(index), cy: y(value), r: highlightedSamples.has(index) ? 5 : 3.1, class: `trace-point${highlightedSamples.has(index) ? " is-highlighted" : ""}` });
    const title = svgNode("title");
    title.textContent = `${sampleNumber(index)}: ${format(value, channel.digits)} ${channel.unit}, synthetic`;
    point.append(title);
    svg.append(point);
  });
  return svg;
}

function renderTraces() {
  const grid = $("#trace-grid");
  grid.replaceChildren();
  $("#sample-count").textContent = `${samples.length} virtual samples`;
  const evidence = result.evidenceIndices || [];
  for (const channel of channels) {
    const card = document.createElement("div");
    card.className = `trace-card ${result.quality.valid ? (result.decision.action === "review" ? "is-changing" : "") : "is-fault"}`;
    card.id = `trace-${channel.key}`;
    const head = document.createElement("div");
    head.className = "trace-head";
    const left = document.createElement("div");
    const name = document.createElement("div");
    name.className = "trace-name";
    name.textContent = channel.name;
    const reading = document.createElement("div");
    reading.className = "trace-reading";
    const numeric = document.createElement("span");
    numeric.textContent = format(result.latest[channel.key], channel.digits);
    const unit = document.createElement("span");
    unit.className = "trace-unit";
    unit.textContent = channel.unit;
    reading.append(numeric, unit);
    left.append(name, reading);
    const meta = document.createElement("span");
    meta.className = "trace-meta";
    meta.textContent = highlightedSamples.size === 1
      ? `${sampleNumber([...highlightedSamples][0])} highlighted`
      : highlightedSamples.size > 1 ? `${highlightedSamples.size} samples highlighted` : "LATEST / SYNTHETIC";
    head.append(left, meta);
    const axis = document.createElement("div");
    axis.className = "trace-axis";
    const first = document.createElement("span");
    const last = document.createElement("span");
    first.textContent = "S01 / START";
    last.textContent = "S24 / LATEST";
    axis.append(first, last);
    card.append(head, createTraceSvg(channel, evidence), axis);
    grid.append(card);
  }
}

function renderDecision() {
  const valid = result.quality.valid;
  $(".decision-panel").classList.toggle("is-fault", !valid);
  $("#quality-value").textContent = valid ? "PASS / 24 SAMPLES" : `HOLD / ${result.quality.flags.length} FLAG${result.quality.flags.length === 1 ? "" : "S"}`;
  $("#score-value").textContent = currentScore();
  $("#score-caption").textContent = valid
    ? "Classifier output on generated traces. Not an infection probability."
    : "Score withheld: the synthetic sensor-quality gate found invalid data.";
  $("#decision-label").textContent = result.decision.label;
  $("#decision-rationale").textContent = result.decision.rationale;
  for (const [key, prefix] of [["ultrasoundLevel", "ultrasound"], ["violetLevel", "violet"]]) {
    const level = result.decision[key];
    $(`#${prefix}-value`).textContent = `${level} / 3`;
    document.querySelectorAll(`#${prefix}-track i`).forEach((segment, index) => segment.classList.toggle("on", index < level));
  }
}

function evidenceButton(indices, text) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "claim-source";
  const ordered = [...new Set(indices)].filter((index) => Number.isInteger(index) && index >= 0 && index < samples.length);
  button.textContent = text || (ordered.length === 1 ? `VIEW ${sampleNumber(ordered[0])} ↗` : `VIEW ${ordered.map(sampleNumber).join(", ")} ↗`);
  button.addEventListener("click", () => {
    highlightedSamples = new Set(ordered);
    renderTraces();
    $("#trace-grid").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    if (highlightedSamples.size) $("#trace-grid").setAttribute("aria-label", `${ordered.map(sampleNumber).join(" and ")} highlighted in the synthetic traces`);
  });
  return button;
}

function addClaim(container, description, indices, sourceText) {
  const row = document.createElement("div");
  row.className = "claim-row";
  const text = document.createElement("span");
  text.textContent = description;
  row.append(text, evidenceButton(indices, sourceText));
  container.append(row);
}

function renderReport() {
  $("#report-scenario").textContent = `${scenario.id.toUpperCase()} / ${hasManualEdit ? "MODIFIED" : "ORIGINAL"}`;
  $("#report-headline").textContent = result.quality.valid
    ? result.decision.action === "review" ? "Changing pattern, human review prepared." : "Stable pattern, trace recorded."
    : "Sensor fault, score withheld.";
  $("#report-summary").textContent = `${scenario.description} ${result.decision.rationale}`;
  $("#train-count").textContent = String(model.trainCount);
  $("#test-count").textContent = String(model.testCount);
  $("#metric-accuracy").textContent = percent(model.metrics.accuracy);
  $("#metric-recall").textContent = percent(model.metrics.recall);
  const claims = $("#claim-list");
  claims.replaceChildren();
  const latestIndex = samples.length - 1;
  for (const channel of channels) {
    const value = result.latest[channel.key];
    addClaim(claims, `Latest synthetic ${channel.name.toLowerCase()}: ${value == null ? "missing" : `${format(value, channel.digits)} ${channel.unit}`}.`, [latestIndex]);
  }
  if (!result.quality.valid) {
    result.quality.flags.slice(0, 3).forEach((flag, index) => addClaim(claims, flag, [result.evidenceIndices[index] ?? latestIndex]));
    addClaim(claims, "Quality gate held the model score and both virtual output levels at zero.", result.evidenceIndices, "VIEW FLAGGED SAMPLES ↗");
  } else {
    addClaim(claims, `Synthetic pattern score: ${currentScore()}/100. This is not infection risk.`, result.evidenceIndices, "VIEW EVIDENCE ↗");
    addClaim(claims, `Orchestrator action: ${result.decision.label}. Virtual ultrasound ${result.decision.ultrasoundLevel}/3 and violet light ${result.decision.violetLevel}/3 abstract tokens; no physical dose.`, result.evidenceIndices, "VIEW EVIDENCE ↗");
  }
}

function renderLog() {
  const log = $("#event-log");
  log.replaceChildren();
  const entries = [
    `BOOT: ${scenario.id.toUpperCase()} seed loaded locally`,
    `SAMPLE: ${samples.length} synthetic frames / 4 channels`,
    result.quality.valid ? "QC: all channels pass range + spike checks" : `QC: hold / ${result.quality.flags.length} flagged reading${result.quality.flags.length === 1 ? "" : "s"}`,
    result.quality.valid ? `MODEL: ${currentScore()}/100 synthetic pattern score` : "MODEL: blocked by quality gate",
    `POLICY: ${result.decision.action.toUpperCase()} / virtual output ${result.decision.ultrasoundLevel}, ${result.decision.violetLevel}`,
  ];
  if (hasManualEdit) entries.splice(2, 0, "OVERRIDE: final synthetic frame adjusted by visitor");
  for (const entry of entries) {
    const item = document.createElement("li");
    item.textContent = entry;
    log.append(item);
  }
}

document.querySelectorAll(".scenario-button").forEach((button) => button.addEventListener("click", () => loadScenario(button.dataset.scenario)));
$("#reset-controls").addEventListener("click", () => loadScenario(scenario.id));
$("#print-report").addEventListener("click", () => window.print());
$("#score-info").addEventListener("click", () => {
  $("#score-caption").textContent = "The classifier was fitted on generated stable/changing patterns and checked on separate generated patterns. This score is not calibrated to infection and must never guide care.";
});

loadScenario("stable");
