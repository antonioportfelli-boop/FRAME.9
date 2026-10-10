#!/bin/sh
cd "$(dirname "$0")" || exit 1
NODE="$(dirname "$0")/runtime/linux/node"
if [ ! -x "$NODE" ]; then
  if ! command -v node >/dev/null 2>&1; then
    echo "Node puudu. Kasuta kaasa võetavat pakki või paigalda Node.js 22."
    exit 1
  fi
  NODE=node
fi
exec "$NODE" ./serve.mjs
