class VibeMatcherGame {
    constructor() {
        this.boardSize = 8;
        this.vibeTypes = 8;
        this.board = [];
        this.selectedPiece = null;
        this.score = 0;
        this.level = 1;
        this.moves = 30;
        this.targetScore = 1000;
        this.isProcessing = false;
        this.highScore = this.loadHighScore();

        this.initializeBoard();
        this.setupEventListeners();
        this.render();
        this.updateUI();
    }

    initializeBoard() {
        // Generate initial board without matches
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                let vibeType;
                do {
                    vibeType = Math.floor(Math.random() * this.vibeTypes);
                } while (this.wouldCreateMatch(row, col, vibeType));
                this.board[row][col] = vibeType;
            }
        }
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

        // Swap in board array - always allow the swap
        [this.board[row1][col1], this.board[row2][col2]] =
        [this.board[row2][col2], this.board[row1][col1]];

        // Deduct move immediately
        this.moves--;

        // Render the swap
        this.render();
        this.deselectPiece();
        this.updateUI();

        await this.sleep(300);

        // Check for matches and process them
        await this.processMatches();

        // Check for game over or level complete
        if (this.moves <= 0) {
            if (this.score >= this.targetScore) {
                this.showMessage('Level Complete!', 'Amazing vibes! Ready for the next level?', 'Next Level');
            } else {
                this.showMessage('Game Over!', `You scored ${this.score} points. Try again?`, 'Restart');
            }
        }

        this.isProcessing = false;
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
            // Highlight matched pieces
            matches.forEach(([row, col]) => {
                const piece = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (piece) piece.classList.add('matched');
            });

            await this.sleep(300);

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

            // Render with animation
            this.render();

            await this.sleep(300);

            // Check for new matches (cascading)
            matches = this.findMatches();
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
                    this.board[row][col] = Math.floor(Math.random() * this.vibeTypes);
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
                piece.className = `vibe-piece vibe-${vibeType}`;
                piece.dataset.row = row;
                piece.dataset.col = col;

                // Add symbol based on vibe type - geometric shapes for better visibility
                const symbols = ['◆', '●', '■', '▲', '★', '◈', '⬢', '◉'];
                piece.textContent = symbols[vibeType];

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
