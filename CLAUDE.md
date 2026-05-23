# pi-flight-recorder Working Notes

This project inherits the parent repository principle: **open source and local-first before proprietary or managed services**.

## Product posture

- Build for Pi coding-session logs under `~/.pi/agent/sessions/` and archives.
- Prefer session-aware parsing, event models, and evidence-backed episodes over generic chat embeddings.
- Keep raw source data local. Do not send session contents, commands, file paths, stack traces, or user prompts to hosted services by default.
- Optional embeddings must support local/open-source providers first.
- Do not persist secrets in Loom records, fixtures, docs, examples, or indexes; redact or hash sensitive-looking values.

## Engineering posture

- TypeScript with strict mode.
- Tests colocated with source files.
- CLI/library boundaries should be usable without Pi, then wrapped by a Pi extension.
- SQLite/FTS5 is the preferred MVP storage/search substrate.
- Every user-facing recommendation should cite the observed evidence that supports it.

## Loom

Before implementation work, read the relevant `.loom/` records. Work from tickets, not chat history.
