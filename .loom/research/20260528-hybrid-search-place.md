# Hybrid Search Concepts And pi-flight-recorder

ID: research:20260528-hybrid-search-place
Type: Research
Status: completed
Created: 2026-05-28
Updated: 2026-05-28

## Summary

This research evaluated whether the Turbopuffer hybrid-search pattern belongs in `pi-flight-recorder`. The conclusion is that the pattern is useful as a future retrieval-quality playbook, but the hosted Turbopuffer service and generic vector-search framing do not belong in the default product; `pi-flight-recorder` should keep local FTS/structured episode retrieval as the baseline and only add local/open-source hybrid layers behind explicit, evidence-tested tickets.

## Question

Does Turbopuffer's hybrid-search guidance have a place in `pi-flight-recorder`, and if so where should it fit without violating the project's local-first, open-source, Pi-session-aware, outcome-aware direction?

## Scope

Covered:

- The Turbopuffer hybrid-search article at `https://turbopuffer.com/docs/hybrid`, as fetched on 2026-05-28.
- Current project constitution, MVP research, active specs, README status, and implemented search paths.
- Applicability of BM25/FTS, vector retrieval, rank fusion, reranking, query rewriting, chunking, contextual retrieval, and evaluation sets to failure-memory retrieval.

Excluded:

- Implementing any retrieval change.
- Benchmarking embeddings, rerankers, or vector stores.
- Choosing a specific local embedding model or ANN index.
- Sending raw Pi sessions, prompts, paths, stack traces, or snippets to hosted services.

Freshness: recheck if the retrieval code, specs, local/open-source embedding options, or Turbopuffer article materially change.

## Method And Sources

- `https://turbopuffer.com/docs/hybrid` - vendor documentation describing hybrid search as combined vector search and BM25 full-text search, with optional query rewriting, rank fusion, reranking, evaluation with NDCG/judgment lists, chunking experiments, contextual retrieval, and multimodal embeddings.
- `.loom/constitution/constitution.md` - defines the project as local-first, Pi-session-aware, outcome-aware failure memory rather than a generic semantic-search wrapper; prefers SQLite/FTS5, local files, and optional local/open-source embeddings before hosted APIs.
- `.loom/research/20260522-agent-session-memory-landscape.md` - already concluded that FTS5 should come before vector databases and that embeddings can help semantic clustering later but should not be required for the first recovery loop.
- `.loom/specs/failure-memory-mvp.md` - requires exact-token matching without embeddings, local inspectable storage, evidence-backed results, and no proprietary/managed memory services.
- `.loom/specs/seamless-failure-memory-ux.md` and `.loom/specs/live-failure-monitoring.md` - require conservative live suggestion gates, local capture, no hosted memory/search by default, and model assistance only under explicit privacy boundaries.
- `README.md` - current implementation already has local SQLite/FTS5, high-confidence live suggestions, local clustering/reflection, and explicit no-network/default-local posture.
- `src/storage.ts`, `src/query.ts`, `src/live-suggestions.ts`, `src/pattern-miner.ts` - current retrieval uses SQLite FTS5 with BM25 over normalized episodes, local query surfaces, conservative live suggestion gates, and deterministic pattern classifiers.

## Findings

1. Turbopuffer's core pattern is not just "use vectors"; it combines semantic vector retrieval with BM25/exact text retrieval, then fuses and optionally reranks results. That maps conceptually to `pi-flight-recorder` because failure-memory queries need both semantic similarity and exact tokens such as commands, stack frames, file paths, package names, and error codes.
2. The project already implements the BM25/full-text side locally. `src/storage.ts` creates `episode_fts` with FTS5 and orders by `bm25(episode_fts)`, while `src/query.ts` and live suggestions query local episodes through that store.
3. The current product direction deliberately rejects hosted memory/search by default. Turbopuffer, Cohere, Voyage, ZeroEntropy, and similar hosted reranking/search services conflict with the default local-first/open-source posture unless an explicit future opt-in integration is separately justified.
4. The vector side may be useful later, but not as raw transcript chunk search. The project identity and specs say the retrievable unit should remain an outcome-aware episode, occurrence cluster, delta, or evidence-backed artifact candidate, not arbitrary chat chunks.
5. Rank fusion is a better fit than replacing FTS. A future local hybrid retriever could run existing FTS/BM25 and a local embedding or signature-neighbor query in parallel, then fuse candidates before applying existing evidence/confidence/same-cwd/prior-resolution gates.
6. Reranking could help `seen-this-before` and `/flight-learn reflect`, but only if local/open-source, optional, redacted, and treated as advisory. Rerankers must not override hard product gates or turn unsupported matches into confident prior-fix suggestions.
7. Query rewriting is potentially useful for user-entered natural-language queries, but dangerous for exact failures if it drops stack frames, file paths, command names, or error tokens. A safe version would add expansions while preserving original exact tokens as an independent retrieval lane.
8. The Turbopuffer recommendation to build a judged query suite is highly applicable. `pi-flight-recorder` needs retrieval evaluation over fixture/local corpora: query -> ideal episode/cluster, wrong-match examples, NDCG-like ranking measures, and live-nudge precision thresholds.
9. Chunking/contextual retrieval is a partial fit only at the ingestion/extraction boundary. Instead of chunking transcripts for generic RAG, the better local adaptation is to enrich episode search text with structured context: normalized signature, command/tool, error tokens, files, cwd/project labels, attempted fixes, resolution evidence, and limits.

## Tradeoffs

- **Hosted Turbopuffer hybrid search** - strong managed scale story for millions of records, but conflicts with local-first/privacy/open-source defaults and is unnecessary for a personal Pi session index today.
- **Local FTS5 only** - inspectable, dependency-light, strong for exact failures, already implemented; weaker for paraphrased problems or cross-tool semantically similar failures.
- **Local hybrid retrieval over episodes** - preserves exact-token retrieval while adding semantic recall; increases complexity, model/index dependencies, evaluation burden, and privacy surface.
- **Reranking after local candidate retrieval** - can improve final ordering, especially for natural-language queries; must remain local/optional and cannot replace evidence gates.
- **Query rewriting** - can broaden recall; must preserve original token lanes and should be disabled or tightly constrained for live failure nudges.
- **Evaluation/judgment lists** - adds upfront work but is the safest prerequisite before changing ranking behavior or adding embeddings.

## Rejected Paths And Null Results

- Hosted Turbopuffer as default storage/search is rejected by project constitution and specs: raw sessions and indexes stay local by default, and proprietary/managed memory/search services are out of scope.
- Generic transcript/chunk vector search as the main product is rejected by existing research and constitution: the product is outcome-aware recovery, not another semantic chat search wrapper.
- Hosted rerankers or hosted embedding APIs for raw session data are rejected by privacy constraints unless a future explicit opt-in integration redacts/bounds inputs and is separately approved.
- Replacing FTS/BM25 with embeddings is rejected because exact stack traces, commands, file paths, and error codes are first-class query signals.

## Conclusions

The article has a place in `pi-flight-recorder` as a vocabulary and future quality-improvement playbook, not as a service dependency or architectural pivot.

The right local adaptation is:

1. Keep SQLite FTS5/BM25 as the mandatory baseline.
2. Keep the retrievable unit structured and outcome-aware: episodes, occurrences/clusters, deltas, and evidence-backed artifacts.
3. Add retrieval evaluation before adding new retrieval machinery.
4. If evidence shows recall gaps, add optional local/open-source semantic lanes and rank fusion over existing episode/cluster IDs.
5. If reranking is added, make it local/optional/advisory and keep hard safety gates deterministic.
6. Preserve original exact-token queries and source evidence regardless of any rewriting or semantic expansion.

Confidence is high for rejecting hosted/default Turbopuffer in this project and medium-high for the local hybrid direction as a future improvement. Actual value of embeddings/reranking remains unproven until evaluated against a project-specific corpus.

## Recommendations

- Do not implement Turbopuffer or hosted rerankers in the default product.
- If retrieval quality becomes a priority, first create a spec/ticket for a local retrieval evaluation harness: fixture queries, ideal prior episodes/clusters, wrong-match examples, ranking metrics, and live-nudge precision checks.
- Only after evaluation exposes recall gaps, create a bounded plan/ticket for local hybrid retrieval: FTS lane + local embedding/signature lane + rank fusion + existing gates.
- Consider promoting the settled explanation into knowledge if future agents repeatedly ask whether vector/hybrid search belongs here.

## Open Questions

- Which local/open-source embedding model and vector index would be small enough and license-compatible if evaluation shows a real need?
- What minimum retrieval-evaluation corpus size should unlock advisory semantic retrieval experiments?
- Should semantic retrieval apply first to offline `/flight-learn` reflection rather than live suggestions, where false positives are more disruptive?

## Related Records

- `constitution:main` - owns the local-first, Pi-session-aware, outcome-aware architectural judgment.
- `research:20260522-agent-session-memory-landscape` - earlier landscape research that rejected vector-first/generic semantic session search for the MVP.
- `spec:failure-memory-mvp` - requires local FTS/exact-token retrieval without embeddings.
- `spec:seamless-failure-memory-ux` - constrains live suggestions and model/search privacy boundaries.
- `src/storage.ts` - current local FTS5/BM25 implementation.
