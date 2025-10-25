#!/bin/bash
# Setup script for local development
# This creates a symlink so env.js points to env.local.js

echo "Setting up local development environment..."

# Create symlink from env.js to env.local.js
cd "$(dirname "$0")"
ln -sf env.local.js js/env.js

echo "✓ Local environment configured!"
echo "✓ js/env.js now points to js/env.local.js"
echo ""
echo "To run locally:"
echo "1. Start backend: cd ../giga_fastapi && uvicorn app.main:app --reload"
echo "2. Open frontend: Open player1.html and player2.html in browser"
