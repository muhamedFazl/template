# 🎮 2D Platformer Game Template

A lightweight, zero-dependency, pure HTML5 Canvas + Vanilla JavaScript 2D platformer template.

No build tools, npm packages, or bundlers required. Double click `index.html` to play directly in your browser.

---

## 🕹️ Controls

| Action | Keys |
| :--- | :--- |
| **Move Left / Right** | <kbd>A</kbd> / <kbd>D</kbd> or <kbd>←</kbd> / <kbd>→</kbd> |
| **Jump** | <kbd>Space</kbd> / <kbd>W</kbd> / <kbd>↑</kbd> |
| **Respawn** | <kbd>R</kbd> |
| **Toggle Debug Info** | <kbd>F3</kbd> or <kbd>`</kbd> (Backquote) |

---

## 🚀 Quickstart & Development Workflow

1. Open `index.html` in any web browser (Chrome, Edge, Firefox, Safari).
2. Edit [`game.js`](game.js) or [`style.css`](style.css) with your preferred code editor.
3. Refresh your browser (<kbd>F5</kbd> or <kbd>Ctrl+R</kbd>) to instantly test your changes.

---

## 📁 File Structure

```
template/
├── index.html       # HTML entry point with canvas and responsive HUD
├── style.css        # Responsive styling and modern UI overlay
├── game.js          # Complete game engine (physics, camera, player, particles, world)
├── .gitignore       # Git ignore rules
└── README.md        # Documentation and guide
```

---

## 🛠️ How to Customize

### 1. Adjusting Physics & Feel
Open [`game.js`](game.js) and modify the `CONFIG.physics` object at the top:
```javascript
physics: {
  gravity: 1400,          // Fall acceleration
  moveSpeed: 340,         // Top horizontal speed
  acceleration: 2400,     // Time to reach top speed on ground
  jumpForce: 560,         // Jump height
  jumpCutMultiplier: 0.45,// Variable jump height multiplier on key release
  coyoteTime: 0.12,       // Grace period after walking off edges
  jumpBufferTime: 0.12,   // Window to press jump before landing
}
```

### 2. Adding / Modifying Platforms
Find the `World` class in [`game.js`](game.js) to add or move platforms:
```javascript
this.platforms = [
  { x: 40, y: 340, width: 380, height: 40, label: 'Start' },
  { x: 480, y: 280, width: 140, height: 26 },
  // Add your own platforms here: { x, y, width, height }
];
```

### 3. Modifying Character & Colors
Colors for the sky, player, platforms, particles, coins, and gems can be customized in `CONFIG.colors` in [`game.js`](game.js).

### 4. Adding / Modifying Collectibles & Score
Find `createCollectibles()` in the `World` class in [`game.js`](game.js) to add or move coins and gems:
```javascript
this.collectibles = [
  new Collectible(180, 295, 'coin'), // +100 Score, animated gold coin
  new Collectible(1260, 25, 'gem'),  // +500 Score, rare pulsing purple gem
];
```
Each collectible automatically includes bobbing float animations, 3D rotation / crystal pulsing, collection sparkles, floating score text popups, and real-time HUD counter updates.
