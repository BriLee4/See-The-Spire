#!/bin/bash
# Cloud sessions start from a fresh clone: install deps so build, typecheck and `npm run digest` work immediately.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
[ -d node_modules ] || npm ci --no-audit --no-fund
