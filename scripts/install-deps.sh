#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

registry_usable() {
  [ -n "${NPM_TOKEN:-}" ] && npm view @solvera/pace-core@0.1.2 version >/dev/null 2>&1
}

install_from_registry() {
  echo "Installing from npm (@solvera/pace-core@0.1.2)..."
  npm ci
}

install_from_sibling() {
  local core="../pace-core2"
  if [ ! -f "${core}/packages/core/package.json" ]; then
    echo "npm registry auth failed and ${core} was not found." >&2
    echo "Set NPM_TOKEN in .env (same token as Vercel) or clone pace-core2 beside pace-trac." >&2
    exit 1
  fi

  echo "Installing with local ${core} (npm token missing or invalid for @solvera)..."
  (
    cd "${core}"
    npm ci
    npm run build -w @solvera/pace-core
  )

  cp package.json package.json.__bak__
  node <<'NODE'
const fs = require('node:fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.dependencies['@solvera/pace-core'] = 'file:../pace-core2/packages/core';
fs.writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
NODE
  npm install
  mv package.json.__bak__ package.json
}

if registry_usable; then
  install_from_registry
else
  install_from_sibling
fi
