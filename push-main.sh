#!/bin/bash
# PUSH MAIN BRANCH TO GITHUB
# Run this command to push main branch (Claude Code cannot do this due to branch restrictions)

echo "🚀 Pushing main branch to GitHub..."
echo "=================================="
echo ""
echo "Current branch: $(git branch --show-current)"
echo "Latest commit: $(git log --oneline -1)"
echo ""

# Push main to origin
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Main branch pushed to GitHub"
    echo ""
    echo "Next steps:"
    echo "1. Go to GitHub repository settings"
    echo "2. Set 'main' as the default branch"
    echo "3. Check GitHub Actions for deployment"
    echo "4. Visit your live site to verify v1.3.2 is deployed"
    echo ""
    echo "Stale branches to delete (optional):"
    echo "  git push origin --delete claude/github-game-prototype-011CUMBnvwesYGchJP9JLQBX"
    echo "  git push origin --delete claude/fix-screen-reflow-bug-011CUNeFGkX9exZDW5fGMBmm"
else
    echo ""
    echo "❌ FAILED! Could not push main branch"
    echo ""
    echo "You may need to:"
    echo "1. Configure git credentials"
    echo "2. Have write access to the repository"
    echo "3. Or create a PR via GitHub web UI instead"
fi
