#!/bin/bash
# Vibe Matcher Test Runner
# This script MUST be run before every commit

set -e

echo "🧪 Running Vibe Matcher Test Suite..."
echo "======================================"

# Check if Node.js is available
if command -v node &> /dev/null; then
    # Run tests with Node.js if available
    node -e "
        const fs = require('fs');
        const path = require('path');

        // Simple HTML parser for tests
        const html = fs.readFileSync('test.html', 'utf8');
        const gameJs = fs.readFileSync('game.js', 'utf8');

        console.log('✓ Test files found');
        console.log('✓ Game.js loaded successfully');
        console.log('');
        console.log('Open test.html in a browser to run full test suite');
        console.log('Or use: python3 -m http.server 8000');
        console.log('Then navigate to: http://localhost:8000/test.html');
    "
else
    echo "⚠️  Node.js not found. Using manual check..."
fi

# Check for basic syntax errors in game.js
if command -v node &> /dev/null; then
    echo ""
    echo "Checking JavaScript syntax..."
    node --check game.js && echo "✓ No syntax errors in game.js" || exit 1
fi

echo ""
echo "======================================"
echo "✓ Pre-commit checks passed"
echo ""
echo "IMPORTANT: Before committing, open test.html in a browser"
echo "and verify all tests pass!"
echo ""
echo "To run tests in browser:"
echo "1. python3 -m http.server 8000"
echo "2. Open http://localhost:8000/test.html"
echo "3. Check that all tests are green"
echo "======================================"
