#!/bin/sh
# PENTAXIS — boot the 5D projection locally or inside a Codespace.
set -eu
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  npm install
fi
echo "PENTAXIS · projecting on 0.0.0.0:8080"
exec npm run dev
