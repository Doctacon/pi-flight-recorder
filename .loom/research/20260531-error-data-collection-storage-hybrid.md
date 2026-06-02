# Error Data Collection And Local Hybrid Storage

ID: research:20260531-error-data-collection-storage-hybrid
Type: Research
Status: completed
Created: 2026-05-31
Updated: 2026-05-31

## Summary

This research asks how `pi-flight-recorder` could collect and store error data better after reading Turbopuffer's hybrid-search guidance and the open-source `turbovec` project. The conclusion is not "put session logs in a vector database." The better direction is a local, typed observation ledger: collect small redacted error/attempt/validation/correction atoms and relationship edges first, keep SQLite/FTS and structured filters as the source-owned retrieval lane, and only add an optional local dense sidecar after retrieval-evaluation evidence shows a real recall gap.

`turbovec` makes the optional dense lane more plausible than the previously rejected hosted/vector-first options because it is MIT-licensed, local, online-ingest, compressed, persistent, stable-id capable, and supports search-time allowlists. Its most interesting fit is not vector-first retrieval; it is SQL/BM25/structured candidate generation followed by dense rerank inside an allowlist. That maps well to failure memory because cwd, session source, time window, status, artifact outcome, and exact error tokens should remain hard filters/gates.

This record is research and design sketching only. It does not change specs, create tickets, authorize embeddings, adopt Turbopuffer, adopt `turbovec`, or productize a storage migration.

## Question

How should `pi-flight-recorder` improve the way it collects and stores error data, inspired by `turbovec` and Turbopuffer hybrid search, while preserving the project's local-first, open-source, Pi-session-aware, evidence-backed product direction?

## Scope

Covered:

- Current local collection/storage behavior from project source and Loom records.
- Turbopuffer's hybrid-search article at `https://turbopuffer.com/docs/hybrid`, fetched 2026-05-31.
- `RyanCodrai/turbovec` at commit `efe29a184986cbf562a9847c2ac52a2990bfaca2`, fetched 2026-05-31.
- The TurboQuant arXiv abstract at `https://arxiv.org/abs/2504.19874`, fetched 2026-05-31.
- Applicability to failure episodes, live occurrences, expectation deltas, artifact candidates, recurrence/outcome feedback, and future retrieval quality.

Excluded:

- Source changes, migrations, builds, tests, package installs, model downloads, benchmarking, session indexing, or real-corpus inspection.
- Choosing a local embedding model.
- Sending raw sessions, paths, prompts, snippets, stack traces, or embeddings to hosted services.
- Replacing SQLite/FTS5 as the default local substrate.
- Treating this research as accepted intended behavior; specs/plans/tickets must own any future execution.

Freshness/recheck triggers:

- Storage schema, extractor, `/flight-learn`, or live watcher semantics materially change.
- A retrieval evaluation corpus exists and shows exact-token/FTS recall gaps.
- `turbovec` adds a JS/Node integration, changes file formats/API, or materially changes maturity.
- The project changes its local-first/open-source/privacy constraints.

## Method And Sources

Project-owned sources inspected read-only:

- `.loom/specs/failure-memory-mvp.md` - active MVP contract: local Pi JSONL ingestion, evidence-backed episodes, local SQLite/FTS5, exact-token search, redaction, no hosted memory service.
- `.loom/research/20260528-hybrid-search-place.md` - prior conclusion that Turbopuffer hybrid search is useful vocabulary/playbook but hosted Turbopuffer is rejected as default.
- `.loom/research/20260529-flight-recorder-core-loop-stocktake.md` - current product-loop map: failure memory -> expectation delta -> `/flight-learn` review -> human artifact-candidate routing -> outcome/recurrence -> later classifier readiness.
- `src/session-parser.ts` - parses Pi JSONL into session events with source refs, ancestry, text, commands, outputs, tool errors, cancellation/truncation flags.
- `src/extractor.ts` - extracts failure episodes from bash/tool failures with a branch-aware lookahead window, attempts, successful validation detection, normalized signature, files, source refs, confidence, and limits.
- `src/sync.ts` and `src/watch-service.ts` - syncs changed JSONL files into local storage and live-polls/debounces source directories.
- `src/storage.ts` - owns SQLite tables for sources/events/episodes/FTS, live occurrences, clusters, expectation deltas, detector signals, artifact candidates, recurrence links, rules, and feedback.
- `src/query.ts`, `src/signatures.ts`, `src/pattern-miner.ts`, `src/delta-capture.ts` - current query, signature, cluster, and delta-capture behavior.

External sources:

- Turbopuffer hybrid-search docs, fetched 2026-05-31: hybrid retrieval combines vector search and BM25/full-text search, can add query rewriting, rank fusion, reranking, evaluation with judgment lists/NDCG, chunking experiments, contextual retrieval, and multimodal embeddings.
- `RyanCodrai/turbovec` README at commit `efe29a184986cbf562a9847c2ac52a2990bfaca2`: highlights online ingest, no training/rebuild, search-time filtering, local operation, and filtered hybrid retrieval (`README.md` lines [18-21](https://github.com/RyanCodrai/turbovec/blob/efe29a184986cbf562a9847c2ac52a2990bfaca2/README.md#L18-L21), [60-80](https://github.com/RyanCodrai/turbovec/blob/efe29a184986cbf562a9847c2ac52a2990bfaca2/README.md#L60-L80)).
- `turbovec` API docs: stable external IDs via `IdMapIndex`, allowlist filtering, and `.tv`/`.tvim` persistence (`docs/api.md` lines [59-103](https://github.com/RyanCodrai/turbovec/blob/efe29a184986cbf562a9847c2ac52a2990bfaca2/docs/api.md#L59-L103), [107-131](https://github.com/RyanCodrai/turbovec/blob/efe29a184986cbf562a9847c2ac52a2990bfaca2/docs/api.md#L107-L131), [133-161](https://github.com/RyanCodrai/turbovec/blob/efe29a184986cbf562a9847c2ac52a2990bfaca2/docs/api.md#L133-L161)).
- `turbovec` source: `search_with_mask` computes effective top-k under masks and packs boolean masks into `u64` words (`turbovec/src/lib.rs` lines [393-482](https://github.com/RyanCodrai/turbovec/blob/efe29a184986cbf562a9847c2ac52a2990bfaca2/turbovec/src/lib.rs#L393-L482)); block-level mask early exit skips 32-vector SIMD blocks with no allowed slots (`turbovec/src/search.rs` lines [1283-1317](https://github.com/RyanCodrai/turbovec/blob/efe29a184986cbf562a9847c2ac52a2990bfaca2/turbovec/src/search.rs#L1283-L1317)); `IdMapIndex` layers stable `u64` IDs on top of slot storage (`turbovec/src/id_map.rs` lines [1-35](https://github.com/RyanCodrai/turbovec/blob/efe29a184986cbf562a9847c2ac52a2990bfaca2/turbovec/src/id_map.rs#L1-L35), [188-235](https://github.com/RyanCodrai/turbovec/blob/efe29a184986cbf562a9847c2ac52a2990bfaca2/turbovec/src/id_map.rs#L188-L235)).
- `turbovec` licensing/version files: MIT license; Rust crate `0.8.0`; Python package `0.7.0`; Python package declares Development Status `3 - Alpha`.
- TurboQuant arXiv abstract, fetched 2026-05-31: describes data-oblivious, online-friendly vector quantization using random rotation, scalar quantization, near-optimal distortion, and reduced indexing time.

No source files were edited. No tests, builds, session indexing, package installs, or model/runtime commands were run.

## Findings

### 1. The current store is local and evidence-backed, but the canonical collected data is still coarse

The implemented MVP already does the important first things correctly:

- raw Pi JSONL files remain the source of truth;
- `source_files` track size/mtime/hash/session/cwd for idempotent sync;
- `events` preserve source refs, ancestry, entry kind, redacted search text, and sanitized event data;
- `episodes` summarize failures with observed text, attempts, resolution, files, limits, confidence, and source refs;
- `episode_fts` gives exact-token/BM25 retrieval without embeddings;
- live `failure_occurrences`, `failure_clusters`, expectation deltas, artifact candidates, outcome/recurrence, and flight rules extend the product beyond one-off failure search.

The weak point is not lack of a vector index. The weak point is that the system currently projects from parsed events into several higher-level tables without a durable middle layer of typed "error observations" and relationship edges. Failure episodes, live occurrences, clusters, deltas, and artifact candidates each carry their own snippets/signatures/metadata. That works for the MVP, but future retrieval and learning will have to rediscover the same low-level facts repeatedly.

### 2. Extraction is intentionally conservative, but its outputs are projections rather than reusable atoms

`src/extractor.ts` identifies failures from non-zero/cancelled bash commands and errored tool results, then looks ahead on the same branch path for attempts and a successful validation command. It creates one `FailureEpisode` per detected failure.

That projection is useful and evidence-backed, but it bakes several choices into the episode:

- a fixed lookahead window;
- a specific definition of attempts;
- a validation-command heuristic;
- one normalized signature string;
- one joined `searchText` field;
- one inferred confidence and limit set.

Future features such as hybrid retrieval, recurrence detection, artifact-candidate learning, or classifier-readiness would benefit from keeping the lower-level facts as reusable atoms: "this event is a failure," "this event is a candidate edit/attempt," "this validation passed after these attempts on this branch," "this user correction contradicted a previous assumption," "this artifact was later applied/resolved/recurring."

### 3. Turbopuffer's useful lesson is orchestration, not the hosted service

The Turbopuffer article frames hybrid search as a search orchestration problem: multiple vector and text queries, optional query rewriting, rank fusion, reranking, evaluation, and chunk/context experiments live in application search logic. That is valuable vocabulary for this project.

The hosted Turbopuffer service itself remains a bad default fit for `pi-flight-recorder`: it is managed/proprietary, networked, and unnecessary for local personal Pi session memory. This agrees with `research:20260528-hybrid-search-place`.

The transferable idea is: keep retrieval lanes separate, evaluate them, and fuse/rerank only after each lane preserves its own strengths. For failure memory, exact stack traces, commands, file paths, package names, exit codes, cwd, source refs, artifact status, and outcome should not be blurred into a single semantic vector.

### 4. `turbovec` changes the local dense-lane feasibility story

Before `turbovec`, the likely vector options were either hosted services, heavier local vector databases, or generic embeddings bolted onto SQLite. `turbovec` is interesting because it aligns better with this project's constraints:

- MIT-licensed and local; no managed service required.
- Online ingest: add vectors without a train step or full rebuild.
- Compressed 2-4 bit representation, useful if session-derived observations eventually grow large.
- `IdMapIndex` gives stable external `u64` IDs across deletes, which can map back to SQLite-owned observation/episode/delta IDs.
- `.tvim` persistence allows a sidecar vector index file under the local data dir.
- `search_with_mask` / `allowlist` supports filtered search without over-fetching/post-filter loss.
- Search can be prepared and called concurrently from the Rust core.

The maturity caveat matters: the Python package is marked alpha, and the changelog describes recent audit-driven correctness fixes. That does not disqualify a future spike, but it argues for synthetic fixtures and evaluation before product adoption.

### 5. The allowlist/filtering behavior is the real match for failure memory

The strongest architectural fit is SQL-first candidate narrowing plus dense rerank, not vector-first retrieval.

A future query could work like this:

1. Build exact/structured candidates in SQLite: FTS tokens, cwd/project scope, source type, session time, status, artifact outcome, recurrence state, and safety gates.
2. Convert the candidate IDs to a `turbovec` allowlist.
3. Run dense search only within that allowlist.
4. Fuse FTS/BM25 score, signature similarity, recurrence/outcome score, and optional dense score.
5. Apply deterministic confidence/evidence gates before showing advice.

This preserves the product's exact-token and evidence discipline while letting dense retrieval improve ordering or recall inside a safe candidate set. It also matches `turbovec`'s kernel-level block skipping: selective allowlists avoid scoring irrelevant blocks instead of scoring the whole vector store then discarding disallowed hits.

### 6. Better collection means normalizing observations before retrieval machinery

A more durable collection model would introduce an observation ledger below episodes/deltas:

```text
raw Pi JSONL source file
  -> parsed session event
  -> observation atom
  -> observation edge / feature rows
  -> projections: episode, occurrence, cluster, delta, artifact candidate, rule
```

This should be an append-only, source-anchored ledger with an explicit unknown/candidate path, not a closed classifier that only records known error types. The ledger must tolerate missed semantics by preserving generic observations and raw source refs that can be reprocessed later when detectors improve.

Possible observation atom fields:

- stable observation ID;
- source file, session ID, cwd/project label, entry ID, parent/ancestry, timestamp;
- observation kind: `bash-failure`, `tool-error`, `cancelled-command`, `truncated-context`, `validation-pass`, `attempt-edit`, `attempt-command`, `user-correction`, `delta-candidate`, `artifact-outcome`, `unknown-signal`, etc.;
- detector/source labels and confidence, so a weak or uncertain signal can be stored without pretending it is a proven error;
- normalized signature tokens and exact anchors: command, tool, exit code, first error line, stack frames, file paths, package names, error codes;
- redacted snippet/preview and source-ref evidence;
- scope hints: cwd/project, tool, branch path, recency, status;
- limits for the observation classification itself, including why it may be incomplete or ambiguous;
- derived-feature version metadata so old observations can be reprojected after detector changes.

Possible edge rows:

- `descends-from`, `near-after`, `attempts-to-fix`, `validated-by`, `same-signature-as`, `recurs-after`, `routed-to-artifact`, `resolved-by-artifact`, `recurring-despite-artifact`, `corrects-assumption`.

Episodes and deltas then become rebuildable projections over atoms and edges, rather than the only durable place where the system remembers what happened. Misses become less damaging because the system keeps source-anchored candidate atoms and can later re-run improved detectors over existing parsed events.

### 7. Dense vectors, if added, should index redacted feature text or structured summaries, not raw transcripts

Embeddings can leak sensitive information through the text they encode and through nearest-neighbor behavior. Even local embeddings should respect the same privacy posture as snippets and Loom records.

A safer optional dense lane would embed small redacted feature documents, for example:

```text
kind: bash-failure
tool: bash
command_family: npm test
exit_code: 1
error_anchor: cannot find module <module>
file_anchors: src/config/paths.ts
attempts: edited import path; reran validation
outcome: validation-passed
limits: inferred from branch-local lookahead
```

The raw session transcript stays out of the vector sidecar. SQLite remains the owner of provenance, evidence refs, redaction, model/version metadata, and rebuild state.

### 8. A local vector sidecar needs an explicit source-of-truth contract

If a future ticket tries `turbovec`, the sidecar should not become an independent database of truth. It should be a rebuildable derivative, likely:

- SQLite table: `semantic_items(id TEXT PRIMARY KEY, numericId INTEGER UNIQUE, targetType, targetId, featureText, featureHash, embeddingModel, embeddingDim, embeddingVersion, indexVersion, createdAt, updatedAt)`.
- Local sidecar: `flight-recorder.tvim` keyed by `numericId`.
- Metadata: bit width, dim, embedding provider, redaction version, feature-extractor version, source row hashes.
- Rebuild path: recompute feature text -> embeddings -> `.tvim` from SQLite-owned rows.
- Invalidations: source file hash changed, observation projection changed, redaction rules changed, embedding model changed, or `turbovec` file format changed.

This keeps raw sessions and derived truth auditable and avoids orphaned vector IDs.

### 9. Evaluation is the gate before collection/storage changes become product work

Both the prior hybrid-search research and the Turbopuffer article point to judged query sets. That is especially important here because false positives in live failure suggestions are expensive.

A future retrieval-evaluation corpus should include:

- exact error/file/command queries;
- natural-language paraphrases of known failures;
- cwd/project cross-match cases;
- wrong-match examples that share generic words but not cause/fix;
- recurrence queries over artifact outcomes;
- live-suggestion precision thresholds;
- cases where exact FTS should beat dense similarity;
- cases where dense rerank should rescue semantically similar failures.

Without this corpus, adding `turbovec` would mostly be an attractive architecture exercise.

## Tradeoffs

### Keep current SQLite/FTS projection model

Strengths:

- Already implemented, local, inspectable, rebuildable.
- Strong exact-token behavior for stack traces, file paths, commands, and error codes.
- Low dependency and migration risk.

Weaknesses:

- Coarse projections make future retrieval/learning features duplicate feature extraction.
- Semantic/paraphrase recall remains limited.
- Separate tables each own snippets/signatures without a shared observation/edge substrate.

### Add an observation-ledger layer, no vectors yet

Strengths:

- Improves collection quality without changing privacy or search posture.
- Gives episodes/deltas/clusters/artifacts a common source of derived facts.
- Makes later eval, classifier-readiness, and retrieval-lane experiments cleaner.

Weaknesses:

- Requires a schema/model migration and careful rebuild semantics.
- Does not by itself improve semantic retrieval ranking.
- Needs spec work to avoid over-modeling every possible event relationship.

### Add local hybrid retrieval with `turbovec` after evaluation

Strengths:

- Preserves SQLite filters/FTS while adding local dense ranking.
- `turbovec` allowlists match project needs for scoped/cwd/status/outcome filtering.
- Open-source/local and compressed; avoids hosted-vector privacy conflict.

Weaknesses:

- Requires local embedding model choice, redacted feature text contract, sidecar rebuild logic, numeric ID mapping, and Node/Rust/Python integration.
- `turbovec` is young; recent changelog shows correctness fixes and Python alpha status.
- Dense retrieval can still blur exact failure signals if rank fusion/gates are weak.

### Vector-first storage/search

Strengths:

- Appealing generic RAG story and likely better natural-language recall.

Weaknesses:

- Conflicts with product identity and exact-token failure-memory requirements.
- Risks hiding evidence/provenance behind similarity scores.
- Unnecessary before eval proves FTS/structured retrieval insufficient.

Reject as default.

## Rejected Paths And Null Results

- **Hosted Turbopuffer as storage/search** - rejected for default product use by local-first/open-source/privacy constraints and by prior `research:20260528-hybrid-search-place`.
- **Generic transcript chunk embeddings** - rejected because raw chat chunks are not the product unit; episodes, observations, deltas, outcomes, and artifacts are.
- **Replacing FTS/BM25 with embeddings** - rejected because exact tokens are first-class failure signals.
- **Adding `turbovec` before evaluation** - rejected as premature; it would add integration complexity without proving better recovery.
- **Letting the vector sidecar own source truth** - rejected; SQLite/raw sessions must remain source-owned and rebuildable.
- **Embedding raw sensitive snippets by default** - rejected; even local embeddings should use redacted feature text and explicit model/version metadata.
- **Creating broad classifier automation from vectors** - rejected until manual routed/outcome corpus exists, consistent with classifier-readiness research.

## Conclusions

1. The next storage improvement should be a typed observation ledger, not a vector database.
2. Episodes, live occurrences, clusters, deltas, and artifact candidates should become projections over reusable observation atoms and relationship edges where practical.
3. SQLite/FTS5 remains the default source-owned retrieval layer. It should generate candidates and enforce hard filters/gates.
4. Turbopuffer's hybrid-search article is useful as an orchestration/evaluation pattern, not as a hosted dependency.
5. `turbovec` is the most interesting local/open-source dense sidecar found so far because online ingest, compression, stable IDs, persistence, and allowlist filtering match this project's constraints.
6. If a dense lane is ever added, it should use redacted feature documents and `turbovec` allowlist search as an optional rerank/fusion lane over SQLite-owned IDs.
7. Retrieval evaluation must precede any product storage/search migration or vector sidecar adoption.

Confidence is high for the observation-ledger direction and for rejecting hosted/vector-first defaults. Confidence is medium for `turbovec` as the right future sidecar because the project has not benchmarked it, does not yet have an embedding choice, and would need Node/Rust integration work.

## Recommendations

Recommended later work, in order:

1. **Create a spec for an error observation ledger.** Define observation kinds, source refs, redacted snippets, exact anchors, feature/version metadata, and relationship edges. Keep it narrow enough to support current episodes/deltas instead of modeling every session fact.
2. **Create a storage-schema plan only after the spec.** The plan should migrate current projections toward observation-owned atoms/edges while preserving rebuildability from raw sessions and existing SQLite/FTS behavior.
3. **Create a retrieval evaluation ticket before adding dense search.** Use fixture/redacted/disposable corpora and judge exact-token, paraphrase, wrong-match, cwd, recurrence, and live-precision scenarios.
4. **Only if evaluation shows recall/ranking gaps, create a `turbovec` sidecar spike.** Scope it to synthetic/redacted feature text, local embeddings only, stable `numericId` mapping, `.tvim` persistence, SQLite allowlists, and rank-fusion experiments. No product default.
5. **Keep live suggestions deterministic until proven otherwise.** Any dense lane should first serve offline `/flight-learn` or explicit query flows, not high-confidence live nudges.

Possible future ticket names if the operator approves this direction later:

- `spec:error-observation-ledger`
- `plan:storage-schema-v2-observation-ledger`
- `ticket:retrieval-evaluation-corpus`
- `ticket:local-hybrid-sidecar-spike`

## Open Questions

- What is the smallest observation/edge schema that improves current episodes/deltas without overfitting future dreams?
- Should observations be source-event anchored only, or can projections like artifact outcomes and manual deltas create first-class observations too?
- What redacted feature text is safe and useful enough for optional local embeddings?
- Which local/open-source embedding model, dimension, and license would fit the project if evaluation proves a need?
- How should a TypeScript/Node project integrate `turbovec`: Rust native addon, sidecar CLI/process, Python binding, or no integration until a JS path exists?
- What corpus threshold should unlock dense retrieval experiments?
- Should dense retrieval target observations, episodes, deltas, artifact candidates, or multiple target types with separate lanes?

## Related Records

- `spec:failure-memory-mvp` - owns current local failure-memory behavior and exact-token/SQLite/FTS requirements.
- `research:20260528-hybrid-search-place` - prior Turbopuffer hybrid-search applicability decision.
- `research:20260529-flight-recorder-core-loop-stocktake` - current core-loop and product priority map.
- `spec:delta-artifact-learning-loop` - owns expectation-delta/artifact/outcome semantics that an observation ledger should support, not replace.
- `research:20260525-classifier-readiness-evaluation` - explains why automation remains gated by manual routed/outcome corpus.
- `src/storage.ts`, `src/session-parser.ts`, `src/extractor.ts`, `src/sync.ts`, `src/watch-service.ts`, `src/query.ts`, `src/pattern-miner.ts`, `src/delta-capture.ts` - current implementation seams inspected for this research.
