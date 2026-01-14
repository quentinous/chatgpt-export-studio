#!/usr/bin/env bash
set -euo pipefail

# One-click setup and launch for macOS/Linux
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "Python 3 is required. Download it from https://www.python.org/downloads/ and rerun this script."
  exit 1
fi

if [ ! -d ".venv" ]; then
  echo "Creating virtual environment (.venv)..."
  "$PYTHON" -m venv .venv
fi

# shellcheck disable=SC1091
source ".venv/bin/activate"

echo "Installing requirements (this is quick; stdlib only)..."
pip install -r requirements.txt

echo "Launching Bandofy Export Studio GUI..."
python -m bandofy_export_studio gui
