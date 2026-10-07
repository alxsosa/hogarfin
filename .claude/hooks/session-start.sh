#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Project dependencies
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || npm install -g pnpm
fi
pnpm install

# Emil Kowalski design skills (global, ~/.claude/skills)
if [ ! -d "$HOME/.claude/skills/emil-design-eng" ]; then
  npx --yes skills@latest add emilkowalski/skills -g -s '*' -a claude-code -y
fi
