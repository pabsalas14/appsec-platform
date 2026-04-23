#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Post-clone customization for repos generated from this template.
#
# Usage:
#   ./scripts/init.sh <project-slug>
#
# Does:
#   1. Renames the framework placeholder across docker-compose, package.json,
#      backend pyproject/config, and README.
#   2. Creates a fresh .env from .env.example with a newly generated SECRET_KEY
#      and prompts for ADMIN_EMAIL / ADMIN_PASSWORD.
#   3. Removes template-only files.
#   4. Re-initializes git and creates the first commit.
#
# The script is idempotent-ish: it refuses to re-run if .env already exists
# unless you pass --force.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
CYAN=$'\033[0;36m'
NC=$'\033[0m'

FORCE=0
SLUG=""

usage() {
  cat <<EOF
Usage: $0 [--force] <project-slug>

Example:
  $0 my-awesome-app
  $0 --force my-awesome-app
EOF
}

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    -h|--help) usage; exit 0 ;;
    -*)
      printf "%sUnknown option: %s%s\n" "$RED" "$arg" "$NC" >&2
      usage; exit 1 ;;
    *) SLUG="$arg" ;;
  esac
done

if [[ -z "$SLUG" ]]; then
  printf "%sproject-slug is required.%s\n" "$RED" "$NC" >&2
  usage; exit 1
fi

if [[ ! "$SLUG" =~ ^[a-z][a-z0-9-]{1,40}$ ]]; then
  printf "%sSlug must be lowercase, 2-41 chars, letters/digits/dashes.%s\n" "$RED" "$NC" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Portable in-place sed: BSD (macOS) needs a backup-suffix arg, GNU doesn't.
if sed --version >/dev/null 2>&1; then
  SED_INPLACE=(sed -i)
else
  SED_INPLACE=(sed -i '')
fi

printf "%sInitializing project:%s %s\n" "$CYAN" "$NC" "$SLUG"

# ─── 1. Rename placeholder ────────────────────────────────────────────────
OLD_NAMES=(appsec-platform appsec_platform)
for old in "${OLD_NAMES[@]}"; do
  new="${SLUG//-/_}"
  [[ "$old" == "appsec-platform" ]] && new="$SLUG"
  printf "  %sreplacing%s %s → %s\n" "$YELLOW" "$NC" "$old" "$new"
  # Limit to plain-text config files; skip node_modules, .git, vendored assets
  grep -rl --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next \
    --exclude-dir=__pycache__ --exclude-dir=venv --exclude-dir=.venv \
    --exclude='*.lock' --exclude='*.lockb' --exclude='*.png' --exclude='*.jpg' \
    "$old" . 2>/dev/null \
    | xargs -I{} "${SED_INPLACE[@]}" "s|$old|$new|g" "{}"
done

# ─── 2. Generate SECRET_KEY ───────────────────────────────────────────────
if [[ -f .env && $FORCE -eq 0 ]]; then
  printf "%s.env already exists. Use --force to overwrite.%s\n" "$RED" "$NC"
  exit 1
fi

SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(64))')

read -r -p "Admin email [admin@example.com]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}

read -r -s -p "Admin password (min 8 chars) [auto-generated]: " ADMIN_PASSWORD
printf "\n"
if [[ -z "$ADMIN_PASSWORD" ]]; then
  ADMIN_PASSWORD=$(python3 -c 'import secrets; print(secrets.token_urlsafe(16))')
  printf "  %sgenerated admin password:%s %s\n" "$YELLOW" "$NC" "$ADMIN_PASSWORD"
fi

cp .env.example .env
# Safe sed (no ampersand/backslash in generated values)
"${SED_INPLACE[@]}" "s|^SECRET_KEY=.*|SECRET_KEY=${SECRET_KEY}|" .env
"${SED_INPLACE[@]}" "s|^ADMIN_EMAIL=.*|ADMIN_EMAIL=${ADMIN_EMAIL}|" .env
"${SED_INPLACE[@]}" "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=${ADMIN_PASSWORD}|" .env
printf "  %swrote .env%s\n" "$GREEN" "$NC"

# ─── 3. Remove template-only artefacts ────────────────────────────────────
if [[ -f TEMPLATE.md ]]; then
  rm -f TEMPLATE.md
  printf "  %sremoved TEMPLATE.md%s\n" "$YELLOW" "$NC"
fi
if [[ -f .github/template-cleanup.yml ]]; then
  rm -f .github/template-cleanup.yml
  printf "  %sremoved .github/template-cleanup.yml%s\n" "$YELLOW" "$NC"
fi
if [[ -d .cursor/plans ]]; then
  rm -rf .cursor/plans
  printf "  %sremoved .cursor/plans/%s\n" "$YELLOW" "$NC"
fi

# ─── 4. Re-init git ───────────────────────────────────────────────────────
if [[ -d .git ]]; then
  rm -rf .git
fi
git init --quiet
git add -A
git -c user.email="init@example.com" -c user.name="init" \
  commit --quiet -m "chore: init from framework template ($SLUG)" || true

cat <<EOF

${GREEN}Done.${NC}

Next steps:
  1. ${CYAN}make up${NC}              # build & start all services
  2. ${CYAN}make seed${NC}            # create the admin user
  3. Open http://127.0.0.1 and login as ${ADMIN_EMAIL}.
EOF
