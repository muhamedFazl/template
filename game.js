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

    // Timers for game feel
    this.coyoteTimer = 0;
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
    // 1. Timers & Input Buffering
    if (this.isGrounded) {
      this.coyoteTimer = CONFIG.physics.coyoteTime;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
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
    }

    // Variable jump cut
    if (!input.jump && this.vy < 0) {
      this.vy += CONFIG.physics.gravity * (1 - CONFIG.physics.jumpCutMultiplier) * dt * 2.5;
    }

    // Gravity & Terminal Velocity
    this.vy += CONFIG.physics.gravity * dt;
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
// =============================================================================
class World {
  constructor() {
    this.platforms = [
      // 1. Starting Platform & Tutorial Area
      { x: 40, y: 340, width: 340, height: 40, label: 'Start' },

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

    this.camera.snapTo(this.player.centerX, this.player.centerY);

    this.respawnCount = 0;
    this.debugMode = false;

    this.lastTime = performance.now();
    this.fps = 60;
    this.fpsTimer = 0;
    this.frameCount = 0;

    requestAnimationFrame((time) => this.loop(time));
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
    this.particleSystem.draw(ctx);
    this.player.draw(ctx);

    if (this.debugMode) {
      this.drawDebug(ctx);
    }

    this.camera.restore(ctx);

    // 3. Screen Space UI
    if (this.debugMode) {
      this.drawDebugOverlay(ctx);
    }
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
      if (this.statsDisplay) {
        this.statsDisplay.textContent = `FPS: ${this.fps} | Respawns: ${this.respawnCount}`;
      }
    }

    this.update(dt);
    this.render();

    requestAnimationFrame((time) => this.loop(time));
  }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
