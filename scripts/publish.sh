#!/usr/bin/env bash
#
# Builds the app and publishes it to the gh-pages branch, which GitHub Pages
# serves. Run this whenever you want the live copy brought up to date:
#
#   npm run publish
#
# Automatic publishing on every push is better, and the workflow for it sits in
# .github/deploy-workflow.yml - see the README for the one command that unlocks it.

set -euo pipefail

cd "$(dirname "$0")/.."

NAME="${GIT_AUTHOR_NAME:-$(git config user.name || echo 'wernerkonradluzny')}"
EMAIL="${GIT_AUTHOR_EMAIL:-$(git config user.email || echo '316562012+wernerkonradluzny@users.noreply.github.com')}"
REMOTE="$(git remote get-url origin)"

npm run build

STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

cp -R dist/. "$STAGING/"
# Stops GitHub Pages running the output through Jekyll, which would hide assets.
touch "$STAGING/.nojekyll"

cd "$STAGING"
git init -q -b gh-pages
git add -A
git -c user.name="$NAME" -c user.email="$EMAIL" commit -q -m "Publish $(date -u '+%Y-%m-%d %H:%M UTC')"
git push -q --force "$REMOTE" gh-pages

echo "Published to gh-pages."
