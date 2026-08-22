# 🎮 2D Platformer Game Template

A lightweight, zero-dependency, pure HTML5 Canvas + Vanilla JavaScript 2D platformer with physics-based **Grappling Hook / Tether Swing** mechanics and procedural Web Audio SFX.

No build tools, npm packages, or bundlers required. Double click `index.html` to play directly in your browser.

---

## 🕹️ Controls

| Action | Keys | Mouse |
| :--- | :--- | :--- |
| **Move Left / Right** | <kbd>A</kbd> / <kbd>D</kbd> or <kbd>←</kbd> / <kbd>→</kbd> | — |
| **Jump / Boost Launch** | <kbd>Space</kbd> / <kbd>W</kbd> / <kbd>↑</kbd> | — |
| **Fire Grappling Hook** | <kbd>E</kbd> / <kbd>Shift</kbd> / <kbd>K</kbd> (Hold) | <kbd>Right Click</kbd> / <kbd>Left Click</kbd> (Hold) |
| **Swing Pumping** | <kbd>A</kbd> / <kbd>D</kbd> (while tethered) | — |
| **Reel In / Out** | <kbd>W</kbd> / <kbd>S</kbd> or <kbd>↑</kbd> / <kbd>↓</kbd> | — |
| **Respawn** | <kbd>R</kbd> | — |
| **Toggle Debug Info** | <kbd>F3</kbd> or <kbd>`</kbd> (Backquote) | — |

---

## 🪝 Grappling Hook & Tether Swing Mechanics

- **Interactive Anchor Points**: Latch onto ceiling nodes across massive chasms and vertical gaps.
- **Dynamic Targeting & Aiming**: In-range anchors automatically display targeting reticles and line-of-sight laser guides. Aim with mouse cursor or facing direction.
- **Pendulum Momentum & Pumping**: Conserves kinetic energy. Press <kbd>A</kbd>/<kbd>D</kbd> to pump swing arcs for higher altitude and speed.
- **Winch Reeling**: Hold <kbd>W</kbd> to reel in (increasing angular speed via conservation of angular momentum) or <kbd>S</kbd> to extend cable length.
- **Boost Jump / Slingshot**: Press <kbd>Space</kbd> or release at peak swing to catapult across huge gaps!
- **Procedural Sound FX**: Zero-dependency Web Audio API sound synthesizer for cable zips, latch clinks, reel motors, and rocket boost whooshes.

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
├── style.css        # Responsive styling and crosshair canvas cursor
├── game.js          # Complete engine (physics, grapple pendulum, anchors, audio, camera)
├── .gitignore       # Git ignore rules
└── README.md        # Documentation and guide
```

---

## 🛠️ How to Customize

### 1. Adjusting Grapple & Swing Physics
Open [`game.js`](game.js) and modify `CONFIG.grapple`:
```javascript
grapple: {
  maxRange: 400,          // Max distance to latch onto anchor
  minRopeLength: 40,      // Minimum tether length when reeling in
  maxRopeLength: 420,     // Maximum tether length when reeling out
  swingForce: 2800,       // Tangential acceleration applied by A/D keys
  swingAirResistance: 0.08, // Subtle damping during swing
  reelInSpeed: 320,       // Reeling in speed (pixels/sec)
  reelOutSpeed: 260,      // Reeling out speed (pixels/sec)
  boostJumpImpulse: 460,  // Tangential velocity boost on jump release
  boostUpwardImpulse: 300,// Upward launch boost on release
  maxSwingSpeed: 1100,    // Top speed clamp
  projectileSpeed: 3200,  // Hook firing speed
}
```

### 2. Adding / Modifying Anchor Points & Platforms
Find the `World` class in [`game.js`](game.js) to add or position anchors:
```javascript
this.anchors = [
  new GrappleAnchor(420, 140, 'Swing 1'),
  new GrappleAnchor(800, 40, 'High Vault'),
  // Add your own anchors here: new GrappleAnchor(x, y, label)
];
```

