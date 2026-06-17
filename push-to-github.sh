#!/bin/bash

set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN environment variable is not set."
  echo "Please add it as a secret in your Replit project settings."
  exit 1
fi

echo "=== Git Push Script ==="
echo "Current directory: $(pwd)"
echo ""

echo "1. Configuring git user..."
git config user.name "arminabadi7"
git config user.email "arminabadi7@users.noreply.github.com"

echo ""
echo "2. Setting up remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://arminabadi7:${GITHUB_TOKEN}@github.com/arminabadi7/Kabacontent.git"
echo "Remote configured."

echo ""
echo "3. Adding all files..."
git add -A
echo "Files staged."

echo ""
echo "4. Committing changes..."
COMMIT_MSG="${COMMIT_MSG:-Auto-update: $(date '+%Y-%m-%d %H:%M:%S')}"
git diff --cached --quiet || git commit -m "$COMMIT_MSG"

echo ""
echo "5. Setting branch to main..."
git branch -M main

echo ""
echo "6. Pushing to GitHub..."
git push -u origin main

echo ""
echo "=== Done! ==="
echo "Check https://github.com/arminabadi7/Kabacontent to verify your changes were pushed."
