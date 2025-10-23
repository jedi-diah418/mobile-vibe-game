class SoundManager {
    constructor() {
        this.audioContext = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.musicGain = null;
        this.musicOscillators = [];
        this.initAudio();
    }

    initAudio() {
        // Create audio context on first user interaction
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.audioContext.destination);
            this.musicGain.gain.value = 0.1;
        }
    }

    playSwap() {
        if (!this.sfxEnabled) return;
        this.playTone(400, 0.05, 'sine', 0.15);
    }

    playMatch(matchSize) {
        if (!this.sfxEnabled) return;
        const baseFreq = 500 + (matchSize * 50);
        this.playTone(baseFreq, 0.15, 'square', 0.2);
        setTimeout(() => this.playTone(baseFreq * 1.5, 0.1, 'square', 0.15), 80);
    }

    playExplosion(size) {
        if (!this.sfxEnabled) return;
        // Big explosive sound
        this.playTone(100, 0.3, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(150, 0.2, 'sawtooth', 0.25), 100);
        setTimeout(() => this.playTone(80, 0.15, 'sawtooth', 0.2), 200);
    }

    playLevelComplete() {
        if (!this.sfxEnabled) return;
        const melody = [523, 659, 784, 1047]; // C-E-G-C
        melody.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.3), i * 150);
        });
    }

    playGameOver() {
        if (!this.sfxEnabled) return;
        const melody = [392, 349, 311, 262]; // G-F-Eb-C descending
        melody.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.25), i * 180);
        });
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) this.initAudio();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    startBackgroundMusic() {
        if (!this.musicEnabled || this.musicOscillators.length > 0) return;
        if (!this.audioContext) this.initAudio();

        // Simple ambient loop - C major arpeggio
        const notes = [262, 330, 392, 523]; // C-E-G-C
        let noteIndex = 0;

        const playNote = () => {
            if (!this.musicEnabled) return;

            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.frequency.value = notes[noteIndex];
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);

            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + 0.8);

            noteIndex = (noteIndex + 1) % notes.length;

            if (this.musicEnabled) {
                setTimeout(playNote, 600);
            }
        };

        playNote();
    }

    stopBackgroundMusic() {
        this.musicOscillators.forEach(osc => osc.stop());
        this.musicOscillators = [];
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        return this.musicEnabled;
    }

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }
}

class VibeMatcherGame {
    constructor() {
        this.boardSize = 7;
        this.vibeTypes = 5;
        this.board = [];
        this.selectedPiece = null;
        this.score = 0;
        this.level = 1;
        this.moves = 30;
        this.targetScore = 1000;
        this.isProcessing = false;
        this.highScore = this.loadHighScore();

        // Special item types
        this.SPECIAL_ITEMS = {
            DYNAMITE: 100,  // 3x3 explosion
            BOMB: 101,      // 5x5 explosion
            NUCLEAR: 102    // 7x7 explosion
        };

        // Seeded random for deterministic levels
        this.levelSeed = this.level * 12345;
        this.rng = this.seededRandom(this.levelSeed);

        // Sound manager
        this.sound = new SoundManager();

        this.initializeBoard();
        this.setupEventListeners();
        this.render();
        this.updateUI();

        // Start background music
        setTimeout(() => this.sound.startBackgroundMusic(), 500);
    }

    // Seeded random number generator for deterministic levels
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    initializeBoard() {
        // Reset seeded random for this level
        this.rng = this.seededRandom(this.levelSeed);

        // Generate initial board without matches
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                // Check if we should spawn a special item
                const specialItem = this.maybeSpawnSpecialItem(true);
                if (specialItem !== null) {
                    this.board[row][col] = specialItem;
                } else {
                    let vibeType;
                    do {
                        vibeType = Math.floor(this.rng() * this.vibeTypes);
                    } while (this.wouldCreateMatch(row, col, vibeType));
                    this.board[row][col] = vibeType;
                }
            }
        }
    }

    maybeSpawnSpecialItem(isInitialBoard = false) {
        // Probability increases with level
        const baseChance = isInitialBoard ? 0.02 : 0.05;
        const levelBonus = (this.level - 1) * 0.01;
        const spawnChance = Math.min(baseChance + levelBonus, 0.15);

        if (this.rng() < spawnChance) {
            const roll = this.rng();

            // Higher levels increase chance of better items
            const nuclearThreshold = 0.05 + (this.level * 0.01);
            const bombThreshold = 0.20 + (this.level * 0.02);

            if (roll < nuclearThreshold) {
                return this.SPECIAL_ITEMS.NUCLEAR;
            } else if (roll < bombThreshold) {
                return this.SPECIAL_ITEMS.BOMB;
            } else {
                return this.SPECIAL_ITEMS.DYNAMITE;
            }
        }

        return null;
    }

    isSpecialItem(value) {
        return value >= 100;
    }

    wouldCreateMatch(row, col, vibeType) {
        // Check horizontal match
        if (col >= 2 &&
            this.board[row][col - 1] === vibeType &&
            this.board[row][col - 2] === vibeType) {
            return true;
        }
        // Check vertical match
        if (row >= 2 &&
            this.board[row - 1][col] === vibeType &&
            this.board[row - 2][col] === vibeType) {
            return true;
        }
        return false;
    }

    setupEventListeners() {
        const boardElement = document.getElementById('game-board');

        // Mouse events for desktop
        boardElement.addEventListener('click', (e) => {
            if (this.isProcessing || this.moves <= 0) return;
            const piece = e.target.closest('.vibe-piece');
            if (piece) {
                const row = parseInt(piece.dataset.row);
                const col = parseInt(piece.dataset.col);
                this.handlePieceClick(row, col);
            }
        });

        // Unified touch/swipe system for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartRow = -1;
        let touchStartCol = -1;
        let isDragging = false;

        // Prevent all default touch behavior on the board
        boardElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        boardElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        boardElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        // Handle touch interactions
        boardElement.addEventListener('touchstart', (e) => {
            if (this.isProcessing || this.moves <= 0) return;

            const touch = e.touches[0];
            const piece = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.vibe-piece');

            if (piece) {
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                touchStartRow = parseInt(piece.dataset.row);
                touchStartCol = parseInt(piece.dataset.col);
                isDragging = false;

                this.selectPiece(touchStartRow, touchStartCol);
            }
        });

        boardElement.addEventListener('touchmove', (e) => {
            if (touchStartRow === -1 || this.isProcessing || this.moves <= 0) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;

            // Lower threshold for faster response
            if (!isDragging && (Math.abs(deltaX) > 15 || Math.abs(deltaY) > 15)) {
                isDragging = true;

                let targetRow = touchStartRow;
                let targetCol = touchStartCol;

                // Determine primary swipe direction
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    if (deltaX > 0 && touchStartCol < this.boardSize - 1) {
                        targetCol = touchStartCol + 1;
                    } else if (deltaX < 0 && touchStartCol > 0) {
                        targetCol = touchStartCol - 1;
                    }
                } else {
                    // Vertical swipe
                    if (deltaY > 0 && touchStartRow < this.boardSize - 1) {
                        targetRow = touchStartRow + 1;
                    } else if (deltaY < 0 && touchStartRow > 0) {
                        targetRow = touchStartRow - 1;
                    }
                }

                // Execute swap if we have a valid target
                if (targetRow !== touchStartRow || targetCol !== touchStartCol) {
                    this.swapPieces(touchStartRow, touchStartCol, targetRow, targetCol);
                    // Reset to prevent multiple swaps
                    touchStartRow = -1;
                    touchStartCol = -1;
                }
            }
        });

        boardElement.addEventListener('touchend', (e) => {
            // If no swipe occurred, treat it as a tap
            if (!isDragging && touchStartRow !== -1) {
                // Check if we already have a selected piece
                if (this.selectedPiece &&
                    (this.selectedPiece[0] !== touchStartRow || this.selectedPiece[1] !== touchStartCol)) {
                    // We have a different piece selected - try to swap
                    const [selectedRow, selectedCol] = this.selectedPiece;

                    if (this.areAdjacent(selectedRow, selectedCol, touchStartRow, touchStartCol)) {
                        // Adjacent pieces - swap them
                        this.swapPieces(selectedRow, selectedCol, touchStartRow, touchStartCol);
                    } else {
                        // Not adjacent - deselect old, select new
                        this.deselectPiece();
                        this.selectPiece(touchStartRow, touchStartCol);
                    }
                } else if (!this.selectedPiece) {
                    // Nothing selected yet - select this piece
                    this.selectPiece(touchStartRow, touchStartCol);
                } else {
                    // Tapped the same piece - deselect it
                    this.deselectPiece();
                }
            }

            touchStartRow = -1;
            touchStartCol = -1;
            touchStartX = 0;
            touchStartY = 0;
            isDragging = false;
        });

        // Button listeners
        document.getElementById('reset-button').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('hint-button').addEventListener('click', () => {
            this.showHint();
        });

        document.getElementById('music-button').addEventListener('click', () => {
            const enabled = this.sound.toggleMusic();
            const btn = document.getElementById('music-button');
            btn.textContent = enabled ? '🎵' : '🔇';
            btn.title = enabled ? 'Music On' : 'Music Off';
        });

        document.getElementById('message-button').addEventListener('click', () => {
            this.nextLevel();
        });
    }

    handlePieceClick(row, col) {
        if (!this.selectedPiece) {
            this.selectPiece(row, col);
        } else {
            const [selectedRow, selectedCol] = this.selectedPiece;

            // Check if clicked piece is adjacent
            if (this.areAdjacent(selectedRow, selectedCol, row, col)) {
                this.swapPieces(selectedRow, selectedCol, row, col);
            } else {
                this.deselectPiece();
                this.selectPiece(row, col);
            }
        }
    }

    selectPiece(row, col) {
        this.selectedPiece = [row, col];
        const piece = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (piece) piece.classList.add('selected');
    }

    deselectPiece() {
        if (this.selectedPiece) {
            const [row, col] = this.selectedPiece;
            const piece = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (piece) piece.classList.remove('selected');
            this.selectedPiece = null;
        }
    }

    areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    async swapPieces(row1, col1, row2, col2) {
        this.isProcessing = true;

        // Play swap sound
        this.sound.playSwap();

        // Add swapping animation
        const piece1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const piece2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        if (piece1) piece1.classList.add('swapping');
        if (piece2) piece2.classList.add('swapping');

        await this.sleep(150);

        // Check if either piece is a special item that should trigger
        const val1 = this.board[row1][col1];
        const val2 = this.board[row2][col2];

        if (this.isSpecialItem(val1)) {
            // Special item at position 1 - trigger explosion
            await this.triggerSpecialItem(row1, col1, val1);
            this.moves--;
            this.render();
            this.deselectPiece();
            this.updateUI();
            this.isProcessing = false;
            // Check level status after special item explosion completes
            this.checkLevelStatus();
            return;
        } else if (this.isSpecialItem(val2)) {
            // Special item at position 2 - trigger explosion
            await this.triggerSpecialItem(row2, col2, val2);
            this.moves--;
            this.render();
            this.deselectPiece();
            this.updateUI();
            this.isProcessing = false;
            // Check level status after special item explosion completes
            this.checkLevelStatus();
            return;
        }

        // Swap in board array - always allow the swap
        [this.board[row1][col1], this.board[row2][col2]] =
        [this.board[row2][col2], this.board[row1][col1]];

        // Deduct move immediately
        this.moves--;

        // Render the swap
        this.render();
        this.deselectPiece();
        this.updateUI();

        await this.sleep(200);

        // Check for matches and process them
        await this.processMatches();

        // Move is complete - set processing to false BEFORE checking status
        // This ensures the game state is fully settled
        this.isProcessing = false;

        // Check for level complete (score target reached) or game over
        // Called AFTER isProcessing is false so game state is settled
        this.checkLevelStatus();
    }

    checkLevelStatus() {
        // Don't check if already processing (prevents duplicate checks)
        if (this.isProcessing) return;

        const overlay = document.getElementById('message-overlay');
        const isOverlayShowing = overlay && overlay.classList.contains('show');

        // Check if level is complete (target score reached)
        if (this.score >= this.targetScore && !isOverlayShowing) {
            this.sound.playLevelComplete();
            this.showMessage('Level Complete!', `Amazing! You scored ${this.score} points! Ready for the next level?`, 'Next Level');
        }
        // Check for game over (out of moves but didn't reach target)
        else if (this.moves <= 0 && this.score < this.targetScore && !isOverlayShowing) {
            this.sound.playGameOver();
            this.showMessage('Game Over!', `You scored ${this.score} points. Try again?`, 'Restart');
        }
    }

    async triggerSpecialItem(row, col, itemType) {
        let radius;
        let scoreMultiplier;

        if (itemType === this.SPECIAL_ITEMS.DYNAMITE) {
            radius = 1; // 3x3
            scoreMultiplier = 50;
        } else if (itemType === this.SPECIAL_ITEMS.BOMB) {
            radius = 2; // 5x5
            scoreMultiplier = 150;
        } else if (itemType === this.SPECIAL_ITEMS.NUCLEAR) {
            radius = 3; // 7x7
            scoreMultiplier = 300;
        }

        // Collect all pieces to destroy
        const toDestroy = [];
        for (let r = Math.max(0, row - radius); r <= Math.min(this.boardSize - 1, row + radius); r++) {
            for (let c = Math.max(0, col - radius); c <= Math.min(this.boardSize - 1, col + radius); c++) {
                toDestroy.push([r, c]);
            }
        }

        // Play explosion sound
        this.sound.playExplosion(toDestroy.length);

        // MASSIVE screen shake for explosions!
        this.screenShake(toDestroy.length);

        // Highlight all pieces to be destroyed
        toDestroy.forEach(([r, c]) => {
            const piece = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (piece) {
                piece.classList.add('matched');
                // Create particles at each destroyed piece
                this.createParticleBurst(piece, toDestroy.length);
            }
        });

        await this.sleep(500);

        // Award points
        const points = toDestroy.length * scoreMultiplier;
        this.score += points;
        this.updateUI();

        // Remove all destroyed pieces
        toDestroy.forEach(([r, c]) => {
            this.board[r][c] = null;
        });

        // Apply gravity and fill
        this.applyGravity();
        this.fillBoard();
        this.render();

        await this.sleep(400);

        // Check for cascading matches
        await this.processMatches();

        // Level status will be checked by the caller after isProcessing is set to false
    }

    findMatches() {
        const matches = [];
        const matched = new Set();

        // Check horizontal matches
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize - 2; col++) {
                const vibeType = this.board[row][col];
                if (this.board[row][col + 1] === vibeType &&
                    this.board[row][col + 2] === vibeType) {
                    let endCol = col + 2;
                    while (endCol < this.boardSize && this.board[row][endCol] === vibeType) {
                        endCol++;
                    }
                    for (let c = col; c < endCol; c++) {
                        matched.add(`${row},${c}`);
                    }
                }
            }
        }

        // Check vertical matches
        for (let col = 0; col < this.boardSize; col++) {
            for (let row = 0; row < this.boardSize - 2; row++) {
                const vibeType = this.board[row][col];
                if (this.board[row + 1][col] === vibeType &&
                    this.board[row + 2][col] === vibeType) {
                    let endRow = row + 2;
                    while (endRow < this.boardSize && this.board[endRow][col] === vibeType) {
                        endRow++;
                    }
                    for (let r = row; r < endRow; r++) {
                        matched.add(`${r},${col}`);
                    }
                }
            }
        }

        // Convert set to array of coordinates
        matched.forEach(coord => {
            const [row, col] = coord.split(',').map(Number);
            matches.push([row, col]);
        });

        return matches;
    }

    async processMatches() {
        let matches = this.findMatches();

        while (matches.length > 0) {
            // Play match sound
            this.sound.playMatch(matches.length);

            // SCREEN SHAKE for ALL matches! Scale intensity by match size
            this.screenShake(matches.length);

            // Highlight matched pieces and create particles
            matches.forEach(([row, col]) => {
                const piece = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (piece) {
                    piece.classList.add('matched');
                    // Create particle burst at piece location
                    this.createParticleBurst(piece, matches.length);
                }
            });

            await this.sleep(400);

            // Calculate score
            const matchScore = matches.length * 10 * this.level;
            this.score += matchScore;
            this.updateUI();

            // Remove matched pieces
            matches.forEach(([row, col]) => {
                this.board[row][col] = null;
            });

            // Apply gravity
            this.applyGravity();

            // Fill empty spaces
            this.fillBoard();

            // Render with falling animation
            this.renderWithFallingAnimation();

            await this.sleep(450);

            // Check for new matches (cascading)
            matches = this.findMatches();
        }

        // Level status will be checked by the caller after isProcessing is set to false
    }

    screenShake(matchCount = 3) {
        const container = document.querySelector('.game-container');

        // Remove any existing shake class first
        container.classList.remove('shake', 'shake-small', 'shake-medium', 'shake-big');

        // Add appropriate shake class based on match size
        if (matchCount >= 6) {
            container.classList.add('shake-big');
        } else if (matchCount >= 4) {
            container.classList.add('shake-medium');
        } else {
            container.classList.add('shake-small');
        }

        setTimeout(() => {
            container.classList.remove('shake', 'shake-small', 'shake-medium', 'shake-big');
        }, 500);
    }

    createParticleBurst(pieceElement, matchCount) {
        const rect = pieceElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // More particles for ALL matches, even more for big ones
        const baseParticles = 8; // Minimum particles even for match-3
        const particleCount = Math.min(baseParticles + (matchCount * 2), 25);

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Random direction with some variation
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const velocity = 50 + Math.random() * 80; // Faster, more energetic
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);

            // Randomize particle size slightly
            const size = 6 + Math.random() * 6;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;

            document.body.appendChild(particle);

            // Remove particle after animation
            setTimeout(() => {
                particle.remove();
            }, 800);
        }
    }

    applyGravity() {
        for (let col = 0; col < this.boardSize; col++) {
            let emptyRow = this.boardSize - 1;
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    if (row !== emptyRow) {
                        this.board[emptyRow][col] = this.board[row][col];
                        this.board[row][col] = null;
                    }
                    emptyRow--;
                }
            }
        }
    }

    fillBoard() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    // Chance to spawn special item
                    const specialItem = this.maybeSpawnSpecialItem(false);
                    if (specialItem !== null) {
                        this.board[row][col] = specialItem;
                    } else {
                        this.board[row][col] = Math.floor(this.rng() * this.vibeTypes);
                    }
                }
            }
        }
    }

    render() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const vibeType = this.board[row][col];
                const piece = document.createElement('div');

                // Check if it's a special item
                if (this.isSpecialItem(vibeType)) {
                    piece.className = `vibe-piece special-item special-${vibeType}`;

                    // Special item emojis
                    if (vibeType === this.SPECIAL_ITEMS.DYNAMITE) {
                        piece.textContent = '🧨';
                    } else if (vibeType === this.SPECIAL_ITEMS.BOMB) {
                        piece.textContent = '💣';
                    } else if (vibeType === this.SPECIAL_ITEMS.NUCLEAR) {
                        piece.textContent = '☢️';
                    }
                } else {
                    piece.className = `vibe-piece vibe-${vibeType}`;

                    // Simple heart emoji for easy recognition
                    const symbols = ['❤️', '💙', '💛', '💚', '💜'];
                    piece.textContent = symbols[vibeType];
                }

                piece.dataset.row = row;
                piece.dataset.col = col;

                boardElement.appendChild(piece);
            }
        }
    }

    renderWithFallingAnimation() {
        const boardElement = document.getElementById('game-board');
        const boardRect = boardElement.getBoundingClientRect();
        const cellSize = boardRect.width / this.boardSize;

        boardElement.innerHTML = '';

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const vibeType = this.board[row][col];
                const piece = document.createElement('div');

                // Check if it's a special item
                if (this.isSpecialItem(vibeType)) {
                    piece.className = `vibe-piece special-item special-${vibeType}`;

                    // Special item emojis
                    if (vibeType === this.SPECIAL_ITEMS.DYNAMITE) {
                        piece.textContent = '🧨';
                    } else if (vibeType === this.SPECIAL_ITEMS.BOMB) {
                        piece.textContent = '💣';
                    } else if (vibeType === this.SPECIAL_ITEMS.NUCLEAR) {
                        piece.textContent = '☢️';
                    }
                } else {
                    piece.className = `vibe-piece vibe-${vibeType}`;

                    // Simple heart emoji for easy recognition
                    const symbols = ['❤️', '💙', '💛', '💚', '💜'];
                    piece.textContent = symbols[vibeType];
                }

                piece.dataset.row = row;
                piece.dataset.col = col;

                // Calculate how far this piece needs to fall (from top of board)
                const distanceToFall = (row + 1) * cellSize;
                piece.style.setProperty('--fall-distance', `${distanceToFall}px`);

                // Add staggered delay based on column
                const delay = col * 0.03;
                piece.style.animationDelay = `${delay}s`;

                piece.classList.add('falling');

                boardElement.appendChild(piece);
            }
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('target-score').textContent = this.targetScore;

        const progress = Math.min((this.score / this.targetScore) * 100, 100);
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }

    showMessage(title, text, buttonText) {
        document.getElementById('message-title').textContent = title;
        document.getElementById('message-text').textContent = text;
        document.getElementById('message-button').textContent = buttonText;
        document.getElementById('message-overlay').classList.add('show');
    }

    hideMessage() {
        document.getElementById('message-overlay').classList.remove('show');
    }

    nextLevel() {
        if (this.score >= this.targetScore) {
            this.level++;
            this.score = 0; // Reset score for new level
            this.levelSeed = this.level * 12345; // Update seed for new level
            this.targetScore = Math.floor(this.targetScore * 1.5);
            this.moves = 30;
            this.initializeBoard();
            this.render();
            this.updateUI();
        } else {
            this.resetGame();
        }
        this.hideMessage();
    }

    resetGame() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }

        this.score = 0;
        this.level = 1;
        this.levelSeed = this.level * 12345; // Reset seed
        this.moves = 30;
        this.targetScore = 1000;
        this.initializeBoard();
        this.render();
        this.updateUI();
        this.hideMessage();
    }

    showHint() {
        // Find a possible move
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                // Try swapping with right neighbor
                if (col < this.boardSize - 1) {
                    [this.board[row][col], this.board[row][col + 1]] =
                    [this.board[row][col + 1], this.board[row][col]];

                    if (this.findMatches().length > 0) {
                        // Swap back and highlight
                        [this.board[row][col], this.board[row][col + 1]] =
                        [this.board[row][col + 1], this.board[row][col]];

                        const piece1 = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        const piece2 = document.querySelector(`[data-row="${row}"][data-col="${col + 1}"]`);

                        piece1.style.transform = 'scale(1.2)';
                        piece2.style.transform = 'scale(1.2)';

                        setTimeout(() => {
                            piece1.style.transform = '';
                            piece2.style.transform = '';
                        }, 500);

                        return;
                    }

                    [this.board[row][col], this.board[row][col + 1]] =
                    [this.board[row][col + 1], this.board[row][col]];
                }

                // Try swapping with bottom neighbor
                if (row < this.boardSize - 1) {
                    [this.board[row][col], this.board[row + 1][col]] =
                    [this.board[row + 1][col], this.board[row][col]];

                    if (this.findMatches().length > 0) {
                        [this.board[row][col], this.board[row + 1][col]] =
                        [this.board[row + 1][col], this.board[row][col]];

                        const piece1 = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        const piece2 = document.querySelector(`[data-row="${row + 1}"][data-col="${col}"]`);

                        piece1.style.transform = 'scale(1.2)';
                        piece2.style.transform = 'scale(1.2)';

                        setTimeout(() => {
                            piece1.style.transform = '';
                            piece2.style.transform = '';
                        }, 500);

                        return;
                    }

                    [this.board[row][col], this.board[row + 1][col]] =
                    [this.board[row + 1][col], this.board[row][col]];
                }
            }
        }
    }

    saveHighScore() {
        localStorage.setItem('vibeMatcherHighScore', this.highScore.toString());
    }

    loadHighScore() {
        const saved = localStorage.getItem('vibeMatcherHighScore');
        return saved ? parseInt(saved) : 0;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new VibeMatcherGame();
});
