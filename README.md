# Giga Pong - Frontend

Real-time multiplayer Pong game built with vanilla JavaScript, HTML5 Canvas, and WebSockets.

**Live Demo:** https://giga-pong.netlify.app
**Backend:** https://giga-pong-backend.onrender.com

## Features

- **Pure vanilla JavaScript** - No frameworks, lightweight and fast
- **HTML5 Canvas** - Smooth 60 FPS rendering
- **WebSocket client** - Real-time bidirectional communication
- **4-directional paddle movement** - Full 2D gameplay (WASD + Arrow keys)
- **Responsive scaling** - Adapts to different screen sizes
- **Server-authoritative** - No client-side cheating possible
- **Multi-player support** - Two players can play simultaneously

## Project Structure

```
giga_frontend/
├── css/
│   └── style.css          # Styling for game interface
├── js/
│   ├── config.js          # Game configuration
│   ├── env.js             # Environment variables (generated)
│   ├── env.local.js       # Local development config
│   └── game.js            # Main game logic
├── index.html             # Landing page
├── player1.html           # Player 1 game view
├── player2.html           # Player 2 game view
├── netlify.toml           # Netlify deployment config
├── setup-local.sh         # Local development setup script
├── .gitignore
└── README.md
```

## Quick Start

### Play Online

1. **Player 1:** https://giga-pong.netlify.app/player1.html
2. **Player 2:** https://giga-pong.netlify.app/player2.html

### Controls

**Player 1:**
- `W` - Move up
- `S` - Move down
- `A` - Move left
- `D` - Move right

**Player 2:**
- `↑` - Move up
- `↓` - Move down
- `←` - Move left
- `→` - Move right

**Both players:**
- Click "Reset Game" to restart

## Local Development Setup

### Prerequisites

- Backend running locally (see [backend README](../giga_fastapi/README.md))
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/ShyamNS9/giga-pong-frontend.git
   cd giga-pong-frontend
   ```

2. **Set up local environment**
   ```bash
   ./setup-local.sh
   ```

   This creates a symlink so `js/env.js` points to `js/env.local.js` with localhost backend URL.

3. **Start backend** (in another terminal)
   ```bash
   cd ../giga_fastapi
   source venv/bin/activate
   uvicorn app.main:app --reload
   ```

4. **Open the game**

   Simply open the HTML files in your browser:
   - Player 1: Open `player1.html`
   - Player 2: Open `player2.html`

   Or use a local server (optional):
   ```bash
   # Python 3
   python -m http.server 8080

   # Node.js
   npx http-server -p 8080
   ```

   Then visit:
   - http://localhost:8080/player1.html
   - http://localhost:8080/player2.html

## Production Deployment (Netlify)

### Prerequisites
- GitHub account
- Netlify account (free tier)

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Deploy to Netlify**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select `giga-pong-frontend`
   - Netlify will auto-detect `netlify.toml` settings
   - Click "Deploy site"

3. **Add Environment Variable**
   - Go to Site settings → Environment variables
   - Add variable:
     ```
     Key: BACKEND_WS_URL
     Value: wss://giga-pong-backend.onrender.com/api/v1/game/ws
     ```
   - Save and trigger redeploy

4. **Update Backend CORS**

   In your Render backend, update `BACKEND_CORS_ORIGINS`:
   ```
   ["https://your-site-name.netlify.app"]
   ```

5. **Done!**

   Your game will be live at `https://your-site-name.netlify.app`

## How It Works

### Architecture

```
┌─────────────┐         WebSocket          ┌─────────────┐
│  Player 1   │◄──────────────────────────►│             │
│  Browser    │                             │   Backend   │
└─────────────┘                             │   (FastAPI) │
                                            │             │
┌─────────────┐         WebSocket          │             │
│  Player 2   │◄──────────────────────────►│             │
│  Browser    │                             └─────────────┘
└─────────────┘
```

### Game Loop

1. **60 FPS server loop** - Backend updates game state every ~16ms
2. **Client sends inputs** - Arrow keys/WASD sent via WebSocket
3. **Server processes** - Validates moves, updates positions, detects collisions
4. **Server broadcasts** - Sends updated game state to both players
5. **Client renders** - Each player draws the same game state on their canvas

### Environment Variables

The frontend uses `js/env.js` to configure the backend URL:

**Production** (built by Netlify):
```javascript
window.ENV = {
    BACKEND_WS_URL: 'wss://giga-pong-backend.onrender.com/api/v1/game/ws'
};
```

**Local Development** (js/env.local.js):
```javascript
window.ENV = {
    BACKEND_WS_URL: 'ws://localhost:8000/api/v1/game/ws'
};
```

The `setup-local.sh` script symlinks `env.js` → `env.local.js` for local dev.

## Configuration

Edit [js/config.js](js/config.js) to customize:

```javascript
const CONFIG = {
    WEBSOCKET_URL: window.ENV?.BACKEND_WS_URL || 'ws://localhost:8000/api/v1/game/ws',
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    PADDLE: {
        WIDTH: 10,
        HEIGHT: 100,
        COLOR: '#FFFFFF'
    },
    BALL: {
        RADIUS: 8,
        COLOR: '#FFFFFF'
    },
    COLORS: {
        BACKGROUND: '#000000',
        TEXT: '#FFFFFF',
        BOUNDARY: '#444444'
    }
};
```

## Security

### Client-Side Security

✅ **Server-Authoritative Architecture**
- All game logic runs on the backend
- Clients only send input and render state
- No direct manipulation of game state possible

✅ **Input Validation**
- Backend validates all player inputs
- Invalid actions are ignored
- Rate limiting prevents input flooding

⚠️ **Potential Issues**
- Clients could send inputs faster than humanly possible
- Network inspection could reveal ball trajectory
- **Impact:** Minimal - backend controls all game logic

## Tech Stack

- **Vanilla JavaScript** - No frameworks
- **HTML5 Canvas** - 2D rendering
- **WebSocket API** - Real-time communication
- **CSS3** - Styling and animations
- **Netlify** - Static site hosting

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Opera 74+

## Troubleshooting

### Connection Issues

**"Disconnected from server"**
- Check backend is running
- Verify CORS settings in backend
- Check WebSocket URL in env.js

**"Waiting for game state..."**
- Backend might be sleeping (Render free tier)
- Wait 30 seconds for cold start
- Check backend logs

### Performance Issues

**Laggy gameplay**
- Check network latency
- Ensure backend is in same region
- Close bandwidth-heavy apps

**Canvas not responsive**
- Check browser console for errors
- Ensure canvas dimensions are received from backend
- Try refreshing the page

## Development Tips

### Switching Between Local and Production

**For local development:**
```bash
./setup-local.sh
```

**For production:**
```bash
rm js/env.js
git checkout js/env.js  # Restore placeholder
```

### Debugging WebSocket Messages

Add to browser console:
```javascript
// In js/game.js, modify connectWebSocket()
this.ws.onmessage = (event) => {
    console.log('Received:', event.data);  // Add this
    const message = JSON.parse(event.data);
    // ...
};
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Acknowledgments

Built with [Claude Code](https://claude.com/claude-code)
