# Testing Policy for Vibe Matcher

## 🚨 CRITICAL REQUIREMENT 🚨

**ALL CODE CHANGES MUST PASS TESTS BEFORE COMMITTING**

This project has experienced multiple regressions due to untested changes. To prevent future bugs:

## Test Suite Location

- **Test File**: `test.html`
- **Test Runner**: `run-tests.sh`

## How to Run Tests

### Method 1: Browser (Recommended)

```bash
# Start a local server
python3 -m http.server 8000

# Open in browser
# Navigate to: http://localhost:8000/test.html

# Check that ALL tests are green (✓)
```

### Method 2: Command Line

```bash
chmod +x run-tests.sh
./run-tests.sh
```

## Test Coverage

The test suite covers:

1. **Board Initialization**
   - Correct board size (7x7)
   - Correct vibe types (5 types)
   - No initial matches
   - Valid cell values

2. **Match Detection**
   - Horizontal matches (3, 4, 5)
   - Vertical matches (3, 4, 5)
   - Special items NOT matched
   - Null values ignored

3. **Gravity System**
   - Pieces fall correctly
   - All columns processed
   - Empty cells remain empty at top

4. **Special Items**
   - Recognized correctly (100, 101, 102)
   - Not matched in match-3
   - Excluded from wouldCreateMatch

5. **Score & Game State**
   - Initial values correct
   - Score, moves, level tracking

6. **Swap Validation**
   - Adjacent piece detection
   - Diagonal/distant rejection

7. **Seeded Random**
   - Deterministic generation
   - Consistent boards

8. **Board Filling**
   - Null cells filled
   - Non-null cells unchanged

## Pre-Commit Checklist

Before EVERY commit, you MUST:

1. ✅ Run `./run-tests.sh`
2. ✅ Open `test.html` in browser
3. ✅ Verify ALL tests pass (green ✓)
4. ✅ Test manually in browser (make a few moves)
5. ✅ Check console for errors
6. ✅ Only then commit

## Adding New Tests

When adding new features, add corresponding tests to `test.html`:

```javascript
runner.test('Your test description', () => {
    const game = new VibeMatcherGame();
    // Your test code
    assert(condition, 'Error message');
});
```

## CI/CD Integration

Future: Add GitHub Actions workflow to run tests automatically:

```yaml
# .github/workflows/test.yml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: ./run-tests.sh
```

## Regression Prevention

**Common issues that tests prevent:**

1. ❌ Board re-rendering breaking match detection
2. ❌ Special items being matched
3. ❌ Gravity not working correctly
4. ❌ Initial board spawning with matches
5. ❌ False match eliminations
6. ❌ Hanging matches that don't complete

## Emergency Debugging

If tests fail:

1. Open browser console (F12)
2. Check error messages
3. Look at which test failed
4. Fix the issue
5. Re-run tests
6. Only commit when ALL tests pass

## Test Failure = DO NOT COMMIT

**No exceptions.** If even one test fails, the code is broken and should not be committed.

---

**Last Updated**: 2025-10-23
**Test Suite Version**: 1.0.0
