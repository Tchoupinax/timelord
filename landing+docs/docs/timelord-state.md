---
sidebar_position: 2
sidebar_label: Script final state (TIMELORD_STATE)
---

# Script final state (TIMELORD_STATE)

When the agent runs your script, it sets an environment variable **`TIMELORD_STATE`** to the path of a temporary file. Your script can write one of three allowed values to this file so that Timelord records the job’s **final state**: `Success`, `Warning`, or `Error`.

This state is shown in the UI and stored with the job result, so you can distinguish “completed with warnings” from “completed successfully” or “failed.”

## How it works

- Before running your script, the agent creates a unique state file and passes its path in **`TIMELORD_STATE`**.
- Your script can **append** one of the allowed values to that file (e.g. at the end of the run).
- After the script finishes, the agent reads the file and uses the last allowed value (if any) as the job’s **final state**.

## Allowed values

| Value     | Meaning |
| --------- | ------- |
| `Success` | Job completed successfully (default if you don’t set a state). |
| `Warning` | Job finished but with non-critical issues (e.g. retries, skipped items). |
| `Error`   | Job failed or encountered a critical error. |

Any other content in the file is ignored; only these three strings are accepted.

## Example

Append the chosen state to the file pointed to by `$TIMELORD_STATE`:

```bash
#!/bin/bash
set -e

# ... do your work ...

if something_went_wrong_but_not_critical; then
  echo "Warning" >> "$TIMELORD_STATE"
elif something_critical_failed; then
  echo "Error" >> "$TIMELORD_STATE"
else
  echo "Success" >> "$TIMELORD_STATE"
fi
```

Or in one line at the end of your script:

```bash
echo "Warning" >> "$TIMELORD_STATE"
```

## Notes

- **Optional**: If you never write to `$TIMELORD_STATE`, the job will still run; the UI may show no specific final state or treat it as success based on exit code.
- **Append**: Use `>>` so you don’t overwrite other output if you write multiple times.
- **Exit code**: The process exit code (success/failure) is still determined by the script’s exit code; `TIMELORD_STATE` adds an extra, semantic status for the UI and history.
