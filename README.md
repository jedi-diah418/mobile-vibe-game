# Vibe Matcher

A colorful match-3 puzzle game built for mobile! Match vibes (colorful hearts) to score points and level up. Perfect for kids and casual gaming.

## Features

- **Mobile-First Design**: Touch-friendly controls with responsive layout
- **Progressive Difficulty**: Each level gets harder with higher score targets
- **Beautiful Gradients**: 8 unique colorful vibe types with smooth animations
- **Local High Score**: Your best score is saved in browser storage
- **Hint System**: Stuck? Use the hint button to find a valid move
- **GitHub Pages Ready**: Automatically deploys on push

## How to Play

1. **Match 3 or More**: Tap two adjacent vibes to swap them
2. **Create Matches**: Line up 3+ of the same color horizontally or vertically
3. **Score Points**: Longer matches and cascades earn more points
4. **Complete Levels**: Reach the target score before running out of moves
5. **Level Up**: Each level requires more points with the same moves

## Controls

- **Desktop**: Click to select, click adjacent piece to swap
- **Mobile**: Tap to select, tap adjacent piece to swap (or drag)

## Game Mechanics

- 8x8 grid with 8 unique vibe types
- 30 moves per level
- Cascading matches for combo points
- Level multiplier increases score
- Target score increases 1.5x each level

## Local Development

Simply open `index.html` in a browser - no build process needed!

## Technologies

- Vanilla JavaScript (no dependencies)
- HTML5 & CSS3
- LocalStorage for persistence
- GitHub Actions for deployment

## Deployment

This game automatically deploys to GitHub Pages when pushed to the main branch or any `claude/**` branch.

The live game will be available at: `https://[username].github.io/mobile-vibe-game/`

## Credits

Created with Claude Code - a fun project to learn game development!

Inspired by classic match-3 games like Fishdom, Candy Crush, and Bejeweled.
