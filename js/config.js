/**
 * CONFIGURATION FILE
 * ====================
 * This file stores all game settings in one place.
 * Think of it like a settings menu - change values here to customize the game.
 */

const CONFIG = {
    // WebSocket Configuration
    // Backend URL from environment variable or default to localhost
    WEBSOCKET_URL: window.ENV?.BACKEND_WS_URL || 'ws://localhost:8000/api/v1/game/ws',

    // Canvas Dimensions
    // NOTE: These will be synced from the backend game state
    // The backend is the "source of truth" for canvas size
    // These are just initial/fallback values
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,

    // Paddle Configuration
    PADDLE: {
        WIDTH: 10,       // How wide the paddle is
        HEIGHT: 100,     // How tall the paddle is
        COLOR: '#FFFFFF' // White color in hexadecimal
    },

    // Ball Configuration
    BALL: {
        RADIUS: 8,       // Size of the ball
        COLOR: '#FFFFFF' // White color
    },

    // Colors
    COLORS: {
        BACKGROUND: '#000000',  // Black background
        TEXT: '#FFFFFF',        // White text
        BOUNDARY: '#444444'     // Gray for center line/boundaries
    },

    // Keyboard Controls
    // These define which keys control which paddle (4-directional movement)
    CONTROLS: {
        PLAYER1: {
            UP: 'w',         // Player 1 presses 'W' to move up
            DOWN: 's',       // Player 1 presses 'S' to move down
            LEFT: 'a',       // Player 1 presses 'A' to move left
            RIGHT: 'd'       // Player 1 presses 'D' to move right
        },
        PLAYER2: {
            UP: 'ArrowUp',      // Player 2 presses Arrow Up
            DOWN: 'ArrowDown',  // Player 2 presses Arrow Down
            LEFT: 'ArrowLeft',  // Player 2 presses Arrow Left
            RIGHT: 'ArrowRight' // Player 2 presses Arrow Right
        }
    },

    // Game Settings
    GAME: {
        FPS: 60  // Frames per second - how smooth the animation is
    }
};

// Export the config so other files can use it
// Think of this like making a recipe book available to everyone in the kitchen
