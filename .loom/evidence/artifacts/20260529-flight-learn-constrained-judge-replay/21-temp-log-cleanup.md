# Temp Server Log Cleanup

Temp directory basename: T
Matching temp log files before cleanup: 4
Matching temp log files removed: 4
Matching temp log files after cleanup: 0

Removed basenames and byte sizes:
- pfr-constrained-judge-42080.stderr.log: 44375 bytes
- pfr-constrained-judge-42080.stdout.log: 0 bytes
- pfr-constrained-judge-55686.stderr.log: 44201 bytes
- pfr-constrained-judge-55686.stdout.log: 0 bytes

No file contents were read or persisted.

Harness follow-up: run-constrained-judge-replay.mjs now unlinks stdout/stderr temp logs in finally after byte-count summarization.
