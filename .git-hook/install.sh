#!/usr/bin/env bash
# Gắn Git hooks của pre-commit vào repo này.
# Config: cùng thư mục với script — .git-hook/.pre-commit-config.yaml
#
# Yêu cầu: pre-commit trong PATH (pip install pre-commit | pipx install pre-commit)
# Chạy từ bất kỳ đâu: ./.git-hook/install.sh

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HOOK_DIR/.." && pwd)"
CONFIG="$HOOK_DIR/.pre-commit-config.yaml"

if [[ ! -f "$CONFIG" ]]; then
  echo "Không thấy $CONFIG" >&2
  exit 1
fi

if ! command -v pre-commit >/dev/null 2>&1; then
  echo "Chưa có lệnh pre-commit trong PATH." >&2
  echo "Cài: pip install pre-commit   hoặc   pipx install pre-commit" >&2
  exit 1
fi

cd "$ROOT"
pre-commit install --config "$CONFIG"
pre-commit install-hooks --config "$CONFIG"
echo "Đã cài Git hooks (pre-commit) — config: .git-hook/.pre-commit-config.yaml"
