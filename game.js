/**
 * 2D Platformer Game Template
 * Pure Vanilla JavaScript & HTML5 Canvas - Zero Build Steps
 * 
 * Features:
 * - Responsive physics with coyote time, jump buffering & variable jump height
 * - Wall sliding & wall jumping mechanics with vertical chimney shafts
 * - Oscillating moving platforms (multi-block horizontal & vertical sine easing)
 * - Shiny aesthetics: animated specular sheen sweep, glossy highlights, corner star glints & neon glow
 * - Crumbling platforms (shake on step, break away, fall, and respawn)
 * - Hybrid moving & crumbling platforms (oscillate along tracks, fall when stepped on)
 * - Interactive Checkpoints system with animated waving flags & [F] prompt
 * - Procedural animated character with squash/stretch, blinking eyes, and dynamic tilting hat
 * - Particle system with landing dust, crumble debris, wall-slide dust & checkpoint sparkles
 * - Parallax starry sky & smooth camera tracking with lookahead offset
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
  player: {
    maxHp: 3,
    invulnerabilityDuration: 1.2, // Seconds of i-frames after taking damage
    knockback: {
      speedX: 290,          // Horizontal knockback impulse away from hazard
      speedY: 360,          // Vertical pop on hit
      duration: 0.22,       // Duration where knockback momentum overrides input
    },
  },
  hazards: {
    spikeHeight: 18,
    spikeToothWidth: 16,
  },
  camera: {
    lerpSpeed: 6.0,         // Camera follow tightness
    lookAheadDist: 80,      // Lookahead distance in facing direction
    verticalOffset: -30,    // Vertical bias for better view of what's ahead
  },
  world: {
    spawnPoint: { x: 140, y: 220 },
    deathY: 700,            // Y-coordinate below which the player respawns
  },
  colors: {
    skyTop: '#0b0f19',
    skyBottom: '#1a2333',
    grid: 'rgba(255, 255, 255, 0.03)',

    // Static Platforms (Shiny Emerald)
    platformTop: '#4ade80',
    platformTopGloss: '#bbf7d0',
    platformBody: '#1e293b',
    platformBodyDark: '#0f172a',
    platformBorder: '#22c55e',
    platformGlow: 'rgba(74, 222, 128, 0.25)',

    // Moving Platforms (Shiny Tech Blue / Cyan)
    platformMovingTop: '#38bdf8',
    platformMovingTopGloss: '#e0f2fe',
    platformMovingBody: '#0f2744',
    platformMovingBodyDark: '#031926',
    platformMovingBorder: '#0284c7',
    platformMovingGlow: 'rgba(56, 189, 248, 0.4)',
    platformTrack: 'rgba(56, 189, 248, 0.25)',
    platformTrackDot: 'rgba(56, 189, 248, 0.75)',

    // Crumbling Platforms (Shiny Amber / Topaz)
    platformCrumbleTop: '#fb923c',
    platformCrumbleTopGloss: '#fef08a',
    platformCrumbleBody: '#3b1c10',
    platformCrumbleBodyDark: '#200c05',
    platformCrumbleBorder: '#f97316',
    platformCrumbleGlow: 'rgba(249, 115, 22, 0.4)',
    platformCrumbleCrack: '#fed7aa',

    // Moving & Crumbling (Shiny Amethyst / Gem)
    platformHybridTop: '#e879f9',
    platformHybridTopGloss: '#fdf4ff',
    platformHybridBody: '#3b0764',
    platformHybridBodyDark: '#21023a',
    platformHybridBorder: '#c026d3',
    platformHybridGlow: 'rgba(232, 121, 249, 0.45)',
    platformHybridTrack: 'rgba(232, 121, 249, 0.25)',
    platformHybridTrackDot: 'rgba(232, 121, 249, 0.75)',

    // Player & Particles
    playerBody: '#38bdf8',
    playerGlow: 'rgba(56, 189, 248, 0.35)',
    playerEye: '#0f172a',
    playerHat: '#f43f5e',
    playerHatBand: '#fbbf24',
    playerHatBrim: '#e11d48',
    particle: '#38bdf8',
    spikeBody: '#ef4444',
    spikeGlow: 'rgba(239, 68, 68, 0.35)',
    spikeHighlight: '#fca5a5',
    spikeBase: '#334155',
    damageParticle: '#ef4444',
    heartFull: '#f43f5e',
    heartEmpty: '#334155',
    checkpointActive: '#10b981',
    checkpointInactive: '#ef4444',
    checkpointGlow: 'rgba(16, 185, 129, 0.4)',
  },
  lighting: {
    enabled: true,
    ambientDarkness: 0.78,   // Ambient darkness intensity outside lantern radius (0.0 = bright, 1.0 = pitch black)
    ambientColor: '#070b14', // Color tint of the ambient night/shadows
    lantern: {
      // Radius r: Illuminates the surroundings by a radius r.
      // Configured to 5x the player character size (player height: 42px * 5 = 210px).
      // You can tweak 'baseRadius' or 'radiusMultiplier' below to adjust the illumination size!
      radiusMultiplier: 5.0,
      baseRadius: 210,         // Radius r in pixels (5 * player height 42px)
      flickerSpeed: 8.5,       // Speed of flame flickering
      flickerAmount: 6.0,      // Pixel variance for organic flame flickers
      glowColorInner: 'rgba(244, 63, 94, 0.38)',  // Rich pink surroundings illumination
      glowColorMid: 'rgba(236, 72, 153, 0.20)',   // Soft mid pink ambient aura
      glowColorOuter: 'rgba(219, 39, 119, 0)',    // Smooth falloff to darkness
      flameBodyColor: '#db2777',                  // Deep vibrant rose-pink outer flame
      flameMidColor: '#ec4899',                   // Vivid hot-pink flame body
      flameCoreColor: '#f472b6',                  // Bright saturated pink flame core (no pure white!)
    }
  }
};

// =============================================================================
// 2. INPUT MANAGER
// =============================================================================
class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};

    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling on game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
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

    // Reset keys if window loses focus to prevent sticky inputs
    window.addEventListener('blur', () => {
      this.keys = {};
      this.justPressed = {};
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  isJustPressed(code) {
    return !!this.justPressed[code];
  }

  // Clear single-frame triggers at the end of each frame
  resetFrame() {
    this.justPressed = {};
  }

  get left() {
    return this.isDown('KeyA') || this.isDown('ArrowLeft');
  }

  get right() {
    return this.isDown('KeyD') || this.isDown('ArrowRight');
  }

  get jump() {
    return this.isDown('Space') || this.isDown('KeyW') || this.isDown('ArrowUp');
  }

  get jumpJustPressed() {
    return this.isJustPressed('Space') || this.isJustPressed('KeyW') || this.isJustPressed('ArrowUp');
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
// 3. PARTICLE SYSTEM
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

  emitConfetti(x, y, count = 48) {
    const colors = ['#38bdf8', '#4ade80', '#fbbf24', '#f43f5e', '#a855f7', '#facc15', '#f8fafc'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.85 + Math.random() * (Math.PI * 0.7);
      const speed = 120 + Math.random() * 320;
      const lifetime = 0.8 + Math.random() * 1.2;
      const size = 3 + Math.random() * 4;
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x: x + (Math.random() - 0.5) * 50,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        initialSize: size,
        color,
        lifetime,
        maxLife: lifetime,
        gravity: 260,
      });
    }
  }

  emitSparkle(x, y) {
    this.emit(x, y, 1, {
      color: Math.random() > 0.5 ? '#fbbf24' : '#38bdf8',
      sizeMin: 2,
      sizeMax: 3.5,
      speedMin: 10,
      speedMax: 35,
      lifeMin: 0.3,
      lifeMax: 0.6,
      gravity: -20,
    });
  }

  emitDamage(x, y) {
    // Red damage burst + warning sparks
    this.emit(x, y, 16, {
      color: CONFIG.colors.damageParticle,
      sizeMin: 3,
      sizeMax: 7,
      speedMin: 80,
      speedMax: 240,
      lifeMin: 0.25,
      lifeMax: 0.55,
      gravity: 350,
    });
    this.emit(x, y, 8, {
      color: '#fbbf24',
      sizeMin: 2,
      sizeMax: 4,
      speedMin: 60,
      speedMax: 180,
      lifeMin: 0.2,
      lifeMax: 0.4,
      gravity: 200,
    });
  }

  emitCrumbleDust(centerX, topY, width) {
    for (let i = 0; i < 8; i++) {
      const px = centerX - width / 2 + Math.random() * width;
      this.emit(px, topY, 1, {
        color: Math.random() < 0.5 ? '#ea580c' : '#fed7aa',
        sizeMin: 2,
        sizeMax: 4.5,
        speedMin: 20,
        speedMax: 70,
        angleMin: -Math.PI * 0.9,
        angleMax: -Math.PI * 0.1,
        lifeMin: 0.3,
        lifeMax: 0.6,
        gravity: 400,
      });
    }
  }

  emitBreak(centerX, centerY, width) {
    // Burst of shiny debris when crumbling platform falls
    for (let i = 0; i < 18; i++) {
      const px = centerX - width / 2 + Math.random() * width;
      this.emit(px, centerY, 1, {
        color: ['#fb923c', '#ea580c', '#fef08a', '#fdba74', '#ffffff'][Math.floor(Math.random() * 5)],
        sizeMin: 3,
        sizeMax: 7,
        speedMin: 40,
        speedMax: 190,
        angleMin: 0,
        angleMax: Math.PI * 2,
        lifeMin: 0.4,
        lifeMax: 0.85,
        gravity: 600,
      });
    }
  }

  emitRespawnGlow(centerX, centerY, width) {
    // Magical sparkle when platform re-materializes
    for (let i = 0; i < 14; i++) {
      const px = centerX - width / 2 + Math.random() * width;
      this.emit(px, centerY + 8, 1, {
        color: ['#67e8f9', '#a5f3fc', '#e879f9', '#fdf4ff', '#ffffff'][Math.floor(Math.random() * 5)],
        sizeMin: 2,
        sizeMax: 5,
        speedMin: 20,
        speedMax: 85,
        angleMin: -Math.PI * 0.85,
        angleMax: -Math.PI * 0.15,
        lifeMin: 0.4,
        lifeMax: 0.9,
        gravity: -100, // Float upwards
      });
    }
  }

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

  emitLanternEmber(x, y) {
    this.emit(x, y, 1, {
      color: Math.random() > 0.5 ? '#ec4899' : '#f472b6',
      sizeMin: 1.5,
      sizeMax: 2.8,
      speedMin: 15,
      speedMax: 45,
      lifeMin: 0.35,
      lifeMax: 0.65,
      angleMin: -Math.PI * 0.75,
      angleMax: -Math.PI * 0.25,
      gravity: -80, // Gently float upward
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
// 4. PLATFORM SYSTEM (MOVING, CRUMBLING & SHINY AESTHETICS)
// =============================================================================
class Platform {
  constructor(config = {}) {
    // Platform Type: 'static' | 'moving' | 'crumbling' | 'moving_crumbling'
    this.type = config.type || 'static';
    this.startX = config.x || 0;
    this.startY = config.y || 0;
    this.x = this.startX;
    this.y = this.startY;
    this.width = config.width || 120;
    this.height = config.height || 26;
    this.label = config.label || '';

    // Movement Properties (Oscillating sine easing)
    this.oscX = config.oscX || 0;         // Max horizontal displacement (px)
    this.oscY = config.oscY || 0;         // Max vertical displacement (px)
    this.speedX = config.speedX || 1.4;   // Oscillation frequency/speed X
    this.speedY = config.speedY || 1.4;   // Oscillation frequency/speed Y
    this.phaseX = config.phaseX || 0;     // Starting phase offset (rad)
    this.phaseY = config.phaseY || 0;
    this.timeX = this.phaseX;
    this.timeY = this.phaseY;

    // Movement Delta (velocity transfer to player)
    this.deltaX = 0;
    this.deltaY = 0;
    this.prevX = this.x;
    this.prevY = this.y;

    // Crumbling Lifecycle State
    // States: 'intact' -> 'shaking' -> 'falling' -> 'respawning'
    this.state = 'intact';
    this.crumbleDuration = config.crumbleDuration || 0.75; // Time shaking before breaking
    this.crumbleTimer = 0;
    this.respawnDelay = config.respawnDelay || 2.4;        // Time before coming back
    this.respawnTimer = 0;
    this.fallVelocity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.alpha = 1.0;

    // Shiny / Gloss Aesthetics
    this.sheenProgress = Math.random(); // 0 to 1 looping progress for glossy reflection
    this.sheenSpeed = 0.35 + Math.random() * 0.15;
    this.glintTimer = Math.random() * Math.PI * 2;
  }

  get isSolid() {
    return this.state === 'intact' || this.state === 'shaking';
  }

  isMoving() {
    return this.type === 'moving' || this.type === 'moving_crumbling';
  }

  isCrumbling() {
    return this.type === 'crumbling' || this.type === 'moving_crumbling';
  }

  isOscillating() {
    return this.oscX !== 0 || this.oscY !== 0;
  }

  onStepped(player, particleSystem) {
    if (this.isCrumbling() && this.state === 'intact') {
      this.state = 'shaking';
      this.crumbleTimer = this.crumbleDuration;
      if (particleSystem) {
        particleSystem.emitCrumbleDust(this.x + this.width / 2, this.y, this.width);
      }
    }
  }

  update(dt, particleSystem) {
    this.prevX = this.x;
    this.prevY = this.y;

    // Update Sheen sweep & Glint timers for glossy specular effect
    this.sheenProgress = (this.sheenProgress + this.sheenSpeed * dt) % 1.0;
    this.glintTimer += dt * 3.5;

    // 1. Moving / Oscillation logic
    if (this.isOscillating() && this.state !== 'falling' && this.state !== 'respawning') {
      this.timeX += this.speedX * dt;
      this.timeY += this.speedY * dt;

      const targetX = this.startX + Math.sin(this.timeX) * this.oscX;
      const targetY = this.startY + Math.sin(this.timeY) * this.oscY;

      this.x = targetX;
      this.y = targetY;
    }

    // 2. Crumble State Machine
    if (this.state === 'shaking') {
      this.crumbleTimer -= dt;
      
      // Calculate intensifying shake
      const intensity = 1 + (1 - this.crumbleTimer / this.crumbleDuration) * 3.5;
      this.shakeOffsetX = (Math.random() * 2 - 1) * intensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * intensity;

      if (Math.random() < 0.25 && particleSystem) {
        particleSystem.emitCrumbleDust(this.x + this.width / 2, this.y, this.width);
      }

      if (this.crumbleTimer <= 0) {
        // Break and start falling
        this.state = 'falling';
        this.fallVelocity = 80;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        if (particleSystem) {
          particleSystem.emitBreak(this.x + this.width / 2, this.y + this.height / 2, this.width);
        }
      }
    } else if (this.state === 'falling') {
      // Accelerate downwards and fade out
      this.fallVelocity += 1200 * dt;
      this.y += this.fallVelocity * dt;
      this.alpha = Math.max(0, this.alpha - dt * 2.8);

      if (this.alpha <= 0 || this.y > this.startY + 500) {
        this.state = 'respawning';
        this.respawnTimer = this.respawnDelay;
        this.alpha = 0;
      }
    } else if (this.state === 'respawning') {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        // Reset to initial position
        this.state = 'intact';
        this.alpha = 1.0;
        this.fallVelocity = 0;
        this.x = this.startX + (this.oscX !== 0 ? Math.sin(this.timeX) * this.oscX : 0);
        this.y = this.startY + (this.oscY !== 0 ? Math.sin(this.timeY) * this.oscY : 0);
        if (particleSystem) {
          particleSystem.emitRespawnGlow(this.x + this.width / 2, this.y + this.height / 2, this.width);
        }
      }
    }

    // Compute velocity displacement for riding player
    this.deltaX = this.x - this.prevX;
    this.deltaY = this.y - this.prevY;
  }

  drawTrack(ctx) {
    if (!this.isOscillating()) return;

    ctx.save();
    const isHybrid = this.type === 'moving_crumbling';
    const trackColor = isHybrid ? CONFIG.colors.platformHybridTrack : CONFIG.colors.platformTrack;
    const dotColor = isHybrid ? CONFIG.colors.platformHybridTrackDot : CONFIG.colors.platformTrackDot;

    const minX = this.startX - this.oscX + this.width / 2;
    const maxX = this.startX + this.oscX + this.width / 2;
    const minY = this.startY - this.oscY + this.height / 2;
    const maxY = this.startY + this.oscY + this.height / 2;

    // Track Rail Line
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(minX, minY);
    ctx.lineTo(maxX, maxY);
    ctx.stroke();
    ctx.setLineDash([]);

    // End Stoppers (Glowing Dots)
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(minX, minY, 3.5, 0, Math.PI * 2);
    ctx.arc(maxX, maxY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  draw(ctx) {
    if (this.state === 'respawning') return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    const drawX = this.x + this.shakeOffsetX;
    const drawY = this.y + this.shakeOffsetY;
    const w = this.width;
    const h = this.height;
    const r = 6;

    // Pick Theme Colors based on Platform Type
    let topColor = CONFIG.colors.platformTop;
    let topGlossColor = CONFIG.colors.platformTopGloss;
    let bodyColor = CONFIG.colors.platformBody;
    let bodyDarkColor = CONFIG.colors.platformBodyDark;
    let borderColor = CONFIG.colors.platformBorder;
    let glowColor = CONFIG.colors.platformGlow;

    if (this.type === 'moving') {
      topColor = CONFIG.colors.platformMovingTop;
      topGlossColor = CONFIG.colors.platformMovingTopGloss;
      bodyColor = CONFIG.colors.platformMovingBody;
      bodyDarkColor = CONFIG.colors.platformMovingBodyDark;
      borderColor = CONFIG.colors.platformMovingBorder;
      glowColor = CONFIG.colors.platformMovingGlow;
    } else if (this.type === 'crumbling') {
      topColor = CONFIG.colors.platformCrumbleTop;
      topGlossColor = CONFIG.colors.platformCrumbleTopGloss;
      bodyColor = CONFIG.colors.platformCrumbleBody;
      bodyDarkColor = CONFIG.colors.platformCrumbleBodyDark;
      borderColor = CONFIG.colors.platformCrumbleBorder;
      glowColor = CONFIG.colors.platformCrumbleGlow;
    } else if (this.type === 'moving_crumbling') {
      topColor = CONFIG.colors.platformHybridTop;
      topGlossColor = CONFIG.colors.platformHybridTopGloss;
      bodyColor = CONFIG.colors.platformHybridBody;
      bodyDarkColor = CONFIG.colors.platformHybridBodyDark;
      borderColor = CONFIG.colors.platformHybridBorder;
      glowColor = CONFIG.colors.platformHybridGlow;
    }

    // 1. Neon Platform Glow Shadow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = (this.type !== 'static') ? 14 : 8;

    // 2. Shiny Body Gradient
    const bodyGradient = ctx.createLinearGradient(drawX, drawY, drawX, drawY + h);
    bodyGradient.addColorStop(0, bodyColor);
    bodyGradient.addColorStop(1, bodyDarkColor);

    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    this.drawRoundedRect(ctx, drawX, drawY, w, h, r);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0; // Turn off global shadow for interior highlights

    // 3. Top Glowing Edge (Energy / Grass Surface)
    const topEdgeGradient = ctx.createLinearGradient(drawX, drawY, drawX + w, drawY);
    topEdgeGradient.addColorStop(0, topColor);
    topEdgeGradient.addColorStop(0.5, topGlossColor);
    topEdgeGradient.addColorStop(1, topColor);

    ctx.fillStyle = topEdgeGradient;
    ctx.beginPath();
    this.drawRoundedRect(ctx, drawX + 2, drawY + 1, w - 4, 6, 3);
    ctx.fill();

    // 4. Animated Specular Sheen Sweep (Glossy Light Reflection)
    const sheenWidth = 36;
    const totalSpan = w + sheenWidth * 2;
    const sheenX = drawX - sheenWidth + this.sheenProgress * totalSpan;

    ctx.save();
    // Clip sheen to platform body
    ctx.beginPath();
    this.drawRoundedRect(ctx, drawX + 2, drawY + 1, w - 4, h - 2, r - 1);
    ctx.clip();

    const sheenGradient = ctx.createLinearGradient(sheenX, drawY, sheenX + sheenWidth, drawY + h);
    sheenGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    sheenGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
    sheenGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = sheenGradient;
    ctx.fillRect(drawX, drawY, w, h);
    ctx.restore();

    // 5. Corner Star Glint (Periodic twinkling highlight)
    const glintAlpha = Math.max(0, Math.sin(this.glintTimer) * 0.85);
    if (glintAlpha > 0.1) {
      const glintX = drawX + 6;
      const glintY = drawY + 3;
      ctx.fillStyle = `rgba(255, 255, 255, ${glintAlpha})`;
      ctx.beginPath();
      ctx.arc(glintX, glintY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Crumbling Warning Cracks (when stepped on)
    if (this.state === 'shaking' || (this.isCrumbling() && this.state === 'falling')) {
      ctx.strokeStyle = CONFIG.colors.platformCrumbleCrack;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(drawX + w * 0.3, drawY + 2);
      ctx.lineTo(drawX + w * 0.35, drawY + 12);
      ctx.lineTo(drawX + w * 0.28, drawY + h - 3);

      ctx.moveTo(drawX + w * 0.65, drawY + 2);
      ctx.lineTo(drawX + w * 0.72, drawY + 10);
      ctx.lineTo(drawX + w * 0.68, drawY + h - 2);
      ctx.stroke();
    }

    // 7. Motion Arrows on Moving Platforms
    if (this.isMoving()) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      const arrowSymbol = this.oscX !== 0 && this.oscY !== 0 ? '⤢' : (this.oscX !== 0 ? '↔' : '↕');
      ctx.fillText(arrowSymbol, drawX + w / 2, drawY + h - 7);
    }

    // 8. Subtle Platform Label
    if (this.label) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.label, drawX + w / 2, drawY + h - 8);
    }

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
// 5. PLAYER
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

    // Health & Combat state
    this.maxHp = CONFIG.player.maxHp || 3;
    this.hp = this.maxHp;
    this.invulnerableTimer = 0;
    this.knockbackTimer = 0;

    // Moving Platform Interaction
    this.standingPlatform = null;

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
    this.walkAnimTimer = 0;
    this.blinkTimer = 2.0;
    this.isBlinking = false;

    // Lantern and Pink Flame animation state
    this.flameTimer = 0;
    this.lanternSway = 0;
    this.emberTimer = 0;
  }

  isInvulnerable() {
    return this.invulnerableTimer > 0;
  }

  takeDamage(amount, sourceX, sourceY, particleSystem, camera) {
    if (this.isInvulnerable()) {
      return false;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = CONFIG.player.invulnerabilityDuration;
    this.knockbackTimer = CONFIG.player.knockback.duration;

    // Apply directional knockback impulse away from hazard
    let dir = this.centerX >= sourceX ? 1 : -1;
    if (Math.abs(this.centerX - sourceX) < 2) {
      dir = -this.facing;
    }

    this.vx = dir * CONFIG.player.knockback.speedX;
    this.vy = -CONFIG.player.knockback.speedY;
    this.isGrounded = false;

    // Squash & stretch recoil reaction
    this.scaleX = 1.35;
    this.scaleY = 0.7;

    // Particle & camera screen shake feedback
    if (particleSystem) {
      particleSystem.emitDamage(this.centerX, this.centerY);
    }
    if (camera) {
      camera.shake(0.28, 10);
    }

    return true;
  }

  respawn(spawnPoint, particleSystem) {
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.vx = 0;
    this.vy = 0;
    this.standingPlatform = null;
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
    this.hp = this.maxHp;
    this.invulnerableTimer = 0.6; // Brief spawn grace period
    this.knockbackTimer = 0;
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
      if (!plat.isSolid) continue;
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
    // 1. Moving Platform Synchronization (Carry Player with Motion)
    // -------------------------------------------------------------------------
    if (this.standingPlatform) {
      if (!this.standingPlatform.isSolid) {
        // Platform beneath started falling/crumbling away
        this.standingPlatform = null;
        this.isGrounded = false;
      } else {
        // Carry player with moving platform displacement
        this.x += this.standingPlatform.deltaX;
        this.y += this.standingPlatform.deltaY;
      }
    }

    // -------------------------------------------------------------------------
    // 2. Timers & Input Buffering
    // -------------------------------------------------------------------------
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }
    if (this.knockbackTimer > 0) {
      this.knockbackTimer = Math.max(0, this.knockbackTimer - dt);
    }

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

    // -------------------------------------------------------------------------
    // 3. Horizontal Movement
    // -------------------------------------------------------------------------
    if (this.knockbackTimer > 0) {
      // Reeling from knockback: override user movement with air friction
      const friction = CONFIG.physics.airFriction * 1.5;
      if (Math.abs(this.vx) > 0) {
        const drop = friction * dt;
        if (Math.abs(this.vx) <= drop) {
          this.vx = 0;
        } else {
          this.vx -= Math.sign(this.vx) * drop;
        }
      }
      this.walkAnimTimer = 0;
    } else {
      let moveDir = 0;
      if (input.left) moveDir -= 1;
      if (input.right) moveDir += 1;

      if (moveDir !== 0) {
        this.facing = moveDir;
        const accel = this.isGrounded ? CONFIG.physics.acceleration : CONFIG.physics.airAcceleration;
        this.vx += moveDir * accel * dt;

        // Clamp horizontal velocity
        if (Math.abs(this.vx) > CONFIG.physics.moveSpeed) {
          this.vx = Math.sign(this.vx) * CONFIG.physics.moveSpeed;
        }

        this.walkAnimTimer += dt * 14;
      } else {
        // Apply friction
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
    }

    // -------------------------------------------------------------------------
    // 4. Jump Handling (Variable Jump Height + Coyote + Buffer + Wall Jump)
    // -------------------------------------------------------------------------
    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0) {
        // Standard Ground Jump
        this.vy = -CONFIG.physics.jumpForce;
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.isGrounded = false;
        this.standingPlatform = null;

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
          this.standingPlatform = null;

          // Visual juice
          this.scaleX = 0.8;
          this.scaleY = 1.3;

          const dustX = jumpWallDir === -1 ? this.x : this.x + this.width;
          particleSystem.emitDust(dustX, this.centerY, -jumpWallDir);
        }
      }
    }

    // Variable jump cut: if player lets go of jump while moving upwards, cut jump short
    if (!input.jump && this.vy < 0) {
      this.vy += CONFIG.physics.gravity * (1 - CONFIG.physics.jumpCutMultiplier) * dt * 2.5;
    }

    // -------------------------------------------------------------------------
    // 5. Gravity & Vertical Movement with Wall Friction
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

    // -------------------------------------------------------------------------
    // 6. Physics Collision Resolution (AABB)
    // -------------------------------------------------------------------------
    // Move X first & check collisions against solid platforms
    this.x += this.vx * dt;
    for (const plat of platforms) {
      if (!plat.isSolid) continue;
      if (this.checkCollision(this, plat)) {
        if (this.vx > 0) {
          this.x = plat.x - this.width;
        } else if (this.vx < 0) {
          this.x = plat.x + plat.width;
        }
        this.vx = 0;
      }
    }

    // Move Y next & check collisions against solid platforms
    this.wasGrounded = this.isGrounded;
    this.isGrounded = false;
    this.standingPlatform = null;
    this.y += this.vy * dt;

    for (const plat of platforms) {
      if (!plat.isSolid) continue;
      if (this.checkCollision(this, plat)) {
        // Landing from above check
        if (this.vy >= 0 && (this.y + this.height - this.vy * dt) <= plat.y + 14) {
          this.y = plat.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
          this.standingPlatform = plat;

          // Trigger crumble / interaction
          plat.onStepped(this, particleSystem);

          // Landing visual juice (squash on impact)
          if (!this.wasGrounded) {
            this.scaleX = 1.35;
            this.scaleY = 0.7;
            particleSystem.emitDust(this.centerX, this.y + this.height);
          }
        } else if (this.vy < 0) {
          // Hit head on bottom of platform
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
    // 7. Procedural Animation & Squash/Stretch Recovery
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

    // -------------------------------------------------------------------------
    // 7. Lantern & Flame Dynamics
    // -------------------------------------------------------------------------
    this.flameTimer += dt;

    // Smooth inertial sway for the hanging lantern based on movement & velocity
    const targetSway = -(this.vx / CONFIG.physics.moveSpeed) * 0.3 + (this.isGrounded && Math.abs(this.vx) > 20 ? Math.sin(this.walkAnimTimer) * 0.14 : 0);
    this.lanternSway += (targetSway - this.lanternSway) * 10 * dt;

    // Emit subtle floating pink embers from the lantern
    this.emberTimer += dt;
    if (this.emberTimer >= 0.1) {
      this.emberTimer = 0;
      if (particleSystem && CONFIG.lighting.enabled) {
        const lanternPos = this.getLanternWorldPos();
        particleSystem.emitLanternEmber(lanternPos.x, lanternPos.y - 8);
      }
    }
  }

  getLanternWorldPos() {
    // Exact world coordinates of the lantern flame center
    const handOffsetX = this.facing * (this.width / 2 + 3);
    const handOffsetY = -this.height * 0.45;
    const swayOffset = Math.sin(this.lanternSway) * 8;
    return {
      x: this.centerX + handOffsetX + swayOffset,
      y: this.y + this.height + handOffsetY + 8
    };
  }

  getLanternRadius() {
    const base = CONFIG.lighting.lantern.baseRadius || (this.height * CONFIG.lighting.lantern.radiusMultiplier);
    const flicker = Math.sin(this.flameTimer * CONFIG.lighting.lantern.flickerSpeed) * CONFIG.lighting.lantern.flickerAmount
                  + Math.cos(this.flameTimer * 14.3) * (CONFIG.lighting.lantern.flickerAmount * 0.4);
    return Math.max(10, base + flicker);
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
    ctx.save();

    // Invulnerability flashing / i-Frames strobe
    if (this.invulnerableTimer > 0) {
      const strobe = Math.sin(this.invulnerableTimer * 30);
      ctx.globalAlpha = strobe > 0 ? 0.25 : 0.92;
    }

    // Pivot transform at character's bottom-center for natural squash & stretch
    const bottomCenterX = this.centerX;
    const bottomCenterY = this.y + this.height;

    // Running wobble
    let walkOffset = 0;
    if (this.isGrounded && Math.abs(this.vx) > 20) {
      walkOffset = Math.sin(this.walkAnimTimer) * 2;
    }

    ctx.translate(bottomCenterX, bottomCenterY + walkOffset);
    ctx.scale(this.scaleX, this.scaleY);

    const w = this.width;
    const h = this.height;
    const cornerRadius = 8;

    // Subtle player drop shadow
    ctx.fillStyle = CONFIG.colors.playerGlow;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Gradient
    const bodyGradient = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
    bodyGradient.addColorStop(0, '#67e8f9');
    bodyGradient.addColorStop(1, CONFIG.colors.playerBody);

    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;

    // Rounded rectangle body
    this.drawRoundedRect(ctx, -w / 2, -h, w, h, cornerRadius);
    ctx.fill();
    ctx.stroke();

    // 1. Sleek Glassy Capsule Specular (Overall Body Gloss)
    ctx.save();
    ctx.beginPath();
    this.drawRoundedRect(ctx, -w / 2 + 2, -h + 2, w - 4, h * 0.45, cornerRadius - 2);
    const bodyGloss = ctx.createLinearGradient(0, -h + 2, 0, -h * 0.55);
    bodyGloss.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    bodyGloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = bodyGloss;
    ctx.fill();

    // 2. Sleek Dynamic Pink Rim Reflection from Lantern Flame
    const rimX = this.facing > 0 ? (w / 2 - 2.5) : (-w / 2 + 2.5);
    const rimGrad = ctx.createLinearGradient(0, -h * 0.85, 0, -h * 0.15);
    rimGrad.addColorStop(0, 'rgba(244, 114, 182, 0)');
    rimGrad.addColorStop(0.4, 'rgba(255, 190, 230, 0.85)'); // Sleek glint facing lantern
    rimGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.65)');
    rimGrad.addColorStop(1, 'rgba(219, 39, 119, 0)');

    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rimX, -h * 0.80);
    ctx.lineTo(rimX, -h * 0.20);
    ctx.stroke();

    // Subtle bottom edge bounce light
    const bounceGrad = ctx.createLinearGradient(0, 0, 0, -6);
    bounceGrad.addColorStop(0, 'rgba(244, 63, 94, 0.25)');
    bounceGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = bounceGrad;
    ctx.beginPath();
    this.drawRoundedRect(ctx, -w / 2 + 2, -6, w - 4, 4, 2);
    ctx.fill();
    ctx.restore();

    // Procedural Animated Eyes
    if (!this.isBlinking) {
      const eyeLookOffset = this.facing * 3.5;
      const eyeY = -h * 0.65;
      const eyeSpacing = 6;

      ctx.fillStyle = CONFIG.colors.playerEye;

      // Left Eye
      ctx.beginPath();
      ctx.arc(eyeLookOffset - eyeSpacing / 2, eyeY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Right Eye
      ctx.beginPath();
      ctx.arc(eyeLookOffset + eyeSpacing / 2 + 2, eyeY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eye shine / highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeLookOffset - eyeSpacing / 2 + 1, eyeY - 1, 1, 0, Math.PI * 2);
      ctx.arc(eyeLookOffset + eyeSpacing / 2 + 3, eyeY - 1, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Blinking eye slit
      ctx.strokeStyle = CONFIG.colors.playerEye;
      ctx.lineWidth = 2;
      const eyeY = -h * 0.65;
      ctx.beginPath();
      ctx.moveTo(-5 + this.facing * 2, eyeY);
      ctx.lineTo(7 + this.facing * 2, eyeY);
      ctx.stroke();
    }

    // Procedural Animated Hat
    this.drawHat(ctx, w, h);

    // Pink Flame Lantern
    this.drawLantern(ctx, w, h);

    ctx.restore();
  }

  drawHat(ctx, w, h) {
    ctx.save();

    // Top of head is at y = -h
    const headTopY = -h;

    // Dynamic hat tilt based on movement velocity and facing direction
    const hatTilt = (this.vx / CONFIG.physics.moveSpeed) * 0.14 + (this.facing * 0.05);

    ctx.translate(0, headTopY + 2);
    ctx.rotate(hatTilt);

    // 1. Hat Brim
    ctx.fillStyle = CONFIG.colors.playerHatBrim;
    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, (w / 2) + 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sleek specular reflection on top curve of hat brim
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, -1, (w / 2) + 4, 2.8, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();

    // Sleek pink rim reflection on brim forward edge facing lantern
    const brimRimGrad = ctx.createLinearGradient(0, 0, this.facing * ((w / 2) + 6), 0);
    brimRimGrad.addColorStop(0, 'rgba(244, 114, 182, 0)');
    brimRimGrad.addColorStop(0.6, 'rgba(255, 190, 230, 0.85)');
    brimRimGrad.addColorStop(1, 'rgba(244, 114, 182, 0.5)');
    ctx.strokeStyle = brimRimGrad;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(this.facing * 2, 0, (w / 2) + 4, 3.8, 0, this.facing > 0 ? -0.6 : Math.PI - 0.8, this.facing > 0 ? 0.8 : Math.PI + 0.6);
    ctx.stroke();
    ctx.restore();

    // 2. Hat Crown (Stylized Cap / Cone)
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

    // Sleek pink curved specular streak on crown cone facing the lantern
    ctx.save();
    const coneSpecGrad = ctx.createLinearGradient(0, -crownHeight, this.facing * (crownWidth / 2), 0);
    coneSpecGrad.addColorStop(0, 'rgba(255, 210, 240, 0.75)');
    coneSpecGrad.addColorStop(0.5, 'rgba(244, 114, 182, 0.45)');
    coneSpecGrad.addColorStop(1, 'rgba(244, 114, 182, 0)');
    ctx.strokeStyle = coneSpecGrad;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-1 + this.facing * 3, -crownHeight + 1);
    ctx.quadraticCurveTo(
      this.facing * (crownWidth * 0.25),
      -crownHeight * 0.5,
      this.facing * (crownWidth * 0.38),
      -1
    );
    ctx.stroke();
    ctx.restore();

    // 3. Hat Band (Golden Accent Ribbon)
    ctx.fillStyle = CONFIG.colors.playerHatBand;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.drawRoundedRect(ctx, -crownWidth / 2 + 1, -4.5, crownWidth - 2, 4, 1.5);
    ctx.fill();
    ctx.stroke();

    // Sleek metallic glint on gold band
    ctx.save();
    const bandSpecGrad = ctx.createLinearGradient(-crownWidth / 2, -2.5, crownWidth / 2, -2.5);
    bandSpecGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    bandSpecGrad.addColorStop(0.35 + this.facing * 0.15, 'rgba(255, 255, 255, 0.85)');
    bandSpecGrad.addColorStop(0.50 + this.facing * 0.15, 'rgba(254, 240, 138, 0.9)');
    bandSpecGrad.addColorStop(0.65 + this.facing * 0.15, 'rgba(255, 180, 220, 0.6)');
    bandSpecGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = bandSpecGrad;
    this.drawRoundedRect(ctx, -crownWidth / 2 + 2, -4, crownWidth - 4, 3, 1);
    ctx.fill();
    ctx.restore();

    // 4. Pom-pom / Golden Star on Top of Hat
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-2 + this.facing * 3, -crownHeight, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Sleek glint on star
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-2 + this.facing * 3 - 1, -crownHeight - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawLantern(ctx, w, h) {
    ctx.save();

    // Hand/arm attachment point on the forward side of the player
    const handX = this.facing * (w / 2 + 1);
    const handY = -h * 0.45;

    // Small player arm holding the lantern
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(handX - this.facing * 1.5, handY + 1, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pivot at the hand attachment
    ctx.translate(handX, handY);
    ctx.rotate(this.lanternSway);

    // Metal hook / chain hanging down
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 6);
    ctx.stroke();

    // Shift to lantern housing
    ctx.translate(0, 6);

    const lanternW = 13;
    const lanternH = 17;

    // 1. Top ring (brass)
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -lanternH / 2 - 2, 2.5, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Top cap / roof (dark iron with brass trim)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-lanternW / 2 - 2, -lanternH / 2 + 2);
    ctx.lineTo(-lanternW / 4, -lanternH / 2 - 1.5);
    ctx.lineTo(lanternW / 4, -lanternH / 2 - 1.5);
    ctx.lineTo(lanternW / 2 + 2, -lanternH / 2 + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Glass Chamber (dark transparent background so the pink flame is clearly visible)
    const glassX = -lanternW / 2;
    const glassY = -lanternH / 2 + 2;
    const glassW = lanternW;
    const glassH = lanternH - 4;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.fillRect(glassX, glassY, glassW, glassH);

    // Subtle dark-pink inner glass hue
    const glassGlow = ctx.createRadialGradient(0, glassY + glassH * 0.6, 1, 0, glassY + glassH * 0.6, lanternW);
    glassGlow.addColorStop(0, 'rgba(244, 63, 94, 0.30)');
    glassGlow.addColorStop(0.7, 'rgba(219, 39, 119, 0.10)');
    glassGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = glassGlow;
    ctx.fillRect(glassX, glassY, glassW, glassH);

    // 4. Animated Dancing Pink Flame (Rich saturated pink throughout - NO pure white)
    const time = this.flameTimer;
    const flicker1 = Math.sin(time * 16.0) * 1.2 + Math.cos(time * 23.0) * 0.6;
    const flameWobble = Math.sin(time * 14.0) * 1.4;
    const flameBaseY = glassY + glassH - 2;
    const flameHeight = 9.0 + flicker1;

    // Small wick base
    ctx.fillStyle = '#831843';
    ctx.beginPath();
    ctx.arc(0, flameBaseY + 0.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Outer Pink Flame (Deep magenta-rose)
    ctx.fillStyle = CONFIG.lighting.lantern.flameBodyColor;
    ctx.beginPath();
    ctx.moveTo(-3.5, flameBaseY);
    ctx.quadraticCurveTo(-4.5 + flameWobble * 0.4, flameBaseY - flameHeight * 0.45, flameWobble, flameBaseY - flameHeight);
    ctx.quadraticCurveTo(4.5 + flameWobble * 0.4, flameBaseY - flameHeight * 0.45, 3.5, flameBaseY);
    ctx.closePath();
    ctx.fill();

    // Secondary side flame tongue for authentic flickering fire movement
    const tongueWobble = Math.sin(time * 20.0) * 1.1;
    ctx.fillStyle = CONFIG.lighting.lantern.flameMidColor;
    ctx.beginPath();
    ctx.moveTo(-2.5, flameBaseY);
    ctx.quadraticCurveTo(-3.2 + tongueWobble, flameBaseY - flameHeight * 0.35, -1.0 + tongueWobble, flameBaseY - flameHeight * 0.7);
    ctx.quadraticCurveTo(-0.5, flameBaseY - flameHeight * 0.35, 1.5, flameBaseY);
    ctx.closePath();
    ctx.fill();

    // Mid Flame (Vivid hot pink body)
    ctx.fillStyle = CONFIG.lighting.lantern.flameMidColor;
    ctx.beginPath();
    ctx.moveTo(-2.2, flameBaseY);
    ctx.quadraticCurveTo(-2.8 + flameWobble * 0.3, flameBaseY - flameHeight * 0.4, flameWobble * 0.6, flameBaseY - flameHeight * 0.82);
    ctx.quadraticCurveTo(2.8 + flameWobble * 0.3, flameBaseY - flameHeight * 0.4, 2.2, flameBaseY);
    ctx.closePath();
    ctx.fill();

    // Inner Flame Heart (Bright vibrant saturated pink - NOT white!)
    ctx.fillStyle = CONFIG.lighting.lantern.flameCoreColor;
    ctx.beginPath();
    ctx.moveTo(-1.2, flameBaseY);
    ctx.quadraticCurveTo(-1.6 + flameWobble * 0.2, flameBaseY - flameHeight * 0.28, flameWobble * 0.3, flameBaseY - flameHeight * 0.55);
    ctx.quadraticCurveTo(1.6 + flameWobble * 0.2, flameBaseY - flameHeight * 0.28, 1.2, flameBaseY);
    ctx.closePath();
    ctx.fill();

    // 5. Metal Cage Struts
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-lanternW / 2, glassY);
    ctx.lineTo(-lanternW / 2, glassY + glassH);
    ctx.moveTo(lanternW / 2, glassY);
    ctx.lineTo(lanternW / 2, glassY + glassH);
    ctx.moveTo(-lanternW / 5, glassY);
    ctx.lineTo(-lanternW / 5, glassY + glassH);
    ctx.moveTo(lanternW / 5, glassY);
    ctx.lineTo(lanternW / 5, glassY + glassH);
    ctx.stroke();

    // 6. Metal Base
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.drawRoundedRect(ctx, -lanternW / 2 - 1.5, glassY + glassH, lanternW + 3, 3, 1);
    ctx.fill();
    ctx.stroke();

    // Subtle clean glass reflection line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-lanternW / 2 + 1.5, glassY + 2);
    ctx.lineTo(-lanternW / 2 + 1.5, glassY + glassH - 2);
    ctx.stroke();

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
// 6. CAMERA SYSTEM
// =============================================================================
class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  shake(duration = 0.25, intensity = 8) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  snapTo(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  update(dt, player) {
    // Target position includes lookahead based on player movement
    this.targetX = player.centerX + player.facing * CONFIG.camera.lookAheadDist;
    this.targetY = player.centerY + CONFIG.camera.verticalOffset;

    // Smooth Lerp tracking
    const t = 1 - Math.exp(-CONFIG.camera.lerpSpeed * dt);
    this.x += (this.targetX - this.x) * t;
    this.y += (this.targetY - this.y) * t;

    // Screen Shake decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const factor = Math.max(0, this.shakeDuration / 0.25);
      const currentIntensity = this.shakeIntensity * factor;
      this.shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  apply(ctx) {
    ctx.save();
    ctx.translate(
      Math.round(this.viewportWidth / 2 - this.x + this.shakeOffsetX),
      Math.round(this.viewportHeight / 2 - this.y + this.shakeOffsetY)
    );
  }

  restore(ctx) {
    ctx.restore();
  }
}

// =============================================================================
// 6. HAZARD SYSTEM & SPIKES
// =============================================================================
class SpikeHazard {
  constructor(x, y, width, height = 18, direction = 'up', label = '') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.direction = direction; // 'up', 'down', 'left', 'right'
    this.label = label;
    this.pulseTimer = Math.random() * Math.PI * 2;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  update(dt) {
    this.pulseTimer += dt * 3.5;
  }

  // Contracted hitbox to make hazard encounters fair and responsive
  getHitbox() {
    const insetX = 3;
    const insetY = 3;
    return {
      x: this.x + insetX,
      y: this.y + insetY,
      width: Math.max(1, this.width - insetX * 2),
      height: Math.max(1, this.height - insetY * 2),
    };
  }

  draw(ctx) {
    ctx.save();

    const toothWidth = CONFIG.hazards.spikeToothWidth || 16;
    const isHorizontal = this.direction === 'up' || this.direction === 'down';
    const totalLength = isHorizontal ? this.width : this.height;
    const numTeeth = Math.max(1, Math.round(totalLength / toothWidth));
    const actualToothWidth = totalLength / numTeeth;

    // Glowing hazard danger field
    const pulseGlow = (Math.sin(this.pulseTimer) + 1) * 0.5;
    ctx.fillStyle = CONFIG.colors.spikeGlow;
    ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

    // Hazard base plate
    const baseThickness = 4;
    ctx.fillStyle = CONFIG.colors.spikeBase;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    if (this.direction === 'up') {
      ctx.fillRect(this.x, this.y + this.height - baseThickness, this.width, baseThickness);
      ctx.strokeRect(this.x, this.y + this.height - baseThickness, this.width, baseThickness);
    } else if (this.direction === 'down') {
      ctx.fillRect(this.x, this.y, this.width, baseThickness);
      ctx.strokeRect(this.x, this.y, this.width, baseThickness);
    } else if (this.direction === 'left') {
      ctx.fillRect(this.x + this.width - baseThickness, this.y, baseThickness, this.height);
      ctx.strokeRect(this.x + this.width - baseThickness, this.y, baseThickness, this.height);
    } else if (this.direction === 'right') {
      ctx.fillRect(this.x, this.y, baseThickness, this.height);
      ctx.strokeRect(this.x, this.y, baseThickness, this.height);
    }

    // Draw individual sharp triangular teeth with gradients & shine highlights
    for (let i = 0; i < numTeeth; i++) {
      ctx.beginPath();

      if (this.direction === 'up') {
        const x1 = this.x + i * actualToothWidth;
        const x2 = x1 + actualToothWidth;
        const tipX = x1 + actualToothWidth / 2;
        const tipY = this.y;
        const baseY = this.y + this.height - baseThickness;

        ctx.moveTo(x1, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(x2, baseY);
        ctx.closePath();

        const grad = ctx.createLinearGradient(tipX, tipY, tipX, baseY);
        grad.addColorStop(0, '#f87171');
        grad.addColorStop(0.35, CONFIG.colors.spikeBody);
        grad.addColorStop(1, '#991b1b');
        ctx.fillStyle = grad;
        ctx.fill();

        // Tip highlight edge
        ctx.strokeStyle = CONFIG.colors.spikeHighlight;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x1 + 1, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(x2 - 1, baseY);
        ctx.stroke();

        // Glowing apex tip indicator
        ctx.fillStyle = `rgba(254, 202, 202, ${0.4 + pulseGlow * 0.5})`;
        ctx.beginPath();
        ctx.arc(tipX, tipY + 2, 2, 0, Math.PI * 2);
        ctx.fill();

      } else if (this.direction === 'down') {
        const x1 = this.x + i * actualToothWidth;
        const x2 = x1 + actualToothWidth;
        const tipX = x1 + actualToothWidth / 2;
        const tipY = this.y + this.height;
        const baseY = this.y + baseThickness;

        ctx.moveTo(x1, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(x2, baseY);
        ctx.closePath();

        const grad = ctx.createLinearGradient(tipX, tipY, tipX, baseY);
        grad.addColorStop(0, '#f87171');
        grad.addColorStop(0.35, CONFIG.colors.spikeBody);
        grad.addColorStop(1, '#991b1b');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = CONFIG.colors.spikeHighlight;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x1 + 1, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(x2 - 1, baseY);
        ctx.stroke();

        ctx.fillStyle = `rgba(254, 202, 202, ${0.4 + pulseGlow * 0.5})`;
        ctx.beginPath();
        ctx.arc(tipX, tipY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.direction === 'left') {
        const y1 = this.y + i * actualToothWidth;
        const y2 = y1 + actualToothWidth;
        const tipY = y1 + actualToothWidth / 2;
        const tipX = this.x;
        const baseX = this.x + this.width - baseThickness;

        ctx.moveTo(baseX, y1);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(baseX, y2);
        ctx.closePath();

        const grad = ctx.createLinearGradient(tipX, tipY, baseX, tipY);
        grad.addColorStop(0, '#f87171');
        grad.addColorStop(0.35, CONFIG.colors.spikeBody);
        grad.addColorStop(1, '#991b1b');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = CONFIG.colors.spikeHighlight;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(baseX, y1);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
      } else if (this.direction === 'right') {
        const y1 = this.y + i * actualToothWidth;
        const y2 = y1 + actualToothWidth;
        const tipY = y1 + actualToothWidth / 2;
        const tipX = this.x + this.width;
        const baseX = this.x + baseThickness;

        ctx.moveTo(baseX, y1);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(baseX, y2);
        ctx.closePath();

        const grad = ctx.createLinearGradient(tipX, tipY, baseX, tipY);
        grad.addColorStop(0, '#f87171');
        grad.addColorStop(0.35, CONFIG.colors.spikeBody);
        grad.addColorStop(1, '#991b1b');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = CONFIG.colors.spikeHighlight;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(baseX, y1);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// 7. CHECKPOINT SYSTEM
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

    // Trigger hitbox dimensions
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
// 8. WORLD & SCENE PLATFORMS (MULTI-BLOCK OSCILLATION & CHECKPOINTS)
// =============================================================================
class World {
  constructor() {
    this.platforms = [
      // -----------------------------------------------------------------------
      // Zone 0: Wall-jump training & challenge zone (left of spawn)
      // -----------------------------------------------------------------------
      new Platform({ x: -140, y: 340, width: 180, height: 40, label: 'Wall Zone' }),
      new Platform({ x: -200, y: 60, width: 44, height: 320, label: 'Wall Climb' }),
      new Platform({ x: -260, y: 60, width: 104, height: 24 }),
      new Platform({ x: -440, y: 40, width: 36, height: 360 }),
      new Platform({ x: -320, y: 40, width: 36, height: 360, label: 'Wall Shaft' }),
      new Platform({ x: -440, y: 400, width: 156, height: 30 }),
      new Platform({ x: -500, y: 20, width: 160, height: 24, label: 'Wall Summit' }),
      new Platform({ x: -280, y: 220, width: 70, height: 22 }),

      // -----------------------------------------------------------------------
      // Zone 1: Spawn & Introduction to Multi-Block Moving Platforms
      // -----------------------------------------------------------------------
      new Platform({ x: 40, y: 340, width: 340, height: 40, label: 'Spawn Ground' }),
      // Moves horizontally across several blocks (oscX: 130px)
      new Platform({ x: 530, y: 320, width: 130, height: 26, type: 'moving', oscX: 130, speedX: 1.5, label: 'Moving ↔' }),
      new Platform({ x: 790, y: 300, width: 150, height: 28, label: 'Mid Island' }),

      // -----------------------------------------------------------------------
      // Zone 2: Oscillating & Crumbling Stepping Stones Across Pit
      // -----------------------------------------------------------------------
      // Crumbling platforms that also move horizontally a few blocks!
      new Platform({ x: 1010, y: 280, width: 95, height: 24, type: 'crumbling', oscX: 65, speedX: 1.8, crumbleDuration: 0.8, label: 'Crumble ↔' }),
      new Platform({ x: 1190, y: 240, width: 95, height: 24, type: 'crumbling', oscX: 70, speedX: 2.1, crumbleDuration: 0.8, label: 'Crumble ↔' }),
      new Platform({ x: 1370, y: 200, width: 95, height: 24, type: 'crumbling', oscX: 60, speedX: 1.9, crumbleDuration: 0.8, label: 'Crumble ↔' }),
      new Platform({ x: 1540, y: 180, width: 160, height: 30, label: 'High Haven' }),

      // -----------------------------------------------------------------------
      // Zone 3: Vertical & Horizontal Swaying Elevator (Multi-Block Travel)
      // -----------------------------------------------------------------------
      // Moves 140px vertically AND 80px horizontally (2D motion!)
      new Platform({ x: 1790, y: 130, width: 120, height: 24, type: 'moving', oscX: 80, oscY: 135, speedX: 1.3, speedY: 1.3, label: 'Elevator ⤢' }),
      new Platform({ x: 1980, y: -20, width: 240, height: 34, label: 'Sky Summit' }),

      // -----------------------------------------------------------------------
      // Zone 4: The Gauntlet: Multi-Block Oscillating & Crumbling (Hybrid) Platforms!
      // -----------------------------------------------------------------------
      // Hybrid platforms oscillating 120-150px horizontally across several blocks
      new Platform({ x: 1680, y: -40, width: 110, height: 22, type: 'moving_crumbling', oscX: 125, speedX: 2.0, label: 'Osc & Fall ⚡' }),
      new Platform({ x: 1360, y: -60, width: 110, height: 22, type: 'moving_crumbling', oscX: 130, oscY: 50, speedX: 1.8, speedY: 1.4, label: 'Osc & Fall ⚡' }),
      new Platform({ x: 1040, y: -80, width: 110, height: 22, type: 'moving_crumbling', oscX: 140, speedX: 2.2, label: 'Osc & Fall ⚡' }),

      // -----------------------------------------------------------------------
      // Zone 5: Grand Peak / Trophy Vantage
      // -----------------------------------------------------------------------
      new Platform({ x: 670, y: -100, width: 250, height: 34, label: 'Grand Peak 🏆' }),

      // -----------------------------------------------------------------------
      // Zone 6: Descending Upper Route Back to Spawn
      // -----------------------------------------------------------------------
      new Platform({ x: 470, y: -10, width: 100, height: 24, type: 'crumbling', oscX: 55, speedX: 1.6, label: 'Crumble ↔' }),
      new Platform({ x: 290, y: 70, width: 110, height: 24, type: 'moving', oscX: 110, speedX: 1.6, label: 'Moving ↔' }),
      new Platform({ x: 120, y: 170, width: 130, height: 26, label: 'High Overlook' }),

      // -----------------------------------------------------------------------
      // Zone 7: Lower Fast Runway Route
      // -----------------------------------------------------------------------
      new Platform({ x: 1430, y: 380, width: 180, height: 34, label: 'Lower Path' }),
      new Platform({ x: 1720, y: 360, width: 120, height: 24, type: 'moving_crumbling', oscX: 140, speedX: 2.4, label: 'Danger ⚡' }),
      new Platform({ x: 2020, y: 320, width: 280, height: 38, label: 'Far Runway' }),
    ];

    // Prominent Checkpoints placed on key platforms across the map
    this.checkpoints = [
      new Checkpoint(160, 340, 'Base Camp', true),
      new Checkpoint(1620, 180, 'High Haven', false),
      new Checkpoint(2100, -20, 'Sky Summit', false),
      new Checkpoint(795, -100, 'Grand Peak', false),
      new Checkpoint(2160, 320, 'Far Runway', false),
      new Checkpoint(-420, 20, 'Wall Summit', false),
    ];

    this.hazards = [
      // Spike hazard on edge of Start Ground (top)
      new SpikeHazard(280, 322, 100, 18, 'up', 'Spike Pit'),

      // Spike hazard on stepping stone 2 (top)
      new SpikeHazard(740, 202, 60, 18, 'up'),

      // Spike hazard on Peak platform (top)
      new SpikeHazard(1240, 62, 90, 18, 'up'),

      // Floor spikes in lower gap challenge (top)
      new SpikeHazard(1480, 362, 90, 18, 'up'),

      // Floor spikes guarding the return runway (top)
      new SpikeHazard(2040, 222, 80, 18, 'up'),
    ];
  }

  update(dt, player, particleSystem, input, onCheckpointActivated) {
    // 1. Update platforms
    for (const plat of this.platforms) {
      plat.update(dt, particleSystem);
    }

    // 2. Update checkpoints
    for (const cp of this.checkpoints) {
      const activated = cp.update(dt, player, particleSystem, input);
      if (activated) {
        // Deactivate other checkpoints so only the latest is active
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

    // 3. Update hazards
    for (const hazard of this.hazards) {
      hazard.update(dt);
    }
  }

  draw(ctx, player) {
    // 1. Draw track guides first so platforms render on top
    for (const plat of this.platforms) {
      if (plat.isOscillating() && plat.state !== 'falling' && plat.state !== 'respawning') {
        plat.drawTrack(ctx);
      }
    }

    // 2. Draw platforms
    for (const plat of this.platforms) {
      plat.draw(ctx);
    }

    // 3. Draw Checkpoint Flags
    for (const cp of this.checkpoints) {
      cp.draw(ctx, player);
    }

    // 4. Draw hazards on top of platforms
    for (const hazard of this.hazards) {
      hazard.draw(ctx);
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
// 6.5 GOAL ZONE / FINISH LINE
// =============================================================================
class GoalZone {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.animTimer = 0;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  update(dt, particleSystem) {
    this.animTimer += dt;
    // Ambient sparkles floating around the finish line
    if (Math.random() < 0.35) {
      particleSystem.emitSparkle(
        this.x + Math.random() * this.width,
        this.y + Math.random() * this.height
      );
    }
  }

  draw(ctx) {
    ctx.save();

    const postWidth = 7;
    const postHeight = this.height;
    const topY = this.y;
    const bottomY = this.y + this.height;
    const leftX = this.x;
    const rightX = this.x + this.width - postWidth;

    // 1. Radiant Goal Area Light / Field
    const glowGradient = ctx.createLinearGradient(leftX, topY, leftX, bottomY);
    glowGradient.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
    glowGradient.addColorStop(0.6, 'rgba(74, 222, 128, 0.12)');
    glowGradient.addColorStop(1, 'rgba(56, 189, 248, 0.02)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(leftX, topY, this.width, this.height);

    // 2. Goal Posts (Checkered / striped)
    const drawPost = (px) => {
      // Base post shadow / border
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 1, topY - 1, postWidth + 2, postHeight + 2);

      // Striped segments
      const stripes = 6;
      const stripeHeight = postHeight / stripes;
      for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#ef4444';
        ctx.fillRect(px, topY + i * stripeHeight, postWidth, stripeHeight);
      }

      // Golden orb on post top
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px + postWidth / 2, topY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    drawPost(leftX);
    drawPost(rightX);

    // 3. Finish Line Banner Arch
    const bannerHeight = 22;
    const bannerY = topY + 2;

    // Banner Background Box
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.drawRoundedRect(ctx, leftX - 6, bannerY, this.width + 12, bannerHeight, 4);
    ctx.fill();
    ctx.stroke();

    // Checkered accent strips on banner
    const checkSize = 4;
    for (let cx = leftX - 4; cx < leftX + this.width + 6; cx += checkSize * 2) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx, bannerY + 1, checkSize, 3);
      ctx.fillRect(cx + checkSize, bannerY + bannerHeight - 4, checkSize, 3);
    }

    // Banner Text: "★ PEAK ★"
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★ PEAK ★', this.centerX, bannerY + bannerHeight / 2);

    // 4. Floating / Bobbing Golden Trophy above the banner
    const bob = Math.sin(this.animTimer * 4) * 3;
    const trophyY = topY - 14 + bob;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', this.centerX, trophyY);

    // 5. Floor Checkered finish strip on platform
    const stripHeight = 4;
    const cols = Math.floor(this.width / 8);
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = c % 2 === 0 ? '#ffffff' : '#0f172a';
      ctx.fillRect(leftX + c * 8, bottomY - stripHeight, 8, stripHeight);
    }

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
// 9. GAME ENGINE & LOOP
// =============================================================================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.statsDisplay = document.getElementById('statsDisplay');
    this.heartsContainer = document.getElementById('heartsContainer');
    this.healthBarFill = document.getElementById('healthBarFill');

    // Speedrun HUD & Victory DOM elements
    this.timerDisplay = document.getElementById('timerDisplay');
    this.bestTimeDisplay = document.getElementById('bestTimeDisplay');
    this.victoryOverlay = document.getElementById('victoryOverlay');
    this.victoryTime = document.getElementById('victoryTime');
    this.victoryBest = document.getElementById('victoryBest');
    this.recordAlert = document.getElementById('recordAlert');

    this.input = new InputManager();
    this.particleSystem = new ParticleSystem();
    this.world = new World();
    this.goalZone = new GoalZone(1270, 80 - 64, 80, 64);
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

    // Offscreen lighting buffer for darkness & lantern glow rendering
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = CONFIG.canvas.width;
    this.lightCanvas.height = CONFIG.canvas.height;
    this.lightCtx = this.lightCanvas.getContext('2d');

    this.respawnCount = 0;
    this.debugMode = false;
    this.lastRenderedHp = -1;

    // Speedrun Stopwatch state
    this.runTime = 0;
    this.timerState = 'READY'; // 'READY' | 'RUNNING' | 'FINISHED'
    this.bestTime = this.loadBestTime();

    this.updateHUD();

    this.lastTime = performance.now();
    this.fps = 60;
    this.fpsTimer = 0;
    this.frameCount = 0;

    this.updateHUD();
    this.updateHealthUI(true);

    // Start Game Loop
    requestAnimationFrame((time) => this.loop(time));
  }

  loadBestTime() {
    try {
      const saved = localStorage.getItem('speedrun_best_time');
      if (saved !== null && !isNaN(parseFloat(saved))) {
        return parseFloat(saved);
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    return null;
  }

  saveBestTime(time) {
    try {
      localStorage.setItem('speedrun_best_time', time.toString());
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  formatTime(seconds) {
    if (seconds === null || seconds === undefined) return '--:--.--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    const cc = String(ms).padStart(2, '0');
    return `${mm}:${ss}.${cc}`;
  }

  updateHUD() {
    if (this.timerDisplay) {
      this.timerDisplay.textContent = this.formatTime(this.runTime);
    }
    if (this.bestTimeDisplay) {
      this.bestTimeDisplay.textContent = this.bestTime !== null 
        ? `🏆 PB: ${this.formatTime(this.bestTime)}` 
        : `🏆 PB: --:--.--`;
    }
  }

  completeRun() {
    if (this.timerState === 'FINISHED') return;
    this.timerState = 'FINISHED';

    const currentRun = this.runTime;
    let isNewRecord = false;

    if (this.bestTime === null || currentRun < this.bestTime) {
      this.bestTime = currentRun;
      this.saveBestTime(this.bestTime);
      isNewRecord = true;
    }

    // Confetti celebration
    this.particleSystem.emitConfetti(this.goalZone.centerX, this.goalZone.centerY, 60);
    this.particleSystem.emitConfetti(this.player.centerX, this.player.centerY, 40);

    // Update HUD and Victory UI
    this.updateHUD();

    if (this.victoryTime) {
      this.victoryTime.textContent = this.formatTime(currentRun);
    }
    if (this.victoryBest) {
      this.victoryBest.textContent = this.formatTime(this.bestTime);
    }
    if (this.recordAlert) {
      if (isNewRecord) {
        this.recordAlert.classList.remove('hidden');
      } else {
        this.recordAlert.classList.add('hidden');
      }
    }
    if (this.victoryOverlay) {
      this.victoryOverlay.classList.remove('hidden');
    }
  }

  resetRun() {
    this.runTime = 0;
    this.timerState = 'READY';
    if (this.victoryOverlay) {
      this.victoryOverlay.classList.add('hidden');
    }
    this.updateHUD();
  }

  updateHealthUI(force = false) {
    if (!this.heartsContainer) return;

    const hp = this.player.hp;
    const maxHp = this.player.maxHp;

    if (force || this.lastRenderedHp !== hp) {
      let html = '';
      const heartSvg = `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

      for (let i = 0; i < maxHp; i++) {
        const isFull = i < hp;
        const wasFull = i < this.lastRenderedHp;
        const justDamaged = !isFull && wasFull && !force;

        let classes = 'heart-icon';
        if (!isFull) classes += ' empty';
        if (justDamaged) classes += ' damaged';

        html += `<span class="${classes}">${heartSvg}</span>`;
      }
      this.heartsContainer.innerHTML = html;

      if (this.healthBarFill) {
        const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
        this.healthBarFill.style.width = `${pct}%`;
        if (hp <= 1) {
          this.healthBarFill.classList.add('low');
        } else {
          this.healthBarFill.classList.remove('low');
        }
      }

      this.lastRenderedHp = hp;
    }
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
    if (this.timerDisplay) {
      this.timerDisplay.textContent = this.formatTime(this.runTime);
    }
    if (this.bestTimeDisplay) {
      this.bestTimeDisplay.textContent = this.bestTime !== null
        ? `🏆 PB: ${this.formatTime(this.bestTime)}`
        : '🏆 PB: --:--.--';
    }
  }

  update(dt) {
    // Toggle Debug overlay
    if (this.input.debugJustPressed) {
      this.debugMode = !this.debugMode;
    }

    // Manual Respawn / Run Reset trigger
    if (this.input.restartJustPressed) {
      this.triggerRespawn();
    }

<<<<<<< HEAD
    // Timer start trigger on player movement
    if (this.timerState === 'READY') {
      if (
        this.input.left ||
        this.input.right ||
        this.input.jump ||
        Math.abs(this.player.vx) > 5 ||
        Math.abs(this.player.vy) > 5
      ) {
        this.timerState = 'RUNNING';
      }
    }

    // Live timer ticking
    if (this.timerState === 'RUNNING') {
      this.runTime += dt;
      if (this.timerDisplay) {
        this.timerDisplay.textContent = this.formatTime(this.runTime);
      }

      // Check finish line collision
      if (this.checkGoalCollision(this.player, this.goalZone)) {
        this.completeRun();
=======
    // Update World (Platforms + Checkpoints)
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
>>>>>>> origin/master
      }
    }

    // Update Player & Physics
    this.player.update(dt, this.input, this.world.platforms, this.particleSystem);

    // Hazard Collision Detection
    for (const hazard of this.world.hazards) {
      if (this.player.checkCollision(this.player, hazard.getHitbox())) {
        const tookDamage = this.player.takeDamage(
          1,
          hazard.centerX,
          hazard.centerY,
          this.particleSystem,
          this.camera
        );

        if (tookDamage) {
          this.updateHealthUI();
          if (this.player.hp <= 0) {
            this.triggerRespawn();
          }
        }
      }
    }

    // Fall-off-the-map detection & respawn
    if (this.player.y > CONFIG.world.deathY) {
      this.triggerRespawn();
    }

    // Update Goal Zone & Camera & Particles
    this.goalZone.update(dt, this.particleSystem);
    this.camera.update(dt, this.player);
    this.particleSystem.update(dt);

    // Reset single-frame inputs
    this.input.resetFrame();
  }

  checkGoalCollision(player, goal) {
    return (
      player.x < goal.x + goal.width &&
      player.x + player.width > goal.x &&
      player.y < goal.y + goal.height &&
      player.y + player.height > goal.y
    );
  }

  triggerRespawn() {
    this.respawnCount++;
<<<<<<< HEAD
    this.resetRun();
    this.player.respawn(CONFIG.world.spawnPoint, this.particleSystem);
=======
    const spawnPos = this.currentSpawnPoint || CONFIG.world.spawnPoint;
    this.player.respawn(spawnPos, this.particleSystem);
    this.updateHUD();
    this.updateHealthUI(true);
>>>>>>> origin/master
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // -------------------------------------------------------------------------
    // 1. Clear Screen & Draw Parallax Sky Background
    // -------------------------------------------------------------------------
    const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
    skyGradient.addColorStop(0, CONFIG.colors.skyTop);
    skyGradient.addColorStop(1, CONFIG.colors.skyBottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, w, h);

    // Parallax Distant Grid / Stars
    this.drawParallaxStars(ctx);

    // -------------------------------------------------------------------------
    // 2. World Space Rendering (Transformed by Camera)
    // -------------------------------------------------------------------------
    this.camera.apply(ctx);

    // Draw Platforms, Tracks & Checkpoints
    this.world.draw(ctx, this.player);

    // Draw Goal Zone / Finish Line on Peak
    this.goalZone.draw(ctx);

    // Draw Particles
    this.particleSystem.draw(ctx);

    // Draw Player
    this.player.draw(ctx);

    // Draw Debug Bounding Boxes
    if (this.debugMode) {
      this.drawDebug(ctx);
    }

    this.camera.restore(ctx);

    // -------------------------------------------------------------------------
    // 3. Darkness & Lantern Illumination Layer Pass
    // -------------------------------------------------------------------------
    if (CONFIG.lighting.enabled) {
      this.renderLighting(ctx);
    }

    // -------------------------------------------------------------------------
    // 4. Screen Space UI & HUD
    // -------------------------------------------------------------------------
    if (this.checkpointBanner.active) {
      this.drawCheckpointBanner(ctx, w, h);
    }

    if (this.debugMode) {
      this.drawDebugOverlay(ctx);
    }
  }

  renderLighting(ctx) {
    const lightCtx = this.lightCtx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Clear offscreen lighting canvas
    lightCtx.clearRect(0, 0, w, h);

    // 2. Fill ambient darkness overlay
    lightCtx.fillStyle = `rgba(7, 11, 20, ${CONFIG.lighting.ambientDarkness})`;
    lightCtx.fillRect(0, 0, w, h);

    // 3. Apply Camera transform and punch out light radius around lantern
    this.camera.apply(lightCtx);
    lightCtx.globalCompositeOperation = 'destination-out';

    const lanternPos = this.player.getLanternWorldPos();
    const radius = this.player.getLanternRadius();

    // Smooth radial gradient cutout for natural light falloff
    const maskGrad = lightCtx.createRadialGradient(
      lanternPos.x, lanternPos.y, 0,
      lanternPos.x, lanternPos.y, radius
    );
    maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    maskGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.95)');
    maskGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.60)');
    maskGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.25)');
    maskGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    lightCtx.fillStyle = maskGrad;
    lightCtx.beginPath();
    lightCtx.arc(lanternPos.x, lanternPos.y, radius, 0, Math.PI * 2);
    lightCtx.fill();

    lightCtx.globalCompositeOperation = 'source-over';
    this.camera.restore(lightCtx);

    // 4. Draw the darkness mask onto the main screen
    ctx.drawImage(this.lightCanvas, 0, 0);

    // 5. Draw magical pink ambient light wash over the illuminated area & platforms
    this.camera.apply(ctx);
    ctx.save();

    const glowGrad = ctx.createRadialGradient(
      lanternPos.x, lanternPos.y, 0,
      lanternPos.x, lanternPos.y, radius
    );
    glowGrad.addColorStop(0, CONFIG.lighting.lantern.glowColorInner);
    glowGrad.addColorStop(0.35, CONFIG.lighting.lantern.glowColorMid);
    glowGrad.addColorStop(0.70, 'rgba(219, 39, 119, 0.08)');
    glowGrad.addColorStop(1.0, CONFIG.lighting.lantern.glowColorOuter);

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(lanternPos.x, lanternPos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    this.camera.restore(ctx);
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

    // Deterministic pseudo-stars moving subtly with camera
    const starCount = 45;
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
    // Player Hitbox
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);

<<<<<<< HEAD
    // Goal Zone Hitbox
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.goalZone.x, this.goalZone.y, this.goalZone.width, this.goalZone.height);

=======
    // Hazard Hitboxes
    for (const hazard of this.world.hazards) {
      const hb = hazard.getHitbox();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
    }

    // Platform Hitboxes
    for (const plat of this.world.platforms) {
      if (!plat.isSolid) continue;
      ctx.strokeStyle = plat.type === 'moving' ? '#38bdf8' : (plat.type === 'crumbling' ? '#fb923c' : (plat.type === 'moving_crumbling' ? '#e879f9' : '#4ade80'));
      ctx.lineWidth = 1;
      ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    }

    // Lantern Illumination Radius outline
    const lanternPos = this.player.getLanternWorldPos();
    const radius = this.player.getLanternRadius();
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(lanternPos.x, lanternPos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
>>>>>>> origin/master
    // Velocity vector line
    ctx.strokeStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(this.player.centerX, this.player.centerY);
    ctx.lineTo(this.player.centerX + this.player.vx * 0.1, this.player.centerY + this.player.vy * 0.1);
    ctx.stroke();

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
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
<<<<<<< HEAD
    ctx.fillRect(16, 60, 240, 150);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 60, 240, 150);
=======
    ctx.fillRect(16, 60, 320, 200);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 60, 320, 200);

    const activeCpName = this.currentCheckpoint ? this.currentCheckpoint.label : 'None';
    const platType = this.player.standingPlatform ? this.player.standingPlatform.type : 'None';
    const platState = this.player.standingPlatform ? this.player.standingPlatform.state : '-';
>>>>>>> origin/master

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`DEBUG MODE (F3)`, 26, 80);

    ctx.fillStyle = '#f8fafc';
<<<<<<< HEAD
    ctx.fillText(`Pos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`, 26, 98);
    ctx.fillText(`Vel: (${Math.round(this.player.vx)}, ${Math.round(this.player.vy)})`, 26, 116);
    ctx.fillText(`Grounded: ${this.player.isGrounded} | Coyote: ${this.player.coyoteTimer.toFixed(2)}s`, 26, 134);
    ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, 26, 152);
    ctx.fillText(`Timer: ${this.timerState} (${this.runTime.toFixed(2)}s)`, 26, 170);
    ctx.fillText(`Active Particles: ${this.particleSystem.particles.length}`, 26, 188);
=======
    ctx.font = '11px monospace';
    ctx.fillText(`Pos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`, 26, 100);
    ctx.fillText(`Vel: (${Math.round(this.player.vx)}, ${Math.round(this.player.vy)})`, 26, 116);
    ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp} | i-Frames: ${this.player.invulnerableTimer.toFixed(2)}s`, 26, 132);
    ctx.fillText(`Knockback Active: ${this.player.knockbackTimer > 0}`, 26, 148);
    ctx.fillText(`Grounded: ${this.player.isGrounded} | Coyote: ${this.player.coyoteTimer.toFixed(2)}s`, 26, 164);
    ctx.fillText(`Platform: ${platType} [${platState}]`, 26, 180);
    ctx.fillText(`Wall: ${this.player.isTouchingWall} (dir: ${this.player.wallDir}) | Slide: ${this.player.isWallSliding}`, 26, 196);
    ctx.fillText(`Checkpoint: ${activeCpName} | Hazards: ${this.world.hazards.length}`, 26, 212);
    ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)}) | Particles: ${this.particleSystem.particles.length}`, 26, 228);
>>>>>>> origin/master
    ctx.restore();
  }

  loop(currentTime) {
    // Calculate delta time in seconds (clamped to avoid spiral of death on tab unfocus)
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    if (dt > 0.1) dt = 0.1;

    // FPS calculation
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
