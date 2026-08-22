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
Colors for the sky, player, platforms, and particles can be customized in `CONFIG.colors` in [`game.js`](game.js).

### 4. Adjusting the Lantern & Pink Glow Illumination
You can tweak the lantern's lighting radius $r$, ambient darkness, and glow colors in `CONFIG.lighting` in [`game.js`](game.js):
```javascript
lighting: {
  enabled: true,
  ambientDarkness: 0.78, // Darkness level of the environment outside the light (0.0 to 1.0)
  lantern: {
    baseRadius: 210,     // Radius r in pixels (currently set to 5x player height: 42px * 5)
    radiusMultiplier: 5, // Or tweak using size multiplier
    flickerAmount: 5.0,  // Natural flame flickering intensity
    glowColorInner: 'rgba(255, 175, 225, 0.42)', // Pink glow core
    glowColorMid: 'rgba(236, 72, 153, 0.20)',    // Pink ambient aura
    flameBodyColor: '#f43f5e',                   // Pink flame body
    flameCoreColor: '#ffffff',                   // Flame center core
  }
}
```

