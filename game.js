/**
 * 2D Platformer Game Template
 * Pure Vanilla JavaScript & HTML5 Canvas - Zero Build Steps
 * 
 * Simply open index.html in any browser to play.
 * Edit this file and refresh the browser (F5) to see changes immediately.
 */

// =============================================================================
// 1. CONFIGURATION & CONSTANTS
// =============================================================================
const CONFIG = {
  canvas: {
    width: 960,
    height: 540,
  },
  physics: {
    gravity: 1150,          // Balanced falling gravity (px/s^2)
    terminalVelocity: 580,  // Controlled max downward speed
    moveSpeed: 230,         // Crisp, controllable horizontal run speed
    acceleration: 1700,     // Snappy acceleration to top speed
    airAcceleration: 1200,  // Fluid air control acceleration
    friction: 2200,         // Immediate, tight ground stop
    airFriction: 600,       // Controlled air deceleration
    jumpForce: 490,         // Jump velocity (~95px height arc)
    jumpCutMultiplier: 0.40,// Responsive variable jump height
    coyoteTime: 0.12,       // Grace period after walking off edges
    jumpBufferTime: 0.12,   // Window to press jump before landing
  },
  grapple: {
    maxRange: 340,          // Reachable anchor detection range
    minRopeLength: 45,      // Minimum tether length when reeling in
    maxRopeLength: 360,     // Maximum tether length when reeling out
    swingForce: 950,        // Tangential pumping acceleration (smooth & controllable)
    swingAirResistance: 0.22, // Natural pendulum damping (prevents runaway speeds)
    reelInSpeed: 180,       // Reeling in speed
    reelOutSpeed: 180,      // Extending tether speed
    boostJumpImpulse: 180,  // Clean slingshot impulse on jump release
    boostUpwardImpulse: 200,// Upward launch impulse
    maxSwingSpeed: 440,     // Max speed ceiling during pendulum swing
    boostMaxSpeed: 380,     // Max horizontal speed ceiling after boost launch
    projectileSpeed: 2800,  // Hook firing animation speed
    gravity: 1400,          // Pixels per second squared
    terminalVelocity: 850,  // Max downward speed
    moveSpeed: 340,         // Horizontal max speed
    acceleration: 2400,     // Ground acceleration
    airAcceleration: 1600,  // Air control acceleration
    friction: 2000,         // Ground deceleration
    airFriction: 400,       // Air deceleration
    jumpForce: 560,         // Initial jump velocity (negative Y)
    jumpCutMultiplier: 0.45,// Variable jump height multiplier on key release
    coyoteTime: 0.12,       // Grace period (seconds) to jump after leaving a ledge
    jumpBufferTime: 0.12,   // Window (seconds) to register jump before landing
    wallSlideSpeed: 110,    // Constant downward slide speed when contacting a wall
    wallJumpForceY: 540,    // Vertical impulse on wall jump
    wallJumpForceX: 210,    // Horizontal impulse away from wall on wall jump
    wallCoyoteTime: 0.10,   // Grace period (seconds) to wall-jump after detaching from wall
  },
  camera: {
    lerpSpeed: 6.0,         // Camera follow tightness
    lookAheadDist: 60,      // Lookahead distance in facing direction
    verticalOffset: -25,    // Vertical bias
  },
  world: {
    spawnPoint: { x: 140, y: 220 },
    deathY: 800,            // Y-coordinate below which the player respawns
  },
  colors: {
    skyTop: '#090d16',
    skyBottom: '#151d2e',
    grid: 'rgba(255, 255, 255, 0.03)',
    platformTop: '#4ade80',
    platformBody: '#1e293b',
    platformBorder: '#334155',
    playerBody: '#38bdf8',
    playerGlow: 'rgba(56, 189, 248, 0.35)',
    playerEye: '#0f172a',
    playerHat: '#f43f5e',
    playerHatBand: '#fbbf24',
    playerHatBrim: '#e11d48',
    particle: '#38bdf8',
    anchorCore: '#38bdf8',
    anchorRing: '#0284c7',
    anchorActive: '#fbbf24',
    anchorTarget: '#f43f5e',
    grappleCable: '#38bdf8',
    grappleGlow: 'rgba(56, 189, 248, 0.5)',
    grappleCore: '#ffffff',
    checkpointActive: '#10b981',
    checkpointInactive: '#ef4444',
    checkpointGlow: 'rgba(16, 185, 129, 0.4)',
  }
};

// =============================================================================
// 2. PROCEDURAL SOUND SYSTEM (Web Audio API - Zero Dependencies)
// =============================================================================
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.lastReelSoundTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playGrappleShoot() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(1900, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  playGrappleLatch() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      [580, 1160, 1740].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const vol = (0.2 / (idx + 1));
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
      });
    } catch (e) {}
  }

  playGrappleReel() {
    if (!this.ctx || this.isMuted) return;
    const now = performance.now();
    if (now - this.lastReelSoundTime < 90) return;
    this.lastReelSoundTime = now;

    try {
      const audioTime = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, audioTime);
      gain.gain.setValueAtTime(0.06, audioTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(audioTime);
      osc.stop(audioTime + 0.04);
    } catch (e) {}
  }

  playGrappleBoost() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.24);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  playJump() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.14);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  playRespawn() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      [330, 440, 660, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.18);
      });
    } catch (e) {}
  }
}

// =============================================================================
// 3. INPUT MANAGER
// =============================================================================
class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.justPressed = {};

    this.mouseX = CONFIG.canvas.width / 2;
    this.mouseY = CONFIG.canvas.height / 2;
    this.hasMouseMoved = false;
    this.isMouseDown = false;
    this.isRightMouseDown = false;
    this.mouseJustPressed = false;
    this.rightMouseJustPressed = false;

    this.onFirstUserInteraction = null;

    window.addEventListener('keydown', (e) => {
      if (this.onFirstUserInteraction) this.onFirstUserInteraction();

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keys[e.code]) {
        this.justPressed[e.code] = true;
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    if (this.canvas) {
      this.canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });

      this.canvas.addEventListener('mousemove', (e) => {
        this.updateMousePos(e);
        this.hasMouseMoved = true;
      });

      this.canvas.addEventListener('mousedown', (e) => {
        if (this.onFirstUserInteraction) this.onFirstUserInteraction();
        this.updateMousePos(e);

        if (e.button === 0) {
          this.isMouseDown = true;
          this.mouseJustPressed = true;
        } else if (e.button === 2) {
          this.isRightMouseDown = true;
          this.rightMouseJustPressed = true;
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
          this.isMouseDown = false;
        } else if (e.button === 2) {
          this.isRightMouseDown = false;
        }
      });
    }

    window.addEventListener('blur', () => {
      this.keys = {};
      this.justPressed = {};
      this.isMouseDown = false;
      this.isRightMouseDown = false;
    });
  }

  updateMousePos(e) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mouseX = (e.clientX - rect.left) * scaleX;
    this.mouseY = (e.clientY - rect.top) * scaleY;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  isJustPressed(code) {
    return !!this.justPressed[code];
  }

  resetFrame() {
    this.justPressed = {};
    this.mouseJustPressed = false;
    this.rightMouseJustPressed = false;
  }

  get left() {
    return this.isDown('KeyA') || this.isDown('ArrowLeft');
  }

  get right() {
    return this.isDown('KeyD') || this.isDown('ArrowRight');
  }

  get up() {
    return this.isDown('KeyW') || this.isDown('ArrowUp');
  }

  get down() {
    return this.isDown('KeyS') || this.isDown('ArrowDown');
  }

  get jump() {
    return this.isDown('Space') || this.isDown('KeyW') || this.isDown('ArrowUp');
  }

  get jumpJustPressed() {
    return this.isJustPressed('Space') || this.isJustPressed('KeyW') || this.isJustPressed('ArrowUp');
  }

  get grapple() {
    return (
      this.isRightMouseDown ||
      this.isMouseDown ||
      this.isDown('KeyE') ||
      this.isDown('ShiftLeft') ||
      this.isDown('ShiftRight') ||
      this.isDown('KeyK')
    );
  }

  get grappleJustPressed() {
    return (
      this.rightMouseJustPressed ||
      this.mouseJustPressed ||
      this.isJustPressed('KeyE') ||
      this.isJustPressed('ShiftLeft') ||
      this.isJustPressed('ShiftRight') ||
      this.isJustPressed('KeyK')
    );
  }

  get reelIn() {
    return this.isDown('KeyW') || this.isDown('ArrowUp');
  }

  get reelOut() {
    return this.isDown('KeyS') || this.isDown('ArrowDown');
  }

  get restartJustPressed() {
    return this.isJustPressed('KeyR');
  }

  get interactJustPressed() {
    return this.isJustPressed('KeyF') || this.isJustPressed('KeyE');
  }

  get debugJustPressed() {
    return this.isJustPressed('F3') || this.isJustPressed('Backquote');
  }
}

// =============================================================================
// 4. PARTICLE SYSTEM
// =============================================================================
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, options = {}) {
    const {
      color = CONFIG.colors.particle,
      sizeMin = 3,
      sizeMax = 6,
      speedMin = 40,
      speedMax = 160,
      lifeMin = 0.25,
      lifeMax = 0.6,
      angleMin = 0,
      angleMax = Math.PI * 2,
      gravity = 300,
    } = options;

    for (let i = 0; i < count; i++) {
      const angle = angleMin + Math.random() * (angleMax - angleMin);
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const lifetime = lifeMin + Math.random() * (lifeMax - lifeMin);
      const size = sizeMin + Math.random() * (sizeMax - sizeMin);

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        initialSize: size,
        color,
        lifetime,
        maxLife: lifetime,
        gravity,
      });
    }
  }

  emitDust(x, y, direction = 0) {
    this.emit(x, y, 6, {
      color: 'rgba(203, 213, 225, 0.7)',
      sizeMin: 2,
      sizeMax: 5,
      speedMin: 30,
      speedMax: 90,
      angleMin: direction === 0 ? -Math.PI * 0.8 : (direction > 0 ? Math.PI * 0.7 : -Math.PI * 0.2),
      angleMax: direction === 0 ? -Math.PI * 0.2 : (direction > 0 ? Math.PI * 1.1 : 0.2),
      gravity: 120,
    });
  }

  emitRespawn(x, y) {
    this.emit(x, y, 32, {
      color: CONFIG.colors.playerBody,
      sizeMin: 3,
      sizeMax: 8,
      speedMin: 80,
      speedMax: 260,
      lifeMin: 0.4,
      lifeMax: 0.8,
      gravity: -60, // Float upward
    });
  }

  emitGrappleLatch(x, y) {
    this.emit(x, y, 16, {
      color: '#fbbf24',
      sizeMin: 2,
      sizeMax: 5,
      speedMin: 60,
      speedMax: 220,
      lifeMin: 0.2,
      lifeMax: 0.5,
      gravity: 150,
    });
  }

  emitGrappleBoost(x, y, vx, vy) {
    const angle = Math.atan2(-vy, -vx); // Sparks jetting opposite to launch direction
    this.emit(x, y, 20, {
      color: '#38bdf8',
      sizeMin: 2,
      sizeMax: 6,
      speedMin: 90,
      speedMax: 320,
      angleMin: angle - 0.6,
      angleMax: angle + 0.6,
      lifeMin: 0.25,
      lifeMax: 0.6,
      gravity: 60,
    });
  }

  emitSpeedTrail(x, y) {
    this.emit(x, y, 1, {
      color: 'rgba(56, 189, 248, 0.4)',
      sizeMin: 4,
      sizeMax: 7,
      speedMin: 5,
      speedMax: 20,
      lifeMin: 0.15,
      lifeMax: 0.3,
      gravity: 0,
  emitCheckpointSparkles(x, y) {
    const sparkleColors = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#fde047', '#38bdf8', '#ffffff'];
    for (let i = 0; i < 36; i++) {
      const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
      this.emit(x, y, 1, {
        color,
        sizeMin: 3,
        sizeMax: 7,
        speedMin: 60,
        speedMax: 260,
        lifeMin: 0.5,
        lifeMax: 1.1,
        angleMin: -Math.PI * 0.95,
        angleMax: -Math.PI * 0.05,
        gravity: 80,
      });
    }
  }

  emitCheckpointAmbient(x, y) {
    const colors = ['#10b981', '#fbbf24', '#6ee7b7', '#fde047'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    this.emit(x + (Math.random() * 24 - 12), y, 1, {
      color,
      sizeMin: 2,
      sizeMax: 4.5,
      speedMin: 15,
      speedMax: 45,
      lifeMin: 0.6,
      lifeMax: 1.2,
      angleMin: -Math.PI * 0.75,
      angleMax: -Math.PI * 0.25,
      gravity: -35, // Float gently upward
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime -= dt;
      if (p.lifetime <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size = p.initialSize * (p.lifetime / p.maxLife);
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.lifetime / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// =============================================================================
// 5. GRAPPLE ANCHOR POINT
// =============================================================================
class GrappleAnchor {
  constructor(x, y, label = '') {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.label = label;

    // Visual state
    this.rotation = Math.random() * Math.PI * 2;
    this.pulseTimer = Math.random() * Math.PI * 2;
    this.isTargeted = false;
    this.isAttached = false;
    this.targetStrength = 0;
  }

  update(dt) {
    this.rotation += dt * (this.isAttached ? 4.5 : (this.isTargeted ? 2.5 : 1.0));
    this.pulseTimer += dt * 3.5;

    const targetVal = this.isTargeted || this.isAttached ? 1 : 0;
    this.targetStrength += (targetVal - this.targetStrength) * 14 * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(this.pulseTimer) * 2;
    const coreRadius = 6 + (this.isAttached ? 2 : 0) + pulse * 0.5;

    // 1. Outer Glow Aura
    if (this.targetStrength > 0.05) {
      ctx.fillStyle = this.isAttached ? 'rgba(251, 191, 36, 0.25)' : 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, (this.radius + 10 + pulse) * this.targetStrength, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Outer Orbiting Ring & Brackets
    ctx.save();
    ctx.rotate(this.rotation);
    ctx.strokeStyle = this.isAttached ? '#fbbf24' : (this.targetStrength > 0.5 ? '#38bdf8' : '#0284c7');
    ctx.lineWidth = this.isAttached ? 2.5 : 2;

    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const startAngle = (i * Math.PI / 2) + 0.2;
      const endAngle = (i * Math.PI / 2) + (Math.PI / 2) - 0.2;
      ctx.arc(0, 0, this.radius, startAngle, endAngle);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Central Luminous Core
    const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, coreRadius + 2);
    if (this.isAttached) {
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, '#fbbf24');
      coreGrad.addColorStop(1, '#d97706');
    } else if (this.targetStrength > 0.5) {
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.5, '#38bdf8');
      coreGrad.addColorStop(1, '#0284c7');
    } else {
      coreGrad.addColorStop(0, '#7dd3fc');
      coreGrad.addColorStop(0.7, '#0284c7');
      coreGrad.addColorStop(1, '#0f172a');
    }

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // 4. Targeting Reticle / Crosshair Indicator when targeted
    if (this.targetStrength > 0.1 && !this.isAttached) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${this.targetStrength * 0.9})`;
      ctx.lineWidth = 1.5;

      const reticleSize = this.radius + 7 - pulse;
      ctx.beginPath();
      ctx.arc(0, 0, reticleSize, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-reticleSize - 3, 0); ctx.lineTo(-reticleSize + 2, 0);
      ctx.moveTo(reticleSize - 2, 0); ctx.lineTo(reticleSize + 3, 0);
      ctx.moveTo(0, -reticleSize - 3); ctx.lineTo(0, -reticleSize + 2);
      ctx.moveTo(0, reticleSize - 2); ctx.lineTo(0, reticleSize + 3);
      ctx.stroke();
    }

    // Optional Label
    if (this.label) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.label, 0, -this.radius - 8);
    }

    ctx.restore();
  }
}

// =============================================================================
// 6. RAYCASTING & LINE-OF-SIGHT UTILS
// =============================================================================
function checkLineSegmentIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
  if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
  if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;

  function lineIntersects(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  const left = rx, right = rx + rw, top = ry, bottom = ry + rh;
  return (
    lineIntersects(x1, y1, x2, y2, left, top, right, top) ||
    lineIntersects(x1, y1, x2, y2, right, top, right, bottom) ||
    lineIntersects(x1, y1, x2, y2, right, bottom, left, bottom) ||
    lineIntersects(x1, y1, x2, y2, left, bottom, left, top)
  );
}

function hasLineOfSight(x1, y1, x2, y2, platforms) {
  for (const plat of platforms) {
    if (checkLineSegmentIntersectsRect(x1, y1, x2, y2, plat.x, plat.y, plat.width, plat.height)) {
      return false;
    }
  }
  return true;
}

// =============================================================================
// 7. PLAYER WITH GRAPPLING HOOK & TETHER SWING
// =============================================================================
class Player {
  constructor(x, y) {
    this.width = 30;
    this.height = 42;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.wasGrounded = false;
    this.facing = 1; // 1 = right, -1 = left

    // Wall interaction state
    this.isTouchingWall = false;
    this.wallDir = 0; // -1 = left wall, 1 = right wall, 0 = none
    this.isWallSliding = false;
    this.lastWallDir = 0;
    this.wallSlideDustTimer = 0;

    // Timers for game feel
    this.coyoteTimer = 0;
    this.wallCoyoteTimer = 0;
    this.jumpBufferTimer = 0;

    // Procedural animation state (squash & stretch)
    this.scaleX = 1;
    this.scaleY = 1;
    this.bodyRotation = 0;
    this.walkAnimTimer = 0;
    this.blinkTimer = 2.0;
    this.isBlinking = false;

    // Grapple Hook & Tether State Machine
    this.grappleState = 'inactive'; // 'inactive' | 'firing' | 'attached'
    this.grappleAnchor = null;
    this.targetAnchor = null;
    this.ropeLength = 0;
    this.hookX = 0;
    this.hookY = 0;
    this.hookProgress = 0;
    this.tetherEnergyWave = 0;
    this.speedTrailTimer = 0;
  }

  respawn(spawnPoint, particleSystem) {
    this.detachGrapple();
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.vx = 0;
    this.vy = 0;
    this.bodyRotation = 0;
    this.isTouchingWall = false;
    this.wallDir = 0;
    this.isWallSliding = false;
    this.lastWallDir = 0;
    this.wallSlideDustTimer = 0;
    this.coyoteTimer = 0;
    this.wallCoyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.scaleX = 1.4;
    this.scaleY = 0.6;
    if (particleSystem) {
      particleSystem.emitRespawn(this.centerX, this.centerY);
    }
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  detachGrapple() {
    if (this.grappleAnchor) {
      this.grappleAnchor.isAttached = false;
    }
    this.grappleState = 'inactive';
    this.grappleAnchor = null;
    this.hookProgress = 0;
  }

  update(dt, input, platforms, anchors, particleSystem, soundSystem, mouseWorldPos) {
  getWallContact(platforms) {
    const marginY = 4;
    const probeWidth = 2;
    const probeHeight = this.height - marginY * 2;
    if (probeHeight <= 0) return 0;

    const leftProbe = {
      x: this.x - probeWidth,
      y: this.y + marginY,
      width: probeWidth,
      height: probeHeight,
    };

    const rightProbe = {
      x: this.x + this.width,
      y: this.y + marginY,
      width: probeWidth,
      height: probeHeight,
    };

    for (const plat of platforms) {
      if (this.checkCollision(leftProbe, plat)) {
        return -1; // Wall to the left
      }
      if (this.checkCollision(rightProbe, plat)) {
        return 1; // Wall to the right
      }
    }
    return 0;
  }

  update(dt, input, platforms, particleSystem) {
    // -------------------------------------------------------------------------
    // 1. Timers & Input Buffering
    if (this.isGrounded) {
      this.coyoteTimer = CONFIG.physics.coyoteTime;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (this.isTouchingWall && !this.isGrounded) {
      this.wallCoyoteTimer = CONFIG.physics.wallCoyoteTime;
      this.lastWallDir = this.wallDir;
    } else {
      this.wallCoyoteTimer = Math.max(0, this.wallCoyoteTimer - dt);
    }

    if (input.jumpJustPressed) {
      this.jumpBufferTimer = CONFIG.physics.jumpBufferTime;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // 2. Anchor Targeting & Detection
    this.updateAnchorTargeting(anchors, platforms, mouseWorldPos, input);

    // 3. Grapple Input Handling & State Transitions
    if (input.grappleJustPressed) {
      if (this.targetAnchor && this.grappleState === 'inactive') {
        this.grappleState = 'firing';
        this.grappleAnchor = this.targetAnchor;
        this.hookProgress = 0;
        this.hookX = this.centerX;
        this.hookY = this.centerY;
        if (soundSystem) soundSystem.playGrappleShoot();
      }
    }

    // Grapple release: Detach when input key/mouse is released
    if (this.grappleState !== 'inactive' && !input.grapple) {
      this.detachGrapple();
    }

    // 4. Grapple Firing & Tether Attachment Simulation
    if (this.grappleState === 'firing' && this.grappleAnchor) {
      const dx = this.grappleAnchor.x - this.centerX;
      const dy = this.grappleAnchor.y - this.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      this.hookProgress += (CONFIG.grapple.projectileSpeed * dt) / Math.max(dist, 1);
      if (this.hookProgress >= 1.0) {
        this.hookProgress = 1.0;
        this.grappleState = 'attached';
        this.grappleAnchor.isAttached = true;
        this.ropeLength = dist;

        if (soundSystem) soundSystem.playGrappleLatch();
        if (particleSystem) particleSystem.emitGrappleLatch(this.grappleAnchor.x, this.grappleAnchor.y);
      } else {
        this.hookX = this.centerX + dx * this.hookProgress;
        this.hookY = this.centerY + dy * this.hookProgress;
      }
    }

    // 5. Physics: Tether Swing vs Regular Platformer
    if (this.grappleState === 'attached' && this.grappleAnchor) {
      this.updateTetherSwingPhysics(dt, input, platforms, particleSystem, soundSystem);
    } else {
      this.updateStandardPlatformerPhysics(dt, input, platforms, particleSystem, soundSystem);
    }

    // 6. Visual Effects, Trail Particles & Juice
    this.tetherEnergyWave = (this.tetherEnergyWave + dt * 6.0) % (Math.PI * 2);

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 420) {
      this.speedTrailTimer += dt;
      if (this.speedTrailTimer > 0.04) {
        this.speedTrailTimer = 0;
        particleSystem.emitSpeedTrail(this.centerX, this.centerY);
      }
    }

    this.scaleX += (1 - this.scaleX) * 12 * dt;
    this.scaleY += (1 - this.scaleY) * 12 * dt;

    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer <= -0.15) {
        this.isBlinking = false;
        this.blinkTimer = 2.5 + Math.random() * 3.0;
      }
    }
  }

  updateAnchorTargeting(anchors, platforms, mouseWorldPos, input) {
    let bestAnchor = null;
    let bestScore = -Infinity;

    for (const anchor of anchors) {
      anchor.isTargeted = false;

      const dx = anchor.x - this.centerX;
      const dy = anchor.y - this.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > CONFIG.grapple.maxRange || dist < 20) continue;

      if (!hasLineOfSight(this.centerX, this.centerY, anchor.x, anchor.y, platforms)) {
        continue;
      }

      let score = 1000 - dist;

      if (input.hasMouseMoved && mouseWorldPos) {
        const mdx = anchor.x - mouseWorldPos.x;
        const mdy = anchor.y - mouseWorldPos.y;
        const mouseDist = Math.sqrt(mdx * mdx + mdy * mdy);
        score += Math.max(0, 400 - mouseDist) * 3.0;
      } else {
        const dirDot = (dx * this.facing) / dist;
        score += dirDot * 180;
        if (dy < 0) score += 100;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAnchor = anchor;
      }
    }

    this.targetAnchor = bestAnchor;
    if (this.targetAnchor && this.grappleState !== 'attached') {
      this.targetAnchor.isTargeted = true;
    }
  }

  updateTetherSwingPhysics(dt, input, platforms, particleSystem, soundSystem) {
    const anchor = this.grappleAnchor;
    let rx = this.centerX - anchor.x;
    let ry = this.centerY - anchor.y;
    let currentDist = Math.sqrt(rx * rx + ry * ry);
    if (currentDist < 1) currentDist = 1;

    let currentAngle = Math.atan2(ry, rx);

    // A. Reeling In / Out
    if (input.reelIn) {
      this.ropeLength = Math.max(CONFIG.grapple.minRopeLength, this.ropeLength - CONFIG.grapple.reelInSpeed * dt);
      if (soundSystem) soundSystem.playGrappleReel();
    } else if (input.reelOut) {
      this.ropeLength = Math.min(CONFIG.grapple.maxRopeLength, this.ropeLength + CONFIG.grapple.reelOutSpeed * dt);
    }

    // Unit tangential vector pointing CCW: ut = (-sin(theta), cos(theta))
    const utX = -Math.sin(currentAngle);
    const utY = Math.cos(currentAngle);

    // Current tangential velocity
    let vt = this.vx * utX + this.vy * utY;

    // B. Swing Momentum Pumping (A / D or Left / Right)
    let moveDir = 0;
    if (input.left) moveDir -= 1;
    if (input.right) moveDir += 1;

    if (moveDir !== 0) {
      this.facing = moveDir;
      // Pump in the tangential direction that moves horizontally in desired direction
      const pumpDir = Math.sign(utX) * moveDir;
      vt += pumpDir * CONFIG.grapple.swingForce * dt;
    }

    // C. Grapple Jump / Boost Launch Release
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = 0;
      this.detachGrapple();

      const swingDirSign = Math.sign(vt) || this.facing;
      const launchDirX = utX * swingDirSign;
      const launchDirY = utY * swingDirSign;
      const launchSpeed = Math.abs(vt) + CONFIG.grapple.boostJumpImpulse;

      this.vx = launchDirX * launchSpeed;
      this.vy = Math.min(launchDirY * launchSpeed, -CONFIG.grapple.boostUpwardImpulse);

      if (Math.abs(this.vx) > CONFIG.grapple.boostMaxSpeed) {
        this.vx = Math.sign(this.vx) * CONFIG.grapple.boostMaxSpeed;
      }

      this.scaleX = 0.8;
      this.scaleY = 1.3;

      if (soundSystem) soundSystem.playGrappleBoost();
      if (particleSystem) {
        particleSystem.emitGrappleBoost(this.centerX, this.centerY, this.vx, this.vy);
        particleSystem.emitGrappleLatch(anchor.x, anchor.y);
      }
      return;
    }

    // D. Gravity on Pendulum (pulls toward bottom angle theta = PI/2)
    const gravityAccel = -CONFIG.physics.gravity * Math.sin(currentAngle - Math.PI / 2);
    vt += gravityAccel * dt;

    // Natural Damping / Air Resistance (smooth, prevents runaway acceleration)
    vt *= Math.max(0, 1 - CONFIG.grapple.swingAirResistance * dt);

    // Clamp maximum swing speed
    if (Math.abs(vt) > CONFIG.grapple.maxSwingSpeed) {
      vt = Math.sign(vt) * CONFIG.grapple.maxSwingSpeed;
    }

    // Advance angle along constraint circle
    const angularSpeed = vt / Math.max(this.ropeLength, 10);
    const nextAngle = currentAngle + angularSpeed * dt;

    const nextCenterX = anchor.x + Math.cos(nextAngle) * this.ropeLength;
    const nextCenterY = anchor.y + Math.sin(nextAngle) * this.ropeLength;

    // Reconstruct velocity from tangential speed
    this.vx = -Math.sin(nextAngle) * vt;
    this.vy = Math.cos(nextAngle) * vt;

    this.x = nextCenterX - this.width / 2;
    this.y = nextCenterY - this.height / 2;

    // Platform collision resolution while swinging
    this.isGrounded = false;
    for (const plat of platforms) {
      if (this.checkCollision(this, plat)) {
        if (this.vy > 0 && this.y + this.height - this.vy * dt <= plat.y + 8) {
          this.y = plat.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
        } else {
          vt *= -0.2;
          this.vx *= -0.2;
          this.vy *= -0.2;
        }
      }
    }

    const ropeAngle = nextAngle - Math.PI / 2;
    this.bodyRotation += (ropeAngle - this.bodyRotation) * 14 * dt;
  }

  updateStandardPlatformerPhysics(dt, input, platforms, particleSystem, soundSystem) {
    this.bodyRotation += (0 - this.bodyRotation) * 12 * dt;

    let moveDir = 0;
    if (input.left) moveDir -= 1;
    if (input.right) moveDir += 1;

    if (moveDir !== 0) {
      this.facing = moveDir;
      const accel = this.isGrounded ? CONFIG.physics.acceleration : CONFIG.physics.airAcceleration;
      this.vx += moveDir * accel * dt;

      if (this.isGrounded) {
        if (Math.abs(this.vx) > CONFIG.physics.moveSpeed) {
          this.vx = Math.sign(this.vx) * CONFIG.physics.moveSpeed;
        }
      } else {
        if (Math.abs(this.vx) > CONFIG.physics.moveSpeed) {
          const excess = Math.abs(this.vx) - CONFIG.physics.moveSpeed;
          this.vx -= Math.sign(this.vx) * Math.min(excess, 700 * dt);
        }
      }

      this.walkAnimTimer += dt * 12;
    } else {
      const friction = this.isGrounded ? CONFIG.physics.friction : CONFIG.physics.airFriction;
      if (Math.abs(this.vx) > 0) {
        const drop = friction * dt;
        if (Math.abs(this.vx) <= drop) {
          this.vx = 0;
        } else {
          this.vx -= Math.sign(this.vx) * drop;
        }
      }
      this.walkAnimTimer = 0;
    }

    // Jump Handling
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = -CONFIG.physics.jumpForce;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.isGrounded = false;

      this.scaleX = 0.8;
      this.scaleY = 1.3;
      if (soundSystem) soundSystem.playJump();
      if (particleSystem) particleSystem.emitDust(this.centerX, this.y + this.height);
    // -------------------------------------------------------------------------
    // 3. Jump Handling (Variable Jump Height + Coyote + Buffer + Wall Jump)
    // -------------------------------------------------------------------------
    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0) {
        // Standard Ground Jump
        this.vy = -CONFIG.physics.jumpForce;
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.isGrounded = false;

        // Visual juice: stretch vertically on jump
        this.scaleX = 0.75;
        this.scaleY = 1.35;

        particleSystem.emitDust(this.centerX, this.y + this.height);
      } else if (this.wallCoyoteTimer > 0) {
        // Wall Jump! Jump up and away from the wall
        const jumpWallDir = this.lastWallDir !== 0 ? this.lastWallDir : this.wallDir;
        if (jumpWallDir !== 0) {
          this.vy = -CONFIG.physics.wallJumpForceY;
          this.vx = -jumpWallDir * CONFIG.physics.wallJumpForceX;
          this.facing = -jumpWallDir; // Face away from the wall
          this.jumpBufferTimer = 0;
          this.wallCoyoteTimer = 0;
          this.coyoteTimer = 0;
          this.isGrounded = false;
          this.isTouchingWall = false;

          // Visual juice
          this.scaleX = 0.8;
          this.scaleY = 1.3;

          const dustX = jumpWallDir === -1 ? this.x : this.x + this.width;
          particleSystem.emitDust(dustX, this.centerY, -jumpWallDir);
        }
      }
    }

    // Variable jump cut
    if (!input.jump && this.vy < 0) {
      this.vy += CONFIG.physics.gravity * (1 - CONFIG.physics.jumpCutMultiplier) * dt * 2.5;
    }

    // Gravity & Terminal Velocity
    // -------------------------------------------------------------------------
    // 4. Gravity & Vertical Movement with Wall Friction
    // -------------------------------------------------------------------------
    this.vy += CONFIG.physics.gravity * dt;

    // Wall friction / slide: if touching a wall while in air, cap downward speed at constant slide rate
    if (this.isTouchingWall && !this.isGrounded) {
      if (this.vy > CONFIG.physics.wallSlideSpeed) {
        this.vy = CONFIG.physics.wallSlideSpeed;
      }
      this.isWallSliding = this.vy > 0;

      // Emit wall slide dust particles
      if (this.isWallSliding) {
        this.wallSlideDustTimer += dt;
        if (this.wallSlideDustTimer >= 0.08) {
          this.wallSlideDustTimer = 0;
          const dustX = this.wallDir === -1 ? this.x : this.x + this.width;
          particleSystem.emitDust(dustX, this.centerY + 10, -this.wallDir);
        }
      } else {
        this.wallSlideDustTimer = 0;
      }
    } else {
      this.isWallSliding = false;
      this.wallSlideDustTimer = 0;
    }

    if (this.vy > CONFIG.physics.terminalVelocity) {
      this.vy = CONFIG.physics.terminalVelocity;
    }

    // X Collision
    this.x += this.vx * dt;
    for (const plat of platforms) {
      if (this.checkCollision(this, plat)) {
        if (this.vx > 0) {
          this.x = plat.x - this.width;
        } else if (this.vx < 0) {
          this.x = plat.x + plat.width;
        }
        this.vx = 0;
      }
    }

    // Y Collision
    this.wasGrounded = this.isGrounded;
    this.isGrounded = false;
    this.y += this.vy * dt;

    for (const plat of platforms) {
      if (this.checkCollision(this, plat)) {
        if (this.vy > 0) {
          this.y = plat.y - this.height;
          this.vy = 0;
          this.isGrounded = true;

          if (!this.wasGrounded) {
            this.scaleX = 1.25;
            this.scaleY = 0.75;
            if (particleSystem) particleSystem.emitDust(this.centerX, this.y + this.height);
          }
        } else if (this.vy < 0) {
          this.y = plat.y + plat.height;
          this.vy = 0;
        }
      }
    }

    // Check wall contact after movement & collision resolution
    const currentWall = this.getWallContact(platforms);
    if (currentWall !== 0 && !this.isGrounded) {
      this.isTouchingWall = true;
      this.wallDir = currentWall;
      this.lastWallDir = currentWall;
    } else {
      this.isTouchingWall = false;
      this.wallDir = 0;
    }

    // -------------------------------------------------------------------------
    // 6. Procedural Animation & Squash/Stretch Recovery
    // -------------------------------------------------------------------------
    this.scaleX += (1 - this.scaleX) * 12 * dt;
    this.scaleY += (1 - this.scaleY) * 12 * dt;

    // Eye blinking
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer <= -0.15) {
        this.isBlinking = false;
        this.blinkTimer = 2.5 + Math.random() * 3.0;
      }
    }
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  draw(ctx) {
    // 1. Draw Grappling Cable / Tether Beam
    if (this.grappleState !== 'inactive' && this.grappleAnchor) {
      this.drawGrappleCable(ctx);
    }

    // 2. Draw Aiming Reticle / Line Guide to Target Anchor
    if (this.targetAnchor && this.grappleState === 'inactive') {
      this.drawAimGuide(ctx);
    }

    // 3. Draw Character Body & Hat
    ctx.save();
    const bottomCenterX = this.centerX;
    const bottomCenterY = this.y + this.height;

    let walkOffset = 0;
    if (this.isGrounded && Math.abs(this.vx) > 20) {
      walkOffset = Math.sin(this.walkAnimTimer) * 2;
    }

    ctx.translate(bottomCenterX, bottomCenterY + walkOffset);
    ctx.rotate(this.bodyRotation);
    ctx.scale(this.scaleX, this.scaleY);

    const w = this.width;
    const h = this.height;
    const cornerRadius = 8;

    // Drop shadow
    ctx.fillStyle = CONFIG.colors.playerGlow;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Gradient
    const bodyGradient = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
    bodyGradient.addColorStop(0, '#67e8f9');
    bodyGradient.addColorStop(1, CONFIG.colors.playerBody);

    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = this.grappleState === 'attached' ? '#fbbf24' : '#0284c7';
    ctx.lineWidth = 2;

    this.drawRoundedRect(ctx, -w / 2, -h, w, h, cornerRadius);
    ctx.fill();
    ctx.stroke();

    // Grapple Launcher Holster on belt
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-w / 2 + 3, -h * 0.38, w - 6, 4);
    ctx.fillStyle = this.grappleState === 'attached' ? '#fbbf24' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(this.facing * 8, -h * 0.36, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    if (!this.isBlinking) {
      const eyeLookOffset = this.facing * 3.5;
      const eyeY = -h * 0.65;
      const eyeSpacing = 6;

      ctx.fillStyle = CONFIG.colors.playerEye;
      ctx.beginPath();
      ctx.arc(eyeLookOffset - eyeSpacing / 2, eyeY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(eyeLookOffset + eyeSpacing / 2 + 2, eyeY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeLookOffset - eyeSpacing / 2 + 1, eyeY - 1, 1, 0, Math.PI * 2);
      ctx.arc(eyeLookOffset + eyeSpacing / 2 + 3, eyeY - 1, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = CONFIG.colors.playerEye;
      ctx.lineWidth = 2;
      const eyeY = -h * 0.65;
      ctx.beginPath();
      ctx.moveTo(-5 + this.facing * 2, eyeY);
      ctx.lineTo(7 + this.facing * 2, eyeY);
      ctx.stroke();
    }

    this.drawHat(ctx, w, h);

    ctx.restore();
  }

  drawGrappleCable(ctx) {
    ctx.save();
    const startX = this.centerX;
    const startY = this.centerY - 10;
    const targetX = this.grappleState === 'firing' ? this.hookX : this.grappleAnchor.x;
    const targetY = this.grappleState === 'firing' ? this.hookY : this.grappleAnchor.y;

    const midX = (startX + targetX) / 2;
    const midY = (startY + targetY) / 2 + (this.grappleState === 'attached' ? 4 : 0);

    // 1. Outer Glow
    ctx.strokeStyle = CONFIG.colors.grappleGlow;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, midY, targetX, targetY);
    ctx.stroke();

    // 2. High-Tech Cable Core
    ctx.strokeStyle = this.grappleState === 'attached' ? '#fbbf24' : CONFIG.colors.grappleCable;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, midY, targetX, targetY);
    ctx.stroke();

    // 3. Inner White Laser Strand
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, midY, targetX, targetY);
    ctx.stroke();

    // 4. Hook Clamp Projectile
    ctx.save();
    ctx.translate(targetX, targetY);
    const angle = Math.atan2(targetY - startY, targetX - startX);
    ctx.rotate(angle);

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  drawAimGuide(ctx) {
    ctx.save();
    const startX = this.centerX;
    const startY = this.centerY - 10;
    const targetX = this.targetAnchor.x;
    const targetY = this.targetAnchor.y;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  drawHat(ctx, w, h) {
    ctx.save();
    const headTopY = -h;
    const hatTilt = (this.vx / CONFIG.physics.moveSpeed) * 0.14 + (this.facing * 0.05);

    ctx.translate(0, headTopY + 2);
    ctx.rotate(hatTilt);

    ctx.fillStyle = CONFIG.colors.playerHatBrim;
    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, (w / 2) + 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const crownWidth = w * 0.72;
    const crownHeight = 16;
    const crownGradient = ctx.createLinearGradient(-crownWidth / 2, -crownHeight, crownWidth / 2, 0);
    crownGradient.addColorStop(0, '#fb7185');
    crownGradient.addColorStop(1, CONFIG.colors.playerHat);

    ctx.fillStyle = crownGradient;
    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-crownWidth / 2, 0);
    ctx.quadraticCurveTo(-crownWidth * 0.35, -crownHeight, -2 + this.facing * 3, -crownHeight);
    ctx.quadraticCurveTo(crownWidth * 0.35, -crownHeight, crownWidth / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = CONFIG.colors.playerHatBand;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.drawRoundedRect(ctx, -crownWidth / 2 + 1, -4.5, crownWidth - 2, 4, 1.5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-2 + this.facing * 3, -crownHeight, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// =============================================================================
// 8. CAMERA SYSTEM
// =============================================================================
class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
  }

  snapTo(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  update(dt, player) {
    this.targetX = player.centerX + player.facing * CONFIG.camera.lookAheadDist;
    this.targetY = player.centerY + CONFIG.camera.verticalOffset;

    const t = 1 - Math.exp(-CONFIG.camera.lerpSpeed * dt);
    this.x += (this.targetX - this.x) * t;
    this.y += (this.targetY - this.y) * t;
  }

  screenToWorld(screenX, screenY) {
    return {
      x: screenX - (this.viewportWidth / 2 - this.x),
      y: screenY - (this.viewportHeight / 2 - this.y),
    };
  }

  apply(ctx) {
    ctx.save();
    ctx.translate(
      Math.round(this.viewportWidth / 2 - this.x),
      Math.round(this.viewportHeight / 2 - this.y)
    );
  }

  restore(ctx) {
    ctx.restore();
  }
}

// =============================================================================
// 9. WORLD, PLATFORMS & ANCHORS
// 6. CHECKPOINT SYSTEM
// =============================================================================
class Checkpoint {
  constructor(x, y, label, isDefault = false) {
    // (x, y) is the base anchor point on top of the platform
    this.x = x;
    this.y = y;
    this.label = label || 'Checkpoint';
    this.isDefault = isDefault;
    this.isActive = isDefault;
    this.poleHeight = 68;
    this.flagWidth = 36;
    this.flagHeight = 22;

    // Trigger hitbox dimensions (generous interactive zone)
    this.width = 64;
    this.height = this.poleHeight + 16;
    this.isPlayerInRange = false;

    // Animation & juice state
    this.waveTimer = Math.random() * 10;
    this.flagRaiseProgress = isDefault ? 1.0 : 0.0;
    this.glowTimer = Math.random() * Math.PI * 2;
    this.ambientTimer = 0;

    // Respawn position for player (player is width 30, height 42)
    this.spawnPoint = {
      x: this.x - 15,
      y: this.y - 42,
    };
  }

  get triggerBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height,
    };
  }

  checkCollision(player) {
    const bounds = this.triggerBounds;
    return (
      player.x < bounds.x + bounds.width &&
      player.x + player.width > bounds.x &&
      player.y < bounds.y + bounds.height &&
      player.y + player.height > bounds.y
    );
  }

  activate(particleSystem) {
    if (!this.isActive) {
      this.isActive = true;
      if (particleSystem) {
        particleSystem.emitCheckpointSparkles(this.x + 16, this.y - this.poleHeight + 15);
      }
    }
  }

  deactivate() {
    this.isActive = false;
  }

  update(dt, player, particleSystem, input) {
    this.waveTimer += dt * 4.5;
    this.glowTimer += dt * 3.0;

    // Proximity detection
    this.isPlayerInRange = this.checkCollision(player);

    if (this.isActive) {
      // Smoothly raise flag to the top of the mast
      if (this.flagRaiseProgress < 1.0) {
        this.flagRaiseProgress = Math.min(1.0, this.flagRaiseProgress + dt * 2.4);
      }

      // Periodic ambient sparkle from active flag
      this.ambientTimer += dt;
      if (this.ambientTimer > 0.25) {
        this.ambientTimer = 0;
        if (Math.random() < 0.65 && particleSystem) {
          particleSystem.emitCheckpointAmbient(this.x + 8, this.y - this.poleHeight + 8);
        }
      }
    } else {
      // Resting position near bottom of pole if inactive
      if (this.flagRaiseProgress > 0.15) {
        this.flagRaiseProgress = Math.max(0.15, this.flagRaiseProgress - dt * 1.5);
      }

      // Require user keypress (F or E) when in range to activate
      if (this.isPlayerInRange && input && input.interactJustPressed) {
        this.activate(particleSystem);
        return true; // Newly activated
      }
    }

    return false;
  }

  draw(ctx, player) {
    ctx.save();

    const isNear = player && Math.hypot(player.centerX - this.x, player.centerY - (this.y - 30)) < 180;
    const pulse = Math.sin(this.glowTimer) * 0.5 + 0.5;

    // 1. Ground Light Aura & Pedestal Shadow
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 22, 6, 0, 0, Math.PI * 2);
    if (this.isActive) {
      ctx.fillStyle = `rgba(16, 185, 129, ${0.25 + pulse * 0.2})`;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 14 + pulse * 8;
    } else if (this.isPlayerInRange) {
      ctx.fillStyle = `rgba(56, 189, 248, ${0.25 + pulse * 0.2})`;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 0;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // 2. Pedestal Base
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = this.isPlayerInRange && !this.isActive ? '#38bdf8' : '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    this.drawRoundedRect(ctx, this.x - 14, this.y - 7, 28, 7, 3);
    ctx.fill();
    ctx.stroke();

    // Base glowing power core
    ctx.fillStyle = this.isActive ? '#10b981' : (this.isPlayerInRange ? '#38bdf8' : '#ef4444');
    if (this.isActive || this.isPlayerInRange) {
      ctx.shadowColor = this.isActive ? '#10b981' : '#38bdf8';
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Flag Pole
    const poleTopY = this.y - this.poleHeight;
    const poleGradient = ctx.createLinearGradient(this.x - 2, 0, this.x + 2, 0);
    poleGradient.addColorStop(0, '#cbd5e1');
    poleGradient.addColorStop(0.5, '#f8fafc');
    poleGradient.addColorStop(1, '#64748b');

    ctx.fillStyle = poleGradient;
    ctx.fillRect(this.x - 2, poleTopY, 4, this.poleHeight - 5);

    // Pole decorative brass rings
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(this.x - 3, poleTopY + 8, 6, 2);
    ctx.fillRect(this.x - 3, this.y - 12, 6, 2);

    // 4. Pole Top Finial (Glowing Golden Finial Orb)
    ctx.fillStyle = this.isActive ? '#fde047' : (this.isPlayerInRange ? '#7dd3fc' : '#94a3b8');
    if (this.isActive) {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14 + pulse * 6;
    } else if (this.isPlayerInRange) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10 + pulse * 5;
    }
    ctx.beginPath();
    ctx.arc(this.x, poleTopY - 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Finial shine highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x - 1.5, poleTopY - 3.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 5. Procedural Animated Waving Cloth Flag
    const minFlagY = this.y - 28;
    const maxFlagY = poleTopY + 4;
    const currentFlagY = minFlagY + (maxFlagY - minFlagY) * this.flagRaiseProgress;

    const flagH = this.flagHeight;
    const flagW = this.flagWidth;

    ctx.save();
    ctx.translate(this.x + 2, currentFlagY);

    const segments = 6;
    const segWidth = flagW / segments;
    const topPoints = [];
    const bottomPoints = [];

    for (let i = 0; i <= segments; i++) {
      const segX = i * segWidth;
      const waveFactor = i / segments;
      const wave = Math.sin(this.waveTimer + i * 0.9) * (4.5 * waveFactor);
      const waveYOffset = Math.cos(this.waveTimer * 0.8 + i * 0.6) * (1.5 * waveFactor);

      topPoints.push({ x: segX, y: wave + waveYOffset });
      const taper = i === segments ? flagH * 0.15 : 0;
      bottomPoints.push({ x: segX, y: flagH - taper + wave * 0.85 + waveYOffset });
    }

    // Flag Gradient
    const flagGradient = ctx.createLinearGradient(0, 0, flagW, flagH);
    if (this.isActive) {
      flagGradient.addColorStop(0, '#059669');
      flagGradient.addColorStop(0.5, '#10b981');
      flagGradient.addColorStop(1, '#34d399');
      ctx.shadowColor = 'rgba(16, 185, 129, 0.65)';
      ctx.shadowBlur = 12;
    } else {
      flagGradient.addColorStop(0, '#be123c');
      flagGradient.addColorStop(0.6, '#e11d48');
      flagGradient.addColorStop(1, '#f43f5e');
      ctx.shadowBlur = 0;
    }

    // Draw Cloth Polygon
    ctx.beginPath();
    ctx.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 1; i <= segments; i++) {
      const prev = topPoints[i - 1];
      const curr = topPoints[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    ctx.lineTo(topPoints[segments].x, topPoints[segments].y);

    // End swallowtail pennant notch
    ctx.lineTo(flagW - 6, (topPoints[segments].y + bottomPoints[segments].y) / 2);

    ctx.lineTo(bottomPoints[segments].x, bottomPoints[segments].y);
    for (let i = segments - 1; i >= 0; i--) {
      const prev = bottomPoints[i + 1];
      const curr = bottomPoints[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    ctx.closePath();

    ctx.fillStyle = flagGradient;
    ctx.fill();

    // Flag border trim
    ctx.strokeStyle = this.isActive ? '#fbbf24' : '#fda4af';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Emblem in middle of flag
    const emblemWave = Math.sin(this.waveTimer + 1.2) * 2;
    const emblemX = flagW * 0.42;
    const emblemY = flagH * 0.5 + emblemWave;

    ctx.fillStyle = this.isActive ? '#fef08a' : '#ffe4e6';
    ctx.beginPath();
    if (this.isActive) {
      // Golden Star / Diamond Emblem
      ctx.moveTo(emblemX, emblemY - 5);
      ctx.lineTo(emblemX + 4, emblemY);
      ctx.lineTo(emblemX, emblemY + 5);
      ctx.lineTo(emblemX - 4, emblemY);
      ctx.closePath();
    } else {
      // Inactive Circle Emblem
      ctx.arc(emblemX, emblemY, 3.5, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.restore();

    // 6. Floating Label & Key Prompt
    const labelY = poleTopY - 20;
    ctx.save();

    if (this.isActive) {
      // Active Checkpoint Badge
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      const tagText = `🚩 ${this.label}`;
      const metrics = ctx.measureText(tagText);
      const bgW = metrics.width + 18;
      const bgH = 22;

      ctx.fillStyle = 'rgba(6, 78, 59, 0.92)';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      this.drawRoundedRect(ctx, this.x - bgW / 2, labelY - bgH / 2, bgW, bgH, 11);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a7f3d0';
      ctx.fillText(tagText, this.x, labelY + 4);
    } else if (this.isPlayerInRange) {
      // Interactive [F] ACTIVATE CHECKPOINT Prompt
      const bounce = Math.sin(this.glowTimer * 2.5) * 2.5;
      const promptY = labelY + bounce;

      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      const promptText = `CLAIM CHECKPOINT`;
      const textMetrics = ctx.measureText(promptText);
      const bgW = textMetrics.width + 38;
      const bgH = 26;

      ctx.shadowColor = 'rgba(56, 189, 248, 0.65)';
      ctx.shadowBlur = 12 + pulse * 6;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      this.drawRoundedRect(ctx, this.x - bgW / 2, promptY - bgH / 2, bgW, bgH, 13);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Key Kbd Box [F]
      const kbdX = this.x - bgW / 2 + 5;
      const kbdY = promptY - 9;
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      this.drawRoundedRect(ctx, kbdX, kbdY, 18, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('F', kbdX + 9, kbdY + 13);

      // Prompt Text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(promptText, kbdX + 24, promptY + 3.5);
    } else if (isNear) {
      // Subtle Dormant Name Tag
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      const tagText = `${this.label}`;
      const metrics = ctx.measureText(tagText);
      const bgW = metrics.width + 16;
      const bgH = 20;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      this.drawRoundedRect(ctx, this.x - bgW / 2, labelY - bgH / 2, bgW, bgH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(tagText, this.x, labelY + 4);
    }

    ctx.restore();
    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// =============================================================================
// 7. WORLD & SCENE PLATFORMS
// =============================================================================
class World {
  constructor() {
    this.platforms = [
      // 1. Starting Platform & Tutorial Area
      { x: 40, y: 340, width: 340, height: 40, label: 'Start' },
    // Wall-jump training & challenge zone (placed to the left of the original area)
    const wallJumpZone = [
      // Extension bridge leading left from Start Ground
      { x: -140, y: 340, width: 180, height: 40, label: 'Wall Zone' },

      // Tall single-wall climbing pillar
      { x: -200, y: 60, width: 44, height: 320, label: 'Wall Climb' },
      { x: -260, y: 60, width: 104, height: 24 },

      // Dual-wall chimney / shaft for zig-zag wall jumping
      { x: -440, y: 40, width: 36, height: 360 },
      { x: -320, y: 40, width: 36, height: 360, label: 'Wall Shaft' },
      { x: -440, y: 400, width: 156, height: 30 },

      // Upper summit platform on the far left
      { x: -500, y: 20, width: 160, height: 24, label: 'Summit' },
      { x: -280, y: 220, width: 70, height: 22 },
    ];

    // Original level platforms (preserved verbatim to prevent merge conflicts)
    const originalPlatforms = [
      // 1. Spawn / Main Ground Platform
      { x: 40, y: 340, width: 380, height: 40, label: 'Start Ground' },

      // 2. Stepping Stones
      { x: 480, y: 320, width: 140, height: 26 },
      { x: 680, y: 260, width: 140, height: 26 },

      // 3. High Vantage Peak
      { x: 920, y: 130, width: 220, height: 30, label: 'Peak' },

      // 4. Multi-Anchor Chasm Sequence
      { x: 1260, y: 340, width: 140, height: 30 },
      { x: 1520, y: 300, width: 160, height: 30 },
      { x: 1800, y: 260, width: 160, height: 30 },

      // 5. Sky Runway Finale
      { x: 2100, y: 180, width: 380, height: 40, label: 'Sky Runway' },

      // 6. Upper Secret Sanctuary Platforms (Reach via Boost Swings)
      { x: 280, y: 120, width: 120, height: 24, label: 'Secret Island' },
      { x: 520, y: 60, width: 110, height: 24 },
      { x: 1380, y: 80, width: 130, height: 24, label: 'High Spire' },
      { x: 1700, y: 40, width: 140, height: 24, label: 'Sky Sanctuary' },
    ];

    this.anchors = [
      // Anchor 1: Start Gap Swing
      new GrappleAnchor(440, 140, 'Swing 1'),

      // Anchor 2: Vault up to Peak
      new GrappleAnchor(840, 70, 'High Vault'),

      // Anchor 3, 4, 5: Chasm Swings
      new GrappleAnchor(1200, 140, 'Chasm A'),
      new GrappleAnchor(1460, 130, 'Chasm B'),
      new GrappleAnchor(1740, 100, 'Chasm C'),

      // Anchor 6: Slingshot to Sky Runway
      new GrappleAnchor(2020, 70, 'Super Boost'),

      // Upper Route Anchors
      new GrappleAnchor(400, 20, 'Secret Ring'),
      new GrappleAnchor(1540, -40, 'Sanctuary Spire'),
    ];
  }

  update(dt) {
    for (const anchor of this.anchors) {
      anchor.update(dt);
    }
  }

  draw(ctx) {
    // 1. Draw Platforms
    this.platforms = [...wallJumpZone, ...originalPlatforms];
    // Prominent Checkpoints placed on diverse platforms across the map
    this.checkpoints = [
      new Checkpoint(160, 340, 'Base Camp', true),
      new Checkpoint(1270, 80, 'Summit Peak', false),
      new Checkpoint(1530, 380, 'Sunken Outpost', false),
      new Checkpoint(2110, 240, 'Sky Runway', false),
      new Checkpoint(340, 140, 'High Haven', false),
    ];
  }

  update(dt, player, particleSystem, input, onCheckpointActivated) {
    for (const cp of this.checkpoints) {
      const activated = cp.update(dt, player, particleSystem, input);
      if (activated) {
        // Deactivate all other checkpoints so only current one is active
        for (const other of this.checkpoints) {
          if (other !== cp) {
            other.deactivate();
          }
        }
        if (onCheckpointActivated) {
          onCheckpointActivated(cp);
        }
      }
    }
  }

  draw(ctx, player) {
    // Draw Platforms
    for (const plat of this.platforms) {
      ctx.fillStyle = CONFIG.colors.platformBody;
      ctx.strokeStyle = CONFIG.colors.platformBorder;
      ctx.lineWidth = 2;

      ctx.beginPath();
      this.drawRoundedRect(ctx, plat.x, plat.y, plat.width, plat.height, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = CONFIG.colors.platformTop;
      ctx.beginPath();
      this.drawRoundedRect(ctx, plat.x + 2, plat.y + 1, plat.width - 4, 6, 3);
      ctx.fill();

      if (plat.label) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(plat.label, plat.x + plat.width / 2, plat.y + plat.height - 10);
      }
    }

    // 2. Draw Grapple Anchors
    for (const anchor of this.anchors) {
      anchor.draw(ctx);
    // Draw Checkpoint Flags
    for (const cp of this.checkpoints) {
      cp.draw(ctx, player);
    }
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// =============================================================================
// 10. GAME ENGINE & MAIN LOOP
// 8. GAME ENGINE & LOOP
// =============================================================================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.statsDisplay = document.getElementById('statsDisplay');

    this.sound = new SoundSystem();
    this.input = new InputManager(this.canvas);
    this.input.onFirstUserInteraction = () => this.sound.init();

    this.particleSystem = new ParticleSystem();
    this.world = new World();
    this.player = new Player(CONFIG.world.spawnPoint.x, CONFIG.world.spawnPoint.y);
    this.camera = new Camera(CONFIG.canvas.width, CONFIG.canvas.height);

    // Checkpoint & Respawn state
    this.currentCheckpoint = this.world.checkpoints.find(c => c.isActive) || this.world.checkpoints[0];
    this.currentSpawnPoint = this.currentCheckpoint ? { ...this.currentCheckpoint.spawnPoint } : { ...CONFIG.world.spawnPoint };

    // Snap player & camera to initial spawn point
    this.player.x = this.currentSpawnPoint.x;
    this.player.y = this.currentSpawnPoint.y;
    this.camera.snapTo(this.player.centerX, this.player.centerY);

    // On-screen Checkpoint activation banner
    this.checkpointBanner = {
      active: false,
      title: '',
      subtitle: '',
      timer: 0,
      maxTime: 2.6,
    };

    this.respawnCount = 0;
    this.debugMode = false;

    this.lastTime = performance.now();
    this.fps = 60;
    this.fpsTimer = 0;
    this.frameCount = 0;

    this.updateHUD();

    // Start Game Loop
    requestAnimationFrame((time) => this.loop(time));
  }

  showCheckpointBanner(title, subtitle) {
    this.checkpointBanner = {
      active: true,
      title,
      subtitle,
      timer: 2.6,
      maxTime: 2.6,
    };
  }

  updateHUD() {
    if (this.statsDisplay) {
      const cpName = this.currentCheckpoint ? this.currentCheckpoint.label : 'Base Camp';
      this.statsDisplay.textContent = `FPS: ${this.fps} | Respawns: ${this.respawnCount} | Checkpoint: ${cpName}`;
    }
  }

  update(dt) {
    if (this.input.debugJustPressed) {
      this.debugMode = !this.debugMode;
    }

    if (this.input.restartJustPressed) {
      this.triggerRespawn();
    }

    const mouseWorldPos = this.camera.screenToWorld(this.input.mouseX, this.input.mouseY);

    this.world.update(dt);

    this.player.update(
      dt,
      this.input,
      this.world.platforms,
      this.world.anchors,
      this.particleSystem,
      this.sound,
      mouseWorldPos
    );
    // Update World & Checkpoints (passes input for interact key)
    this.world.update(dt, this.player, this.particleSystem, this.input, (activatedCheckpoint) => {
      this.currentCheckpoint = activatedCheckpoint;
      this.currentSpawnPoint = { ...activatedCheckpoint.spawnPoint };
      this.showCheckpointBanner('CHECKPOINT ACTIVATED!', activatedCheckpoint.label);
      this.updateHUD();
    });

    // Update Checkpoint Banner Animation Timer
    if (this.checkpointBanner.active) {
      this.checkpointBanner.timer -= dt;
      if (this.checkpointBanner.timer <= 0) {
        this.checkpointBanner.active = false;
      }
    }

    // Update Player & Physics
    this.player.update(dt, this.input, this.world.platforms, this.particleSystem);

    if (this.player.y > CONFIG.world.deathY) {
      this.triggerRespawn();
    }

    this.camera.update(dt, this.player);
    this.particleSystem.update(dt);

    this.input.resetFrame();
  }

  triggerRespawn() {
    this.respawnCount++;
    this.player.respawn(CONFIG.world.spawnPoint, this.particleSystem);
    this.sound.playRespawn();
    const spawnPos = this.currentSpawnPoint || CONFIG.world.spawnPoint;
    this.player.respawn(spawnPos, this.particleSystem);
    this.updateHUD();
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Sky & Parallax Stars
    const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
    skyGradient.addColorStop(0, CONFIG.colors.skyTop);
    skyGradient.addColorStop(1, CONFIG.colors.skyBottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, w, h);

    this.drawParallaxStars(ctx);

    // 2. World Space
    this.camera.apply(ctx);

    this.world.draw(ctx);
    // Draw Platforms & Checkpoints
    this.world.draw(ctx, this.player);

    // Draw Particles
    this.particleSystem.draw(ctx);
    this.player.draw(ctx);

    if (this.debugMode) {
      this.drawDebug(ctx);
    }

    this.camera.restore(ctx);

    // 3. Screen Space UI
    // -------------------------------------------------------------------------
    // 3. Screen Space UI & HUD
    // -------------------------------------------------------------------------
    if (this.checkpointBanner.active) {
      this.drawCheckpointBanner(ctx, w, h);
    }

    if (this.debugMode) {
      this.drawDebugOverlay(ctx);
    }
  }

  drawCheckpointBanner(ctx, w, h) {
    const banner = this.checkpointBanner;
    const elapsed = banner.maxTime - banner.timer;
    let alpha = 1;
    let slideY = 0;

    // Entrance bounce / fade-in
    if (elapsed < 0.3) {
      const p = elapsed / 0.3;
      alpha = p;
      slideY = (1 - p) * -20;
    } else if (banner.timer < 0.5) {
      alpha = banner.timer / 0.5;
      slideY = (1 - alpha) * -12;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    const bannerW = 340;
    const bannerH = 56;
    const bannerX = (w - bannerW) / 2;
    const bannerY = 48 + slideY;

    // Background pill with emerald glow
    ctx.shadowColor = 'rgba(16, 185, 129, 0.7)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(11, 15, 25, 0.94)';
    ctx.beginPath();
    this.world.drawRoundedRect(ctx, bannerX, bannerY, bannerW, bannerH, 14);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Banner Icon
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚩', bannerX + 32, bannerY + 36);

    // Banner Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText(banner.title, bannerX + 58, bannerY + 24);

    // Banner Subtitle
    ctx.fillStyle = '#f8fafc';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Respawn location: ${banner.subtitle}`, bannerX + 58, bannerY + 43);

    ctx.restore();
  }

  drawParallaxStars(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';

    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      const seedX = (i * 137.5) % this.canvas.width;
      const seedY = (i * 93.3) % this.canvas.height;
      const parallaxFactor = 0.05 + (i % 3) * 0.04;

      const starX = (seedX - this.camera.x * parallaxFactor) % this.canvas.width;
      const starY = (seedY - this.camera.y * parallaxFactor) % this.canvas.height;

      const wrappedX = starX < 0 ? starX + this.canvas.width : starX;
      const wrappedY = starY < 0 ? starY + this.canvas.height : starY;
      const radius = (i % 3 === 0) ? 1.5 : 1.0;

      ctx.beginPath();
      ctx.arc(wrappedX, wrappedY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawDebug(ctx) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);

    ctx.strokeStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(this.player.centerX, this.player.centerY);
    ctx.lineTo(this.player.centerX + this.player.vx * 0.1, this.player.centerY + this.player.vy * 0.1);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(this.player.centerX, this.player.centerY, CONFIG.grapple.maxRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Checkpoint Trigger Hitboxes
    for (const cp of this.world.checkpoints) {
      const b = cp.triggerBounds;
      ctx.strokeStyle = cp.isActive ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x, b.y, b.width, b.height);

      // Spawn marker
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cp.spawnPoint.x, cp.spawnPoint.y, 4, 4);
    }

    // Death line indicator
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(-1000, CONFIG.world.deathY);
    ctx.lineTo(4000, CONFIG.world.deathY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawDebugOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(16, 60, 260, 165);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 60, 260, 165);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(16, 60, 260, 150);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 60, 260, 150);

    const activeCpName = this.currentCheckpoint ? this.currentCheckpoint.label : 'None';

    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px monospace';
    ctx.fillText(`DEBUG MODE (F3)`, 26, 80);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Pos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`, 26, 100);
    ctx.fillText(`Vel: (${Math.round(this.player.vx)}, ${Math.round(this.player.vy)})`, 26, 118);
    ctx.fillText(`Grounded: ${this.player.isGrounded} | Coyote: ${this.player.coyoteTimer.toFixed(2)}s`, 26, 136);
    ctx.fillText(`Grapple: [${this.player.grappleState.toUpperCase()}]`, 26, 154);
    ctx.fillText(`Rope Len: ${Math.round(this.player.ropeLength)}px`, 26, 172);
    ctx.fillText(`Active Particles: ${this.particleSystem.particles.length}`, 26, 190);
    ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, 26, 208);
    ctx.fillText(`Wall: ${this.player.isTouchingWall} (dir: ${this.player.wallDir}) | Slide: ${this.player.isWallSliding}`, 26, 154);
    ctx.fillText(`Wall Coyote: ${this.player.wallCoyoteTimer.toFixed(2)}s`, 26, 172);
    ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)}) | Particles: ${this.particleSystem.particles.length}`, 26, 190);
    ctx.fillText(`Vel: (${Math.round(this.player.vx)}, ${Math.round(this.player.vy)})`, 26, 120);
    ctx.fillText(`Grounded: ${this.player.isGrounded} | Coyote: ${this.player.coyoteTimer.toFixed(2)}s`, 26, 140);
    ctx.fillText(`Checkpoint: ${activeCpName}`, 26, 160);
    ctx.fillText(`Spawn Pos: (${Math.round(this.currentSpawnPoint.x)}, ${Math.round(this.currentSpawnPoint.y)})`, 26, 180);
    ctx.fillText(`Active Particles: ${this.particleSystem.particles.length}`, 26, 195);
    ctx.restore();
  }

  loop(currentTime) {
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    if (dt > 0.1) dt = 0.1;

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round((this.frameCount / this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = 0;
      this.updateHUD();
    }

    this.update(dt);
    this.render();

    requestAnimationFrame((time) => this.loop(time));
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    new Game();
  });
} else {
  new Game();
}
