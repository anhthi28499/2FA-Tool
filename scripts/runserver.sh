#!/usr/bin/env bash
# Chạy dev server Vite (Vue) ở local. Mở trình duyệt tại URL in ra (thường http://localhost:5173).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules ]]; then
  echo "→ Chưa có node_modules, chạy npm ci..."
  npm ci
fi

echo "→ Khởi động Vite (--host: có thể truy cập từ máy khác trong LAN)"
exec npm run dev -- --host
