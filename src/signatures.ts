import { redactSecrets } from "./redact.js";

export function normalizeFailureSignature(input: { query: string; signature?: string | null; fallbackId?: string | null }, maxLength = 500): string {
  if (input.signature?.trim()) return input.signature.trim();
  const normalized = redactSecrets(input.query)
    .toLowerCase()
    .replace(/\/users\/[^\s/]+/g, "/users/<user>")
    .replace(/[0-9a-f]{8,}/g, "<hex>")
    .replace(/\b\d+\b/g, "<num>")
    .replace(/[^\p{L}\p{N}_./:-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return normalized || input.fallbackId || "unknown-failure";
}

export function signatureTokenCount(signature: string): number {
  return new Set(signature.match(/[\p{L}\p{N}_]+/gu) ?? []).size;
}
