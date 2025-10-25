/**
 * GAME.JS - Main Game Logic
 * ==========================
 * This file handles:
 * 1. Canvas rendering (drawing the game)
 * 2. WebSocket connection (talking to the backend)
 * 3. Keyboard input (player controls)
 * 4. Animation loop (making things move smoothly)
 */

class PongGame {
    /**
     * CONSTRUCTOR
     * ===========
     * This runs when we create a new PongGame instance
     * It sets up all the initial values we need
     */
    constructor(playerId) {
        // Store which player this is ("player1" or "player2")
        this.playerId = playerId;

        // Get the canvas element from HTML
        // Canvas is like a digital drawing board where we draw the game
        this.canvas = document.getElementById('gameCanvas');

        // Get the 2D drawing context - this is what we use to actually draw
        // Think of it like picking up a paintbrush
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size from config (will be synced from backend)
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // Scaling factors for responsive rendering
        // These help us adapt to different screen sizes
        this.scaleX = 1;
        this.scaleY = 1;

        // Track if initial dimensions have been received from backend
        this.initialDimensionsSet = false;

        // WebSocket connection (will be set up later)
        this.ws = null;

        // Game state received from server
        // This will store positions of paddles, ball, scores, etc.
        this.gameState = null;

        // Connection status
        this.connected = false;

        // Bind methods to preserve 'this' context
        // This is a JavaScript quirk - it ensures 'this' always refers to our PongGame object
        this.render = this.render.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    /**
     * INITIALIZE
     * ==========
     * Start everything up: connect to server, set up controls, start rendering
     */
    init() {
        this.connectWebSocket();
        this.setupKeyboardControls();
        this.setupResetButton();
        this.setupResponsiveCanvas();
        this.startRenderLoop();
        this.updateConnectionStatus('Connecting...');
    }

    /**
     * SETUP RESPONSIVE CANVAS
     * =======================
     * Handle window resize to maintain proper aspect ratio and scaling
     * This allows different screen sizes to work together
     */
    setupResponsiveCanvas() {
        // Listen for window resize events
        window.addEventListener('resize', this.handleResize);
        // Call once to set initial size
        this.handleResize();
    }

    /**
     * HANDLE RESIZE - Responsive Scaling Logic
     * =========================================
     * This function handles the "relativity logic" for different screen sizes
     *
     * How it works:
     * 1. Backend dimensions (canvas.width/height) are FIXED (e.g., 800x600)
     *    - These are the actual game world coordinates
     *    - All players have the SAME internal canvas resolution
     *
     * 2. Display dimensions (canvas.style.width/height) are ADAPTIVE
     *    - These scale to fit each player's screen/window size
     *    - Different players can have different display sizes
     *    - But all see the same game world!
     *
     * Example:
     * - Player 1 on laptop: canvas 800x600 displayed as 640x480 CSS pixels
     * - Player 2 on desktop: canvas 800x600 displayed as 1200x900 CSS pixels
     * - Both see the same paddle at position (100, 200) in game coordinates
     */
    handleResize() {
        if (!this.gameState || !this.initialDimensionsSet) {
            // Don't resize until we have backend dimensions
            return;
        }

        // Get the container element
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate the maximum size that fits while maintaining aspect ratio
        const gameAspectRatio = this.gameState.canvas_width / this.gameState.canvas_height;
        const containerAspectRatio = containerWidth / containerHeight;

        let displayWidth, displayHeight;

        if (containerAspectRatio > gameAspectRatio) {
            // Container is wider than game - fit to height
            displayHeight = containerHeight;
            displayWidth = displayHeight * gameAspectRatio;
        } else {
            // Container is taller than game - fit to width
            displayWidth = containerWidth;
            displayHeight = displayWidth / gameAspectRatio;
        }

        // Apply CSS scaling to fit the screen
        // NOTE: This only changes how it LOOKS, not the actual game coordinates
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;

        // Calculate scaling factors (for potential future use - mouse input, etc.)
        this.scaleX = displayWidth / this.gameState.canvas_width;
        this.scaleY = displayHeight / this.gameState.canvas_height;

        console.log(`✓ Responsive scaling applied:`);
        console.log(`  - Game world: ${this.gameState.canvas_width}x${this.gameState.canvas_height} (from backend)`);
        console.log(`  - Display size: ${displayWidth.toFixed(0)}x${displayHeight.toFixed(0)} (scaled to fit screen)`);
        console.log(`  - Scale factor: ${this.scaleX.toFixed(2)}x`);
    }

    /**
     * WEBSOCKET CONNECTION
     * ====================
     * This creates a real-time connection to our Python backend
     * Think of it like opening a phone call - both sides can talk anytime
     */
    connectWebSocket() {
        const wsUrl = `${CONFIG.WEBSOCKET_URL}/${this.playerId}`;
        console.log(`Connecting to: ${wsUrl}`);

        // Create WebSocket connection
        this.ws = new WebSocket(wsUrl);

        // Event: Connection opened successfully
        this.ws.onopen = () => {
            console.log('Connected to server!');
            this.connected = true;
            this.updateConnectionStatus('Connected');
        };

        // Event: Received a message from server
        this.ws.onmessage = (event) => {
            // Parse the JSON message
            const message = JSON.parse(event.data);

            // Handle different message types
            if (message.type === 'game_state') {
                // Update our local copy of the game state
                this.gameState = message.data;

                // IMPORTANT: Sync canvas dimensions from backend FIRST
                // Backend is the "source of truth" for game world coordinates
                // This happens BEFORE any responsive scaling logic
                if (this.gameState.canvas_width && this.gameState.canvas_height) {
                    // Only update if dimensions changed or first time
                    if (!this.initialDimensionsSet ||
                        this.canvas.width !== this.gameState.canvas_width ||
                        this.canvas.height !== this.gameState.canvas_height) {

                        // Set the actual canvas internal resolution from backend
                        this.canvas.width = this.gameState.canvas_width;
                        this.canvas.height = this.gameState.canvas_height;

                        if (!this.initialDimensionsSet) {
                            console.log(`✓ Initial canvas dimensions received from backend: ${this.canvas.width}x${this.canvas.height}`);
                            this.initialDimensionsSet = true;
                        } else {
                            console.log(`Canvas dimensions updated: ${this.canvas.width}x${this.canvas.height}`);
                        }

                        // AFTER setting backend dimensions, apply responsive scaling
                        // This adapts the visual display size to fit the player's screen
                        // while keeping the internal game coordinates the same
                        this.handleResize();
                    }
                }
            } else if (message.type === 'connected') {
                console.log(message.message);
            } else if (message.type === 'player_disconnected') {
                console.log(message.message);
                this.updateConnectionStatus('Waiting for other player...');
            }
        };

        // Event: Connection closed
        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.connected = false;
            this.updateConnectionStatus('Disconnected');
        };

        // Event: Error occurred
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('Connection error');
        };
    }

    /**
     * KEYBOARD CONTROLS
     * =================
     * Listen for key presses and send them to the server
     * Now supports continuous movement while key is held down
     */
    setupKeyboardControls() {
        // Store currently pressed keys
        this.pressedKeys = new Set();

        // Listen for key press
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();

            // Add key to pressed keys set
            this.pressedKeys.add(key);
        });

        // Listen for key release
        document.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            this.pressedKeys.delete(key);
        });

        // Continuous input loop - check every 16ms (~60 FPS)
        setInterval(() => {
            const controls = this.playerId === 'player1'
                ? CONFIG.CONTROLS.PLAYER1
                : CONFIG.CONTROLS.PLAYER2;

            // Check which keys are currently pressed and send input (4-directional)
            if (this.pressedKeys.has(controls.UP.toLowerCase())) {
                this.sendInput('UP');
            }
            if (this.pressedKeys.has(controls.DOWN.toLowerCase())) {
                this.sendInput('DOWN');
            }
            if (this.pressedKeys.has(controls.LEFT.toLowerCase())) {
                this.sendInput('LEFT');
            }
            if (this.pressedKeys.has(controls.RIGHT.toLowerCase())) {
                this.sendInput('RIGHT');
            }
        }, 16); // 16ms = ~60 FPS
    }

    /**
     * SETUP RESET BUTTON
     * ==================
     * Add event listener to reset button
     * When clicked, sends reset message to server
     */
    setupResetButton() {
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetGame();
            });
        }
    }

    /**
     * RESET GAME
     * ==========
     * Send reset message to server to restart the game
     */
    resetGame() {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify({
                type: 'reset'
            }));
        }
    }

    /**
     * SEND INPUT TO SERVER
     * ====================
     * Send player's paddle movement to the backend
     */
    sendInput(action) {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify({
                type: 'input',
                action: action  // 'UP' or 'DOWN'
            }));
        }
    }

    /**
     * RENDERING LOOP
     * ==============
     * This runs 60 times per second to draw the game
     * Like a flipbook - each frame is a new drawing
     */
    startRenderLoop() {
        // requestAnimationFrame is a browser function that calls our render method
        // It automatically runs at the screen's refresh rate (usually 60 FPS)
        const animate = () => {
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * RENDER - Draw everything on the canvas
     * ======================================
     * This is called 60 times per second
     */
    render() {
        // Clear the entire canvas (like erasing a whiteboard)
        this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // If we don't have game state yet, show waiting message
        if (!this.gameState) {
            this.drawText('Waiting for game state...', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        // Draw the center line (dashed line in the middle)
        this.drawCenterLine();

        // Draw both paddles
        this.drawPaddle(this.gameState.paddle1);
        this.drawPaddle(this.gameState.paddle2);

        // Draw the ball
        this.drawBall(this.gameState.ball);

        // Draw scores
        this.drawScores();
    }

    /**
     * DRAW CENTER LINE
     * ================
     * The dashed line down the middle of the court
     */
    drawCenterLine() {
        this.ctx.strokeStyle = CONFIG.COLORS.BOUNDARY;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]); // Dashed line: 10px dash, 10px gap

        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();

        this.ctx.setLineDash([]); // Reset to solid line
    }

    /**
     * DRAW PADDLE
     * ===========
     * Draw a rectangular paddle
     */
    drawPaddle(paddle) {
        this.ctx.fillStyle = CONFIG.PADDLE.COLOR;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    }

    /**
     * DRAW BALL
     * =========
     * Draw a circular ball
     */
    drawBall(ball) {
        this.ctx.fillStyle = CONFIG.BALL.COLOR;
        this.ctx.beginPath();
        // arc() draws a circle: (x, y, radius, startAngle, endAngle)
        // Math.PI * 2 = full circle (360 degrees)
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * DRAW SCORES
     * ===========
     * Display scores at the top
     */
    drawScores() {
        this.ctx.fillStyle = CONFIG.COLORS.TEXT;
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';

        // Player 1 score (left side)
        this.ctx.fillText(
            this.gameState.score1,
            this.canvas.width / 4,
            60
        );

        // Player 2 score (right side)
        this.ctx.fillText(
            this.gameState.score2,
            (this.canvas.width / 4) * 3,
            60
        );
    }

    /**
     * DRAW TEXT
     * =========
     * Helper method to draw centered text
     */
    drawText(text, x, y) {
        this.ctx.fillStyle = CONFIG.COLORS.TEXT;
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y);
    }

    /**
     * UPDATE CONNECTION STATUS
     * ========================
     * Update the status display on the page
     */
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = `Status: ${status}`;
        }
    }
}

/**
 * START THE GAME
 * ==============
 * This function is called from the HTML page
 * It creates a new game instance and starts it
 */
function startGame(playerId) {
    console.log(`Starting game as ${playerId}`);
    const game = new PongGame(playerId);
    game.init();
}
