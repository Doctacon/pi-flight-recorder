# Qualitative Failure Notes

Accepted narratives: 0/15.
Narrative non-acceptances: 15/15.
Narrative non-acceptance reasons: {"timeout":3,"empty-output":6,"unsupported-facts":2,"schema-invalid":1,"unsafe-output":3}.
Product-level fallback-reason cases: 10/15.
Partial local-model display cases without accepted narrative: 5/15.
Generator parse/schema/verifier: 13/13/8 of 15.
Judge calls/pass: 3/0.
Latency ms total: {"min":2593,"max":9511,"avg":4444}; generator: {"min":2592,"max":5007,"avg":3696}; judge: {"min":2003,"max":5003,"avg":3730}.
Unsafe accepted outputs: 0.

No `whatHappened` narrative passed all gates. Later model-enabled UI integration should stop/replan for this runtime rather than weakening verifier, judge, or privacy gates.

Metric clarification: replay summary `fallbackCount`/`fallbackReasons` refer to narrative non-acceptance, not necessarily complete product-level deterministic fallback. See `22-fallback-metric-errata.json` for product fallback counts.

Common validation issues:
- 2 x provider timed out before returning JSON
- 1 x display field included unsupported facts
- 3 x display field included unsafe or non-display content
- 1 x whatHappened cited an unknown factId

Common judge issues:
- 1 x local narrative judge found the narrative not useful
- 1 x local narrative judge sentence coverage did not match candidate
- 1 x local narrative judge timed out before returning JSON

Artifacts intentionally include only sanitized model-output previews, not full prompts or private sessions. Audit follow-up removed stale temp server logs without reading or persisting their contents; see `21-temp-log-cleanup.md`.
