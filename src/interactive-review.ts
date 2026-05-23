export interface ReviewUi {
  select?: (message: string, choices: string[]) => Promise<string | undefined> | string | undefined;
  editor?: (message: string, prefilled?: string) => Promise<string | undefined> | string | undefined;
  confirm?: (title: string, message: string) => Promise<boolean> | boolean;
  notify?: (message: string, level?: "info" | "error" | "success" | "warning") => void;
}

export interface ReviewContextLike {
  ui?: ReviewUi;
}

export interface ReviewChoice<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export type ReviewChoiceResult<T extends string = string> =
  | { kind: "selected"; value: T; label: string }
  | { kind: "cancelled"; reason: "no-ui" | "dismissed" };

function choiceText(choice: ReviewChoice): string {
  return choice.description ? `${choice.label} — ${choice.description}` : choice.label;
}

export async function askReviewChoice<T extends string>(ctx: ReviewContextLike, title: string, choices: Array<ReviewChoice<T>>): Promise<ReviewChoiceResult<T>> {
  if (!ctx.ui?.select) return { kind: "cancelled", reason: "no-ui" };
  const labels = choices.map(choiceText);
  const selected = await ctx.ui.select(title, labels);
  if (!selected) return { kind: "cancelled", reason: "dismissed" };
  const index = labels.indexOf(selected);
  const choice = index >= 0 ? choices[index] : choices.find((item) => item.label === selected);
  if (!choice) return { kind: "cancelled", reason: "dismissed" };
  return { kind: "selected", value: choice.value, label: choice.label };
}

export type ReviewTextResult = { kind: "submitted"; text: string } | { kind: "cancelled"; reason: "no-ui" | "dismissed" };

export async function askReviewEditor(ctx: ReviewContextLike, title: string, initialText: string): Promise<ReviewTextResult> {
  if (!ctx.ui?.editor) return { kind: "cancelled", reason: "no-ui" };
  const text = await ctx.ui.editor(title, initialText);
  if (text === undefined) return { kind: "cancelled", reason: "dismissed" };
  return { kind: "submitted", text };
}

export function fallbackMessage(reason: "no-ui" | "dismissed", fallback: string): string {
  return reason === "no-ui" ? `Interactive review is unavailable in this Pi mode. ${fallback}` : "Interactive review cancelled; no changes were applied.";
}
