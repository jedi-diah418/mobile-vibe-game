# Changelog

All notable changes to Vibe Matcher will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-10-22

### Added
- Tap-to-explode functionality for special items (dynamite, bombs, nuclear)
- Special items can now be triggered by tapping them directly without requiring a swap
- More intuitive and strategic gameplay - explode bombs exactly when you want

### Fixed
- Fixed falling animation bug where pieces appeared to flow from left to right like a wave
- Pieces now properly fall straight down from top to bottom after elimination
- Removed column-based animation delay that caused the incorrect wave effect

### Changed
- All pieces now fall simultaneously from the top, creating a proper gravity-based effect
- Special items are immediately triggered when tapped, even if another piece is selected

## [1.2.2] - 2025-10-22

### Fixed
- Fixed critical bug where score wasn't resetting when advancing to next level
- Players now start each new level with 0 points instead of carrying over previous level's score
- This prevents levels from auto-completing after one move

## [1.2.1] - 2025-10-22

### Fixed
- Fixed critical bug where level complete wasn't triggering when target score was reached
- `checkLevelStatus()` now called after `isProcessing` is set to false, ensuring game state is fully settled
- Added defensive checks in `checkLevelStatus()` to prevent duplicate triggers
- Removed redundant `checkLevelStatus()` calls from `processMatches()` and `triggerSpecialItem()`

### Changed
- Improved timing of level completion check for more reliable detection
- Level now completes immediately upon reaching target score, even with moves remaining

## [1.2.0] - 2025-10-22

### Added
- Tetris-style falling animations for new pieces
- Pieces now drop from the top with rotation and fade-in effects
- Staggered column delays create a wave effect when board refills
- Calculated fall distances based on actual row position

### Changed
- Replaced instant board refill with animated `renderWithFallingAnimation()`
- Enhanced visual feedback during cascading matches

## [1.1.0] - 2025-10-22

### Added
- Special power-up items system
  - 🧨 Dynamite: 3x3 explosion (50 points per piece)
  - 💣 Bomb: 5x5 explosion (150 points per piece)
  - ☢️ Nuclear: 7x7 explosion (300 points per piece)
- Seeded random number generation for deterministic levels
- Special items spawn with increasing probability as levels progress
- Pulse animations for special items
- Version number display in footer (bottom-right)

### Changed
- Enhanced screen shake intensity for special item explosions
- Special items trigger on swap instead of requiring matches

## [1.0.0] - 2025-10-22

### Added
- Initial release of Vibe Matcher
- 8x8 game board with 8 colorful vibe types
- Match-3 gameplay with cascading combos
- Mobile-friendly touch and swipe controls
- Tap-to-select-then-tap-to-swap mechanic
- Dark mode theme with teal/cyan color priority
- Pure black background (#000000)
- Geometric symbols (◆●■▲★◈⬢◉) instead of emojis
- Score tracking system
- Level progression with increasing difficulty (1.5x score target per level)
- 30 moves per level
- High score persistence using localStorage
- Screen shake effects (small/medium/big based on match size)
- Particle burst explosions on all matches
- Smooth swap animations with rotation and scaling
- GitHub Actions workflow for automatic deployment to GitHub Pages

### Fixed
- Safari mobile browser bar covering buttons (position:fixed solution)
- Touch events not working on mobile Safari (preventDefault with passive:false)
- Swipe detection not triggering swaps (proper touchmove/touchend handling)
- Board truncation on right side (max-width/max-height constraints)
- Board size too small on mobile (reduced padding, optimized sizing)

### Changed
- Allow ALL swaps to work, not just match-making swaps (enables combo setup)
- Board always allows swaps to enable strategic play
- Moves deducted for every swap regardless of match result

## Project History

### Development Journey

**Safari Mobile Challenges**: Multiple iterations were required to get touch controls working properly on Safari iOS. The final solution involved:
- Using position:fixed with simple 100% height (avoiding dvh units)
- Preventing default on ALL touch events with {passive: false}
- Lowering swipe threshold to 15px for better responsiveness
- Implementing tap-to-select-then-tap-to-swap fallback

**Game Mechanics Evolution**: Initially only match-making swaps were allowed (like Candy Crush), but this was changed to allow all swaps so players could set up bigger combo chains.

**Visual Polish**: Screen shake and particle effects were added to all matches, not just big ones, to make the game feel more responsive and satisfying ("juice").

**Theme**: Started with multi-colored hearts, evolved to dark teal theme with geometric symbols for better visibility and modern aesthetic.

---

**Repository**: [mobile-vibe-game](https://github.com/jedi-diah418/mobile-vibe-game)
**Live Demo**: [GitHub Pages URL]
**Inspired by**: Fishdom
**Built with**: Vanilla HTML/CSS/JavaScript
