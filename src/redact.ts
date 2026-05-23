const SECRET_ASSIGNMENT = /\b(api[_-]?key|access[_-]?token|auth[_-]?token|token|password|passwd|secret|client[_-]?secret|authorization)\b\s*[:=]\s*(["'`]?)([^\s"'`]+)/gi;
const SECRET_CLI_OPTION = /(^|\s)(--(?:api[-_]?key|access[-_]?token|auth[-_]?token|token|password|passwd|secret|client[-_]?secret|authorization)(?:=|\s+))([^\s"'`]+)/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const PRIVATE_KEY = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g;
const ENV_SECRET = /\b[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY)[A-Z0-9_]*=([^\s]+)/g;
const USER_HOME_PATH = /\/(Users|home)\/[^\s/:]+/g;
const PI_SESSION_PATH = /\/(?:Users|home)\/[^\s]+\/\.pi\/agent\/sessions(?:-archive)?\/[^\s]+/g;
const TEMP_PATH = /\/(?:private\/)?var\/folders\/[^\s]+|\/tmp\/[^\s]+/g;

export function redactSecrets(input: string): string {
  return input
    .replace(PRIVATE_KEY, "[REDACTED PRIVATE KEY]")
    .replace(BEARER, "Bearer [REDACTED]")
    .replace(SECRET_CLI_OPTION, (_match, leading: string, prefix: string) => `${leading}${prefix}[REDACTED]`)
    .replace(SECRET_ASSIGNMENT, (_match, key: string) => `${key}=[REDACTED]`)
    .replace(ENV_SECRET, (match) => {
      const [key] = match.split("=");
      return `${key}=[REDACTED]`;
    });
}

export function redactLocalPaths(input: string): string {
  return redactSecrets(input)
    .replace(PI_SESSION_PATH, (match) => `<pi-session-file:${match.split("/").pop() ?? "unknown"}>`)
    .replace(TEMP_PATH, "<temp-path>")
    .replace(USER_HOME_PATH, "/$1/<user>");
}

export function sanitizeStoredText(input: string, maxLength = 1_200): string {
  return compactSnippet(redactLocalPaths(input), maxLength);
}

export function compactSnippet(input: string, maxLength = 900): string {
  const redacted = redactSecrets(input).replace(/\r\n/g, "\n").trim();
  if (redacted.length <= maxLength) return redacted;
  return `${redacted.slice(0, maxLength - 18).trimEnd()}\n...[truncated]`;
}
