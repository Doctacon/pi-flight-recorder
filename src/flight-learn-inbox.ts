import { compactSnippet } from "./redact.js";
import type { ArtifactCandidateType, DeltaDetectorSignal, DeltaEvidenceRef, ExpectationDelta } from "./types.js";

export interface FlightLearnRouteChoice<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export interface FlightLearnDeltaInboxItem {
  delta: ExpectationDelta;
  signals: DeltaDetectorSignal[];
}

export interface FlightLearnDeltaInboxInput {
  items: FlightLearnDeltaInboxItem[];
  routeChoices: Array<FlightLearnRouteChoice<ArtifactCandidateType | "dismiss" | "cancel">>;
}

export type FlightLearnDeltaInboxResult =
  | { kind: "route-selected"; deltaId: string; artifactType: ArtifactCandidateType; expectation: string | null; reality: string | null; impact: string | null }
  | { kind: "routed"; deltaId: string; artifactType: ArtifactCandidateType; rationale: string; expectation: string | null; reality: string | null; impact: string | null }
  | { kind: "dismissed"; deltaId: string; reason: string }
  | { kind: "skipped"; deltaId: string }
  | { kind: "cancelled" }
  | { kind: "unavailable" };

interface FlightLearnInboxTheme {
  fg?: (color: string, value: string) => string;
  bold?: (value: string) => string;
}

interface FlightLearnInboxTui {
  requestRender?: () => void;
}

interface FlightLearnInboxComponentOptions {
  input: FlightLearnDeltaInboxInput;
  done: (result: Exclude<FlightLearnDeltaInboxResult, { kind: "unavailable" }>) => void;
  tui?: FlightLearnInboxTui;
  theme?: FlightLearnInboxTheme;
  layout?: FlightLearnInboxLayout;
}

export interface FlightLearnCustomComponent {
  render: (width: number) => string[];
  handleInput?: (data: string) => void;
  invalidate: () => void;
}

type InboxMode = "review" | "edit" | "rationale";
type EditableField = "expectation" | "reality" | "impact";
type FlightLearnInboxLayout = "split-pane" | "focused-card";

const EDITABLE_FIELDS: EditableField[] = ["expectation", "reality", "impact"];
const DEFAULT_DISMISS_REASON = "Dismissed through Flight Learn inbox";

function isArtifactRoute(value: ArtifactCandidateType | "dismiss" | "cancel"): value is ArtifactCandidateType {
  return value !== "dismiss" && value !== "cancel";
}

function normalizeText(value: string | null | undefined, fallback = "unknown"): string {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function clip(value: string, width: number): string {
  if (width <= 0) return "";
  const normalized = value.replace(/\s+/g, " ").trimEnd();
  if (normalized.length <= width) return normalized;
  if (width <= 3) return normalized.slice(0, width);
  return `${normalized.slice(0, width - 3)}...`;
}

function pad(value: string, width: number): string {
  const clipped = clip(value, width);
  return clipped + " ".repeat(Math.max(0, width - clipped.length));
}

function wrapText(value: string, width: number): string[] {
  if (width <= 0) return [""];
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return [""];
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    const candidate = `${current} ${word}`;
    if (candidate.length <= width) {
      current = candidate;
      continue;
    }
    lines.push(clip(current, width));
    current = word;
  }
  if (current) lines.push(clip(current, width));
  return lines.length > 0 ? lines : [""];
}

function wrapIndented(value: string, width: number, indent = "  "): string[] {
  const contentWidth = Math.max(1, width - indent.length);
  return wrapText(value, contentWidth).map((line) => clip(`${indent}${line}`, width));
}

function keyForRouteIndex(index: number): string {
  if (index >= 0 && index <= 8) return String(index + 1);
  if (index === 9) return "0";
  return "";
}

function routeLabel(choice: FlightLearnRouteChoice): string {
  return choice.label.replace("/no artifact", "");
}

function issueTitle(delta: ExpectationDelta): string {
  return normalizeText(delta.summary)
    .replace(/^repeated failure pattern:\s*/i, "")
    .replace(/^expectation delta:\s*/i, "")
    .replace(/^repeated local friction:\s*/i, "")
    .trim() || normalizeText(delta.summary);
}

function unknownExpectation(value: string): boolean {
  return value.toLowerCase() === "unknown";
}

function atAGlanceLines(delta: ExpectationDelta, fields: Record<EditableField, string>, signals: DeltaDetectorSignal[]): string[] {
  const expectation = normalizeText(fields.expectation);
  const reality = normalizeText(fields.reality);
  const impact = normalizeText(fields.impact);
  const signalSummary = signals.length > 0 ? `${signals[0]!.type}${signals[0]!.confidence !== null ? ` ${signals[0]!.confidence.toFixed(2)}` : ""}` : "none recorded";
  return [
    `Issue: ${issueTitle(delta)}`,
    `What happened: ${reality}`,
    `Why it matters: ${impact}`,
    `Expected: ${unknownExpectation(expectation) ? "unknown — press e to add what should have happened" : expectation}`,
    `Signal: ${signalSummary}; evidence refs: ${delta.evidenceRefs.length}`,
  ];
}

function routeGuideLine(): string {
  return "How to choose: Rule=behavior reminder | Code=confusing source | Test=missing check | Ticket=larger work | Observe=not sure";
}

function signalLine(signal: DeltaDetectorSignal): string {
  const confidence = signal.confidence !== null ? ` (${signal.confidence.toFixed(2)})` : "";
  return `${signal.type}${confidence}: ${compactSnippet(signal.explanation.replace(/\s+/g, " "), 110)}`;
}

function evidenceLine(ref: DeltaEvidenceRef): string {
  const source = [ref.sourceType, ref.sourceId ?? ref.entryId].filter(Boolean).join("/") || ref.sourceType;
  const where = [ref.cwd, ref.sessionFile].filter(Boolean).join("; ") || "local source unknown";
  const snippet = ref.snippet ? ` :: ${compactSnippet(ref.snippet.replace(/\s+/g, " "), 95)}` : "";
  return `${source} (${where})${snippet}`;
}

function evidencePreviewLine(ref: DeltaEvidenceRef): string {
  const source = [ref.sourceType, ref.sourceId ?? ref.entryId].filter(Boolean).join("/") || ref.sourceType;
  const snippet = ref.snippet ? compactSnippet(ref.snippet.replace(/\s+/g, " "), 115) : null;
  const where = ref.cwd?.split(/[\\/]/).filter(Boolean).at(-1);
  return snippet ? `${source}: ${snippet}` : `${source}: local evidence ref${where ? ` (${compactSnippet(where, 48)})` : ""}`;
}

function border(title: string, width: number): string {
  if (width <= 0) return "";
  if (width === 1) return "+";
  if (width === 2) return "++";
  const inner = width - 2;
  const label = title ? ` ${clip(title, Math.max(0, inner - 1))} ` : "";
  return `+${pad(label + "-".repeat(Math.max(0, inner - label.length)), inner)}+`;
}

function box(title: string, body: string[], width: number, maxBodyRows: number): string[] {
  if (width < 4) return [border(title, width), ...body.slice(0, maxBodyRows).map((line) => clip(line, width)), border("", width)].map((line) => clip(line, width));
  const inner = width - 4;
  const lines = [border(title, width)];
  const visibleBody = body.slice(0, Math.max(0, maxBodyRows));
  for (const line of visibleBody) lines.push(`| ${pad(line, inner)} |`);
  lines.push(border("", width));
  return lines;
}

const MODIFIER_SHIFT = 1;
const MODIFIER_ALT = 2;
const MODIFIER_CTRL = 4;
const MODIFIER_SUPER = 8;
const MODIFIER_LOCK_MASK = 64 + 128;
const KITTY_CSI_U_REGEX = /^\u001b\[(\d+)(?::(\d*))?(?::(\d+))?(?:;(\d+))?(?::(\d+))?u$/;
const KITTY_FUNCTIONAL_KEYS = new Map<number, string>([
  [57414, "enter"],
  [57417, "left"],
  [57418, "right"],
  [57419, "up"],
  [57420, "down"],
  [57421, "pageUp"],
  [57422, "pageDown"],
  [57423, "home"],
  [57424, "end"],
  [57425, "insert"],
  [57426, "delete"],
]);

function parseKittyCsiU(data: string): { codepoint: number; shiftedCodepoint: number | null; modifier: number } | null {
  const match = KITTY_CSI_U_REGEX.exec(data);
  if (!match) return null;
  const codepoint = Number.parseInt(match[1] ?? "", 10);
  if (!Number.isFinite(codepoint)) return null;
  const shiftedCodepoint = match[2] && match[2].length > 0 ? Number.parseInt(match[2], 10) : null;
  const modifierValue = match[4] ? Number.parseInt(match[4], 10) : 1;
  const modifier = Number.isFinite(modifierValue) ? modifierValue - 1 : 0;
  return { codepoint, shiftedCodepoint: Number.isFinite(shiftedCodepoint) ? shiftedCodepoint : null, modifier };
}

function normalizeKittyKey(parsed: { codepoint: number; shiftedCodepoint: number | null; modifier: number }): { key: string; modifier: number } | null {
  const functional = KITTY_FUNCTIONAL_KEYS.get(parsed.codepoint);
  if (functional) return { key: functional, modifier: parsed.modifier };
  let codepoint = parsed.codepoint;
  if ((parsed.modifier & MODIFIER_SHIFT) !== 0 && parsed.shiftedCodepoint !== null) codepoint = parsed.shiftedCodepoint;
  if (codepoint === 27) return { key: "escape", modifier: parsed.modifier };
  if (codepoint === 9) return { key: "tab", modifier: parsed.modifier };
  if (codepoint === 13) return { key: "enter", modifier: parsed.modifier };
  if (codepoint === 32) return { key: "space", modifier: parsed.modifier };
  if (codepoint === 127) return { key: "backspace", modifier: parsed.modifier };
  if (codepoint < 32) return null;
  try {
    return { key: String.fromCodePoint(codepoint), modifier: parsed.modifier };
  } catch {
    return null;
  }
}

function keyWithModifierName(key: string, modifier: number): string {
  const effectiveModifier = modifier & ~MODIFIER_LOCK_MASK;
  if (effectiveModifier === 0 || effectiveModifier === MODIFIER_SHIFT) return key;
  const parts: string[] = [];
  if ((effectiveModifier & MODIFIER_CTRL) !== 0) parts.push("ctrl");
  if ((effectiveModifier & MODIFIER_ALT) !== 0) parts.push("alt");
  if ((effectiveModifier & MODIFIER_SUPER) !== 0) parts.push("super");
  return parts.length > 0 ? `${parts.join("+")}+${key}` : key;
}

function decodeKittyPrintable(data: string): string | null {
  const parsed = parseKittyCsiU(data);
  if (!parsed) return null;
  if (KITTY_FUNCTIONAL_KEYS.has(parsed.codepoint)) return null;
  const effectiveModifier = parsed.modifier & ~MODIFIER_LOCK_MASK;
  if ((effectiveModifier & ~(MODIFIER_SHIFT)) !== 0) return null;
  let codepoint = parsed.codepoint;
  if ((effectiveModifier & MODIFIER_SHIFT) !== 0 && parsed.shiftedCodepoint !== null) codepoint = parsed.shiftedCodepoint;
  if (codepoint < 32) return null;
  try {
    return String.fromCodePoint(codepoint);
  } catch {
    return null;
  }
}

function inputText(data: string): string | null {
  const kittyPrintable = decodeKittyPrintable(data);
  if (kittyPrintable !== null) return kittyPrintable;
  if (data.length === 1 && data >= " " && data !== "\u007f") return data;
  if (data.length > 1 && !data.startsWith("\u001b")) {
    const printable = [...data].filter((char) => char >= " " && char !== "\u007f").join("");
    return printable.length > 0 ? printable : null;
  }
  return null;
}

function keyName(data: string): string {
  const parsedKitty = parseKittyCsiU(data);
  if (parsedKitty) {
    const normalized = normalizeKittyKey(parsedKitty);
    if (normalized) {
      const named = keyWithModifierName(normalized.key === "space" ? " " : normalized.key, normalized.modifier);
      return named === "ctrl+u" ? "clear" : named;
    }
  }
  switch (data) {
    case "\r":
    case "\n":
    case "return":
    case "enter":
      return "enter";
    case "\u001b":
    case "escape":
      return "escape";
    case "\u007f":
    case "\b":
    case "backspace":
      return "backspace";
    case "\t":
    case "tab":
      return "tab";
    case "\u0015":
    case "ctrl+u":
      return "clear";
    case "\u001b[A":
    case "up":
      return "up";
    case "\u001b[B":
    case "down":
      return "down";
    case "\u001b[C":
    case "right":
      return "right";
    case "\u001b[D":
    case "left":
      return "left";
    default:
      return data;
  }
}

export class FlightLearnDeltaInboxComponent implements FlightLearnCustomComponent {
  private readonly items: FlightLearnDeltaInboxItem[];
  private readonly routeChoices: Array<FlightLearnRouteChoice<ArtifactCandidateType>>;
  private readonly done: (result: Exclude<FlightLearnDeltaInboxResult, { kind: "unavailable" }>) => void;
  private readonly tui: FlightLearnInboxTui | undefined;
  private readonly theme: FlightLearnInboxTheme | undefined;
  private readonly layout: FlightLearnInboxLayout;
  private selectedItemIndex = 0;
  private selectedRouteIndex = 0;
  private evidenceExpanded = false;
  private mode: InboxMode = "review";
  private editFieldIndex = 0;
  private editSnapshot: Record<EditableField, string> | null = null;
  private readonly fieldsByDelta = new Map<string, Record<EditableField, string>>();
  private rationaleText = "";
  private statusMessage = "";
  private cachedWidth: number | undefined;
  private cachedLines: string[] | undefined;

  constructor(options: FlightLearnInboxComponentOptions) {
    this.items = options.input.items;
    this.routeChoices = options.input.routeChoices.filter((choice): choice is FlightLearnRouteChoice<ArtifactCandidateType> => isArtifactRoute(choice.value));
    this.done = options.done;
    this.tui = options.tui;
    this.theme = options.theme;
    this.layout = options.layout ?? "split-pane";
    for (const item of this.items) {
      this.fieldsByDelta.set(item.delta.id, {
        expectation: item.delta.expectation ?? "",
        reality: item.delta.reality ?? "",
        impact: item.delta.impact ?? "",
      });
    }
  }

  render(width: number): string[] {
    const safeWidth = Math.max(1, Math.floor(width));
    if (this.cachedLines && this.cachedWidth === safeWidth) return this.cachedLines;
    const plain = this.renderPlain(safeWidth);
    const styled = plain.map((line, index) => {
      if (index === 0) return this.accent(this.bold(line));
      if (line.startsWith("Active follow-up:") || line.startsWith("▶")) return this.accent(this.bold(line));
      if (this.focusedSectionHeading(line)) return this.bold(line);
      if (line.startsWith("Keys:") || line.includes("hidden by default") || line.includes("more follow-up")) return this.dim(line);
      if (this.statusMessage && line.includes(this.statusMessage)) return this.warning(line);
      return line;
    });
    this.cachedWidth = safeWidth;
    this.cachedLines = styled;
    return styled;
  }

  handleInput(data: string): void {
    const key = keyName(data);
    if (this.items.length === 0) {
      if (key === "escape" || key === "q" || key === "enter") this.done({ kind: "cancelled" });
      return;
    }
    if (this.mode === "edit") this.handleEditInput(key, data);
    else if (this.mode === "rationale") this.handleRationaleInput(key, data);
    else this.handleReviewInput(key);
  }

  invalidate(): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
  }

  private renderPlain(width: number): string[] {
    if (this.items.length === 0) return [clip("Flight Learn - no pending deltas", width), clip("Keys: q quit", width)];
    if (this.layout === "focused-card") return this.renderFocusedCardPlain(width);
    const item = this.currentItem();
    const delta = item.delta;
    const lines = [clip(`Flight Learn - ${this.items.length} pending delta${this.items.length === 1 ? "" : "s"} - selected ${this.selectedItemIndex + 1}/${this.items.length}`, width)];
    const listLines = this.itemListLines();
    const detailLines = this.deltaDetailLines(item);
    if (width >= 80) {
      const leftWidth = Math.max(24, Math.min(34, Math.floor(width * 0.34)));
      const rightWidth = Math.max(1, width - leftWidth - 1);
      const left = box("Pending deltas", listLines, leftWidth, 12);
      const right = box("Selected delta", detailLines, rightWidth, 16);
      const rowCount = Math.max(left.length, right.length);
      for (let index = 0; index < rowCount; index += 1) {
        lines.push(clip(`${pad(left[index] ?? "", leftWidth)} ${right[index] ?? ""}`, width));
      }
    } else {
      lines.push(...box("Pending deltas", listLines, width, 6));
      lines.push(...box("Selected delta", detailLines, width, 13));
    }
    lines.push(...this.routeLines(width));
    lines.push(clip("Keys: up/down item | left/right route | 1-9/0 route | enter/r route | e edit | v evidence | d dismiss | s skip | q quit", width));
    if (this.statusMessage) lines.push(clip(`Status: ${this.statusMessage}`, width));
    if (this.mode === "edit") lines.push(...this.editLines(width, delta.id));
    if (this.mode === "rationale") lines.push(...this.rationaleLines(width));
    return lines.map((line) => clip(line, width));
  }

  private renderFocusedCardPlain(width: number): string[] {
    const item = this.currentItem();
    const delta = item.delta;
    const fields = this.fieldsFor(delta.id);
    const lines: string[] = [
      clip(`Flight Learn — Issue ${this.selectedItemIndex + 1} of ${this.items.length}`, width),
      clip(`${this.items.length} pending · ${delta.evidenceRefs.length} evidence ref${delta.evidenceRefs.length === 1 ? "" : "s"} · ↑/↓ changes issue`, width),
      "",
      "Issue",
      ...wrapIndented(issueTitle(delta), width),
      "",
      "What happened?",
      ...wrapIndented(normalizeText(fields.reality), width),
      "",
      "Why it matters",
      ...wrapIndented(normalizeText(fields.impact), width),
      "",
      "Expected",
      ...wrapIndented(unknownExpectation(normalizeText(fields.expectation)) ? "unknown — press e to add what should have happened" : normalizeText(fields.expectation), width),
      "",
      "Why suggested",
      ...this.focusedSignalLines(item, width),
      "",
      "Evidence",
      ...this.focusedEvidenceLines(delta, width),
      "",
      "Choose a follow-up",
      ...this.focusedRouteLines(width),
      "",
      clip("Keys: ↑/↓ issue · ←/→ follow-up · 1-9/0 jump · enter choose · e edit · v evidence · d dismiss · s skip · q quit", width),
    ];
    if (this.statusMessage) lines.push(clip(`Status: ${this.statusMessage}`, width));
    if (this.mode === "edit") lines.push(...this.editLines(width, delta.id));
    if (this.mode === "rationale") lines.push(...this.rationaleLines(width));
    return lines.map((line) => clip(line, width));
  }

  private focusedSignalLines(item: FlightLearnDeltaInboxItem, width: number): string[] {
    const primarySignal = item.signals[0];
    if (!primarySignal) return wrapIndented("No detector signal recorded. Route only if the issue is still clear from the summary and evidence.", width);
    return wrapIndented(signalLine(primarySignal), width);
  }

  private focusedEvidenceLines(delta: ExpectationDelta, width: number): string[] {
    if (!this.evidenceExpanded) {
      return wrapIndented(`${delta.evidenceRefs.length} ref${delta.evidenceRefs.length === 1 ? "" : "s"} hidden by default — press v to view concise refs.`, width);
    }
    const refs = delta.evidenceRefs.slice(0, 5);
    const hiddenEvidence = Math.max(0, delta.evidenceRefs.length - refs.length);
    return [
      ...(refs.length > 0 ? refs.flatMap((ref) => wrapIndented(`- ${evidencePreviewLine(ref)}`, width)) : wrapIndented("No evidence refs recorded.", width)),
      ...(hiddenEvidence > 0 ? wrapIndented(`- ${hiddenEvidence} more evidence ref${hiddenEvidence === 1 ? "" : "s"}; full refs stay in local storage.`, width) : []),
    ];
  }

  private focusedRouteLines(width: number): string[] {
    if (this.routeChoices.length === 0) return wrapIndented("No follow-up choices are available.", width);
    const visibleCount = Math.min(5, this.routeChoices.length);
    const maxStart = Math.max(0, this.routeChoices.length - visibleCount);
    const start = Math.min(maxStart, Math.max(0, this.selectedRouteIndex - Math.floor(visibleCount / 2)));
    const end = Math.min(this.routeChoices.length, start + visibleCount);
    const lines: string[] = [];
    if (start > 0) lines.push(clip(`  ↑ ${start} earlier follow-up${start === 1 ? "" : "s"}`, width));
    for (let index = start; index < end; index += 1) {
      const choice = this.routeChoices[index]!;
      const selected = index === this.selectedRouteIndex;
      const marker = selected ? "▶" : " ";
      const key = keyForRouteIndex(index);
      lines.push(clip(`${marker} [${key}] ${routeLabel(choice)}`, width));
      const description = choice.description ?? "Human-reviewed follow-up choice.";
      lines.push(...wrapIndented(description, width, selected ? "    " : "    "));
    }
    const remaining = this.routeChoices.length - end;
    if (remaining > 0) lines.push(clip(`  ↓ ${remaining} more follow-up${remaining === 1 ? "" : "s"}`, width));
    return lines;
  }

  private itemListLines(): string[] {
    return this.items.map((item, index) => {
      const prefix = index === this.selectedItemIndex ? "> " : "  ";
      return `${prefix}${index + 1}/${this.items.length} ${issueTitle(item.delta)} · ${item.delta.evidenceRefs.length} ref${item.delta.evidenceRefs.length === 1 ? "" : "s"}`;
    });
  }

  private deltaDetailLines(item: FlightLearnDeltaInboxItem): string[] {
    const delta = item.delta;
    const fields = this.fieldsFor(delta.id);
    const evidence = this.evidenceExpanded ? delta.evidenceRefs.slice(0, 6) : delta.evidenceRefs.slice(0, 2);
    const hiddenEvidence = Math.max(0, delta.evidenceRefs.length - evidence.length);
    const signals = item.signals.slice(0, 3);
    return [
      `Showing item ${this.selectedItemIndex + 1} of ${this.items.length}`,
      "At a glance",
      ...atAGlanceLines(delta, fields, item.signals).map((line) => `- ${line}`),
      "",
      "Why suggested",
      ...(signals.length > 0 ? signals.map((signal) => `- ${signalLine(signal)}`) : ["- no detector signal recorded"]),
      "",
      this.evidenceExpanded ? "Evidence refs" : "Evidence preview",
      ...(evidence.length > 0 ? evidence.map((ref) => `- ${this.evidenceExpanded ? evidenceLine(ref) : evidencePreviewLine(ref)}`) : ["- no evidence refs recorded"]),
      ...(hiddenEvidence > 0 ? [`- ${hiddenEvidence} more evidence ref${hiddenEvidence === 1 ? "" : "s"}; press v to expand`] : []),
      ...(this.evidenceExpanded ? [`Record: ${delta.status}; id=${delta.id}`] : []),
    ];
  }

  private routeLines(width: number): string[] {
    if (this.routeChoices.length === 0) return [clip("Routes: none available", width)];
    const prefix = "Follow-up choices: ";
    const indent = " ".repeat(prefix.length);
    const cards = this.routeChoices.map((choice, index) => {
      const key = keyForRouteIndex(index);
      const label = `${key ? `${key} ` : ""}${routeLabel(choice)}`;
      return index === this.selectedRouteIndex ? `▶ ${label} ◀` : label;
    });
    const selected = this.currentRouteChoice();
    const selectedKey = keyForRouteIndex(this.selectedRouteIndex);
    const lines: string[] = [clip(`Active follow-up: [${selectedKey}] ${routeLabel(selected)} — ${selected.description ?? "human-reviewed follow-up choice"}`, width)];
    let current = prefix;
    for (const card of cards) {
      const safeCard = clip(card, Math.max(1, width - indent.length));
      const separator = current === prefix || current === indent ? "" : "  ";
      const candidate = `${current}${separator}${safeCard}`;
      if (candidate.length <= width) {
        current = candidate;
        continue;
      }
      if (current.trim().length > 0 && current !== prefix) lines.push(clip(current, width));
      current = `${indent}${safeCard}`;
    }
    if (current.trim().length > 0) lines.push(clip(current, width));
    lines.push(clip(routeGuideLine(), width));
    return lines.length > 0 ? lines : [clip("Route cards: none visible", width)];
  }

  private editLines(width: number, deltaId: string): string[] {
    const field = EDITABLE_FIELDS[this.editFieldIndex] ?? "expectation";
    const fields = this.fieldsFor(deltaId);
    return box("Edit delta fields", [
      `Field ${this.editFieldIndex + 1}/3: ${field}`,
      `${field}: ${fields[field]}_`,
      "Type to append | backspace delete | ctrl+u clear | tab/up/down field | enter save | esc discard edit",
    ], width, 4);
  }

  private rationaleLines(width: number): string[] {
    const choice = this.currentRouteChoice();
    return box("Why this follow-up?", [
      `Follow-up: ${choice.label}`,
      choice.description ?? "Human-reviewed follow-up choice.",
      `Reason: ${this.rationaleText}_`,
      "This fallback screen should not appear in normal Pi; press esc to return.",
      "No artifact/rule/source/doc/Loom mutation will be applied by this action.",
    ], width, 6);
  }

  private handleReviewInput(key: string): void {
    this.statusMessage = "";
    if (key === "up") this.moveItem(-1);
    else if (key === "down") this.moveItem(1);
    else if (key === "left") this.moveRoute(-1);
    else if (key === "right") this.moveRoute(1);
    else if (/^[1-9]$/.test(key)) this.selectRoute(Number(key) - 1);
    else if (key === "0") this.selectRoute(9);
    else if (key === "v") this.evidenceExpanded = !this.evidenceExpanded;
    else if (key === "e") this.startEdit();
    else if (key === "d") this.done({ kind: "dismissed", deltaId: this.currentItem().delta.id, reason: DEFAULT_DISMISS_REASON });
    else if (key === "s") this.done({ kind: "skipped", deltaId: this.currentItem().delta.id });
    else if (key === "q" || key === "escape" || key === "ctrl+c") this.done({ kind: "cancelled" });
    else if (key === "r" || key === "enter") this.startRationale();
    this.rerender();
  }

  private handleEditInput(key: string, raw: string): void {
    this.statusMessage = "";
    const deltaId = this.currentItem().delta.id;
    const field = EDITABLE_FIELDS[this.editFieldIndex] ?? "expectation";
    const fields = this.fieldsFor(deltaId);
    if (key === "enter") {
      this.editSnapshot = null;
      this.mode = "review";
    } else if (key === "escape" || key === "ctrl+c") {
      if (this.editSnapshot) this.fieldsByDelta.set(deltaId, { ...this.editSnapshot });
      this.editSnapshot = null;
      this.mode = "review";
    } else if (key === "tab" || key === "down") {
      this.editFieldIndex = (this.editFieldIndex + 1) % EDITABLE_FIELDS.length;
    } else if (key === "up") {
      this.editFieldIndex = (this.editFieldIndex + EDITABLE_FIELDS.length - 1) % EDITABLE_FIELDS.length;
    } else if (key === "backspace") {
      fields[field] = fields[field].slice(0, -1);
    } else if (key === "clear") {
      fields[field] = "";
    } else {
      const text = inputText(raw);
      if (text) fields[field] += text;
    }
    this.rerender();
  }

  private handleRationaleInput(key: string, raw: string): void {
    if (key === "escape" || key === "ctrl+c") {
      this.mode = "review";
      this.statusMessage = "Route not stored; back in review.";
    } else if (key === "enter") {
      const rationale = this.rationaleText.trim();
      if (!rationale) {
        this.statusMessage = "Type a rationale before storing a route.";
      } else {
        const delta = this.currentItem().delta;
        const fields = this.fieldsFor(delta.id);
        this.done({ kind: "routed", deltaId: delta.id, artifactType: this.currentRouteChoice().value, rationale, expectation: fields.expectation.trim() || null, reality: fields.reality.trim() || null, impact: fields.impact.trim() || null });
      }
    } else if (key === "backspace") {
      this.rationaleText = this.rationaleText.slice(0, -1);
      this.statusMessage = "";
    } else if (key === "clear") {
      this.rationaleText = "";
      this.statusMessage = "";
    } else {
      const text = inputText(raw);
      if (text) {
        this.rationaleText += text;
        this.statusMessage = "";
      }
    }
    this.rerender();
  }

  private startEdit(): void {
    this.editSnapshot = { ...this.fieldsFor(this.currentItem().delta.id) };
    this.mode = "edit";
  }

  private startRationale(): void {
    const delta = this.currentItem().delta;
    const fields = this.fieldsFor(delta.id);
    this.done({ kind: "route-selected", deltaId: delta.id, artifactType: this.currentRouteChoice().value, expectation: fields.expectation.trim() || null, reality: fields.reality.trim() || null, impact: fields.impact.trim() || null });
  }

  private moveItem(offset: number): void {
    this.selectedItemIndex = (this.selectedItemIndex + this.items.length + offset) % this.items.length;
    this.editFieldIndex = 0;
  }

  private moveRoute(offset: number): void {
    if (this.routeChoices.length === 0) return;
    this.selectedRouteIndex = (this.selectedRouteIndex + this.routeChoices.length + offset) % this.routeChoices.length;
  }

  private selectRoute(index: number): void {
    if (index >= 0 && index < this.routeChoices.length) this.selectedRouteIndex = index;
  }

  private currentItem(): FlightLearnDeltaInboxItem {
    return this.items[this.selectedItemIndex] ?? this.items[0]!;
  }

  private currentRouteChoice(): FlightLearnRouteChoice<ArtifactCandidateType> {
    return this.routeChoices[this.selectedRouteIndex] ?? this.routeChoices[0]!;
  }

  private fieldsFor(deltaId: string): Record<EditableField, string> {
    let fields = this.fieldsByDelta.get(deltaId);
    if (!fields) {
      fields = { expectation: "", reality: "", impact: "" };
      this.fieldsByDelta.set(deltaId, fields);
    }
    return fields;
  }

  private rerender(): void {
    this.invalidate();
    this.tui?.requestRender?.();
  }

  private focusedSectionHeading(line: string): boolean {
    return ["Issue", "What happened?", "Why it matters", "Expected", "Why suggested", "Evidence", "Choose a follow-up"].includes(line);
  }

  private accent(value: string): string {
    return this.theme?.fg?.("accent", value) ?? value;
  }

  private dim(value: string): string {
    return this.theme?.fg?.("dim", value) ?? value;
  }

  private warning(value: string): string {
    return this.theme?.fg?.("warning", value) ?? value;
  }

  private bold(value: string): string {
    return this.theme?.bold?.(value) ?? value;
  }
}

export function createFlightLearnDeltaInboxComponent(options: FlightLearnInboxComponentOptions): FlightLearnDeltaInboxComponent {
  return new FlightLearnDeltaInboxComponent(options);
}

export async function askFlightLearnDeltaInbox(ctx: { ui?: { custom?: <T>(factory: (tui: FlightLearnInboxTui, theme: FlightLearnInboxTheme, keybindings: unknown, done: (result: T) => void) => FlightLearnCustomComponent, options?: unknown) => Promise<T | undefined> | T | undefined } }, input: FlightLearnDeltaInboxInput): Promise<FlightLearnDeltaInboxResult> {
  if (!ctx.ui?.custom) return { kind: "unavailable" };
  try {
    const result = await ctx.ui.custom<Exclude<FlightLearnDeltaInboxResult, { kind: "unavailable" }>>((tui, theme, _keybindings, done) => createFlightLearnDeltaInboxComponent({ input, done, tui, theme, layout: "focused-card" }));
    return result ?? { kind: "cancelled" };
  } catch {
    return { kind: "unavailable" };
  }
}
