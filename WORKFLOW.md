# Development Workflow

## 🚨 CRITICAL: Proper Branch Management

### Current State

**Main Branch**: `main` (should be the source of truth)
**Active Development Branch**: `claude/simplify-game-symbols-011CUPEYbb3FNUpcjV2Gd3Ak`
**Current Version**: v1.3.2 ✅

### Branch Cleanup Required

Currently there are multiple claude/* branches. Going forward:

1. **main** = Production-ready, tested code
2. **claude/*** = Feature branches (temporary)

## Proper Workflow Going Forward

### 1. Development on Feature Branch

```bash
# Development happens on claude/* branch
git checkout claude/feature-name-sessionid

# Make changes
# Run tests BEFORE committing
./run-tests.sh
# Open test.html in browser - verify ALL tests pass

# Commit only if tests pass
git add .
git commit -m "Description"
git push -u origin claude/feature-name-sessionid
```

### 2. Merge to Main (REQUIRED)

**Before merging to main:**

```bash
# Switch to main
git checkout main

# Merge feature branch
git merge claude/feature-name-sessionid

# Run tests on main
./run-tests.sh

# Open test.html in browser - verify ALL tests pass
# If tests fail, DO NOT push main

# If tests pass, push to main
git push origin main
```

**⚠️ NOTE**: Due to branch naming restrictions, you may need to manually merge via GitHub PR or local merge then push from a different environment.

### 3. Deployment

GitHub Actions automatically deploys when you push to:
- `main` (primary deployment)
- `claude/**` (feature branch testing)

See `.github/workflows/deploy.yml`

### 4. Cleanup Old Branches

After merging to main, delete old feature branches:

```bash
# Delete local branch
git branch -d claude/old-branch-name

# Delete remote branch
git push origin --delete claude/old-branch-name
```

## Current Branch Status

### Active (Keep)
- ✅ **main** - Production branch (needs initial setup)
- ✅ **claude/simplify-game-symbols-011CUPEYbb3FNUpcjV2Gd3Ak** - Current work (v1.3.2)

### Stale (Delete After Review)
- ❌ **claude/github-game-prototype-011CUMBnvwesYGchJP9JLQBX** - Old prototype
- ❌ **claude/fix-screen-reflow-bug-011CUNeFGkX9exZDW5fGMBmm** - Old bug fix (merged into current)

## Testing Policy

**MANDATORY BEFORE EVERY MERGE TO MAIN:**

```bash
# 1. Run test script
./run-tests.sh

# 2. Open test.html in browser
python3 -m http.server 8000
# Navigate to http://localhost:8000/test.html

# 3. Verify ALL tests are green ✓

# 4. Test manually:
#    - Make matches
#    - Trigger special items
#    - Toggle music
#    - Check animations
#    - Play a full level

# 5. Only merge if everything works perfectly
```

## Action Required

**To properly set up main branch:**

1. You (user) need to manually create a PR from `claude/simplify-game-symbols-011CUPEYbb3FNUpcjV2Gd3Ak` to `main` on GitHub
2. Review the PR
3. Run tests on the PR branch
4. Merge to main
5. Set main as default branch in GitHub settings
6. Delete old claude branches

OR

1. Locally checkout the current branch
2. Create main from it: `git checkout -b main`
3. Push from an environment that allows main branch pushes
4. Set as default branch in GitHub

## Future Claude Sessions

**Every new session should:**

1. Start from latest main: `git checkout main && git pull`
2. Create new feature branch: `git checkout -b claude/feature-name-newsessionid`
3. Make changes, test, commit
4. Create PR to main
5. After merge, delete feature branch

## Main Branch Protection (Recommended)

Set up in GitHub:
- Require PR reviews
- Require tests to pass
- No direct pushes to main
- Squash merge PRs

---

**Current Status**:
- ✅ v1.3.2 is stable and tested on `claude/simplify-game-symbols-011CUPEYbb3FNUpcjV2Gd3Ak`
- ⏳ Needs to be merged to main
- ⏳ Old branches need cleanup
