/**
 * 2D Platformer Game Template
 * Pure Vanilla JavaScript & HTML5 Canvas - Zero Build Steps
 * 
 * Features:
 * - Responsive physics with coyote time, jump buffering & variable jump height
 * - Oscillating moving platforms (multi-block horizontal & vertical sine easing)
 * - Shiny aesthetics: animated specular sheen sweep, glossy highlights, corner star glints & neon glow
 * - Crumbling platforms (shake on step, break away, fall, and respawn)
 * - Hybrid moving & crumbling platforms (oscillate along tracks, fall when stepped on)
 * - Particle system with landing dust, crumble debris & respawn sparkles
 * - Parallax starry sky & procedural character squash/stretch animation
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
    platformBorder: '#334155',
    playerBody: '#38bdf8',
    playerGlow: 'rgba(56, 189, 248, 0.35)',
    playerEye: '#0f172a',
    playerHat: '#f43f5e',
    playerHatBand: '#fbbf24',
    playerHatBrim: '#e11d48',
    particle: '#38bdf8',
    checkpointActive: '#10b981',
    checkpointInactive: '#ef4444',
    checkpointGlow: 'rgba(16, 185, 129, 0.4)',
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
// 4. PLATFORM SYSTEM
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

    // Motion parameters (supports prominent multi-block horizontal & vertical oscillation)
    this.oscX = config.oscX || 0;       // Horizontal oscillation distance (+/- px from startX)
    this.oscY = config.oscY || 0;       // Vertical oscillation distance (+/- px from startY)
    this.speedX = config.speedX || 1.3; // Frequency multiplier
    this.speedY = config.speedY || 1.3;
    this.phaseX = config.phaseX || 0;
    this.phaseY = config.phaseY || 0;
    this.motionTimer = Math.random() * 5.0; // Desynchronize visual shimmer

    // Crumble parameters (for 'crumbling' and 'moving_crumbling')
    this.crumbleDuration = config.crumbleDuration || 0.75; // Seconds shaking before falling
    this.respawnDelay = config.respawnDelay || 2.8;        // Seconds after falling before respawn
    this.fallSpeed = 0;
    this.fallGravity = config.fallGravity || 1200;
    this.shakeIntensity = config.shakeIntensity || 3.2;

    // State machine: 'idle' | 'shaking' | 'falling' | 'respawning'
    this.state = 'idle';
    this.stateTimer = 0;

    // Frame velocity & displacement (to carry player)
    this.prevX = this.x;
    this.prevY = this.y;
    this.deltaX = 0;
    this.deltaY = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.alpha = 1.0;
    this.isSolid = true;

    // Crack seed for consistent visual fractures
    this.crackPoints = this.generateCrackPoints();
  }

  isOscillating() {
    return this.oscX !== 0 || this.oscY !== 0 || this.type === 'moving' || this.type === 'moving_crumbling';
  }

  isCrumbling() {
    return this.type === 'crumbling' || this.type === 'moving_crumbling';
  }

  generateCrackPoints() {
    const points = [];
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const px = (this.width * (i + 1)) / (count + 1) + (Math.random() * 10 - 5);
      points.push({
        x: px,
        topY: 2,
        midX: px + (Math.random() * 8 - 4),
        midY: this.height * 0.55,
        botX: px + (Math.random() * 12 - 6),
        botY: this.height - 2,
      });
    }
    return points;
  }

  onStepped(player, particleSystem) {
    if (this.isCrumbling() && this.state === 'idle') {
      this.state = 'shaking';
      this.stateTimer = 0;
      if (particleSystem) {
        particleSystem.emitCrumbleDust(this.x + this.width / 2, this.y, this.width);
      }
    }
  }

  update(dt, particleSystem) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.motionTimer += dt;

    // -------------------------------------------------------------------------
    // 1. Multi-Block Oscillation Motion Update
    // -------------------------------------------------------------------------
    if (this.isOscillating() && (this.state === 'idle' || this.state === 'shaking')) {
      let targetX = this.startX;
      let targetY = this.startY;

      if (this.oscX !== 0) {
        targetX = this.startX + Math.sin(this.motionTimer * this.speedX + this.phaseX) * this.oscX;
      }
      if (this.oscY !== 0) {
        targetY = this.startY + Math.sin(this.motionTimer * this.speedY + this.phaseY) * this.oscY;
      }

      this.deltaX = targetX - this.prevX;
      this.deltaY = targetY - this.prevY;
      this.x = targetX;
      this.y = targetY;
    } else if (this.state !== 'falling') {
      this.deltaX = 0;
      this.deltaY = 0;
    }

    // -------------------------------------------------------------------------
    // 2. Crumble State Machine
    // -------------------------------------------------------------------------
    if (this.isCrumbling()) {
      switch (this.state) {
        case 'shaking':
          this.stateTimer += dt;
          // Progressively increase shake intensity as collapse nears
          const progress = Math.min(1.0, this.stateTimer / this.crumbleDuration);
          const currentShake = this.shakeIntensity * (0.6 + progress * 0.9);
          this.shakeOffsetX = (Math.random() * 2 - 1) * currentShake;
          this.shakeOffsetY = (Math.random() * 2 - 1) * currentShake * 0.6;

          // Emit small crumble debris puffs periodically while shaking
          if (particleSystem && Math.random() < 0.35) {
            const rx = this.x + Math.random() * this.width;
            particleSystem.emit(rx, this.y + this.height, 1, {
              color: '#ea580c',
              sizeMin: 1.5,
              sizeMax: 3.5,
              speedMin: 15,
              speedMax: 45,
              angleMin: Math.PI * 0.3,
              angleMax: Math.PI * 0.7,
              lifeMin: 0.25,
              lifeMax: 0.5,
              gravity: 400,
            });
          }

          if (this.stateTimer >= this.crumbleDuration) {
            // Detach and fall!
            this.state = 'falling';
            this.stateTimer = 0;
            this.fallSpeed = 50;
            this.isSolid = false;
            this.deltaX = 0;
            this.deltaY = 0;
            if (particleSystem) {
              particleSystem.emitBreak(this.x + this.width / 2, this.y + this.height / 2, this.width);
            }
          }
          break;

        case 'falling':
          this.stateTimer += dt;
          this.fallSpeed += this.fallGravity * dt;
          const fallDelta = this.fallSpeed * dt;
          this.y += fallDelta;
          this.deltaY = fallDelta;
          this.deltaX = 0;
          this.alpha = Math.max(0, 1 - (this.stateTimer / 0.75));

          // Once fallen off screen or fully faded, switch to respawning
          if (this.alpha <= 0 || this.y > CONFIG.world.deathY + 100) {
            this.state = 'respawning';
            this.stateTimer = 0;
            this.alpha = 0;
            this.fallSpeed = 0;
            this.isSolid = false;
          }
          break;

        case 'respawning':
          this.stateTimer += dt;
          if (this.stateTimer >= this.respawnDelay) {
            // Re-materialize at starting track coordinates
            this.state = 'idle';
            this.stateTimer = 0;
            this.alpha = 1.0;
            this.isSolid = true;
            this.fallSpeed = 0;

            if (this.isOscillating()) {
              if (this.oscX !== 0) {
                this.x = this.startX + Math.sin(this.motionTimer * this.speedX + this.phaseX) * this.oscX;
              } else {
                this.x = this.startX;
              }
              if (this.oscY !== 0) {
                this.y = this.startY + Math.sin(this.motionTimer * this.speedY + this.phaseY) * this.oscY;
              } else {
                this.y = this.startY;
              }
            } else {
              this.x = this.startX;
              this.y = this.startY;
            }

            this.prevX = this.x;
            this.prevY = this.y;
            this.deltaX = 0;
            this.deltaY = 0;

            if (particleSystem) {
              particleSystem.emitRespawnGlow(this.x + this.width / 2, this.y + this.height / 2, this.width);
            }
          }
          break;

        case 'idle':
        default:
          this.isSolid = true;
          this.alpha = 1.0;
          break;
      }
    }
  }

  drawTrack(ctx) {
    if (!this.isOscillating()) return;

    ctx.save();
    const isHybrid = this.type === 'moving_crumbling';
    ctx.strokeStyle = isHybrid ? CONFIG.colors.platformHybridTrack : CONFIG.colors.platformTrack;
    ctx.fillStyle = isHybrid ? CONFIG.colors.platformHybridTrackDot : CONFIG.colors.platformTrackDot;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);

    const halfW = this.width / 2;
    const halfH = this.height / 2;

    // Horizontal track guide
    if (this.oscX !== 0) {
      const leftX = this.startX - this.oscX + halfW;
      const rightX = this.startX + this.oscX + halfW;
      const trackY = this.startY + halfH;

      ctx.beginPath();
      ctx.moveTo(leftX, trackY);
      ctx.lineTo(rightX, trackY);
      ctx.stroke();

      // Track endpoint stops (Glowing nodes)
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(leftX, trackY, 4.5, 0, Math.PI * 2);
      ctx.arc(rightX, trackY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vertical track guide
    if (this.oscY !== 0) {
      const trackX = this.startX + halfW;
      const topY = this.startY - this.oscY + halfH;
      const botY = this.startY + this.oscY + halfH;

      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(trackX, topY);
      ctx.lineTo(trackX, botY);
      ctx.stroke();

      // Track endpoint stops (Glowing nodes)
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(trackX, topY, 4.5, 0, Math.PI * 2);
      ctx.arc(trackX, botY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  draw(ctx) {
    if (this.state === 'respawning') return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    const drawX = this.x + this.shakeOffsetX;
    const drawY = this.y + this.shakeOffsetY;

    // Color palette selection
    let bodyColor = CONFIG.colors.platformBody;
    let bodyDark = CONFIG.colors.platformBodyDark;
    let borderColor = CONFIG.colors.platformBorder;
    let topColor = CONFIG.colors.platformTop;
    let topGlossColor = CONFIG.colors.platformTopGloss;
    let glowColor = CONFIG.colors.platformGlow;

    if (this.type === 'moving') {
      bodyColor = CONFIG.colors.platformMovingBody;
      bodyDark = CONFIG.colors.platformMovingBodyDark;
      borderColor = CONFIG.colors.platformMovingBorder;
      topColor = CONFIG.colors.platformMovingTop;
      topGlossColor = CONFIG.colors.platformMovingTopGloss;
      glowColor = CONFIG.colors.platformMovingGlow;
    } else if (this.type === 'crumbling') {
      bodyColor = CONFIG.colors.platformCrumbleBody;
      bodyDark = CONFIG.colors.platformCrumbleBodyDark;
      borderColor = CONFIG.colors.platformCrumbleBorder;
      topColor = CONFIG.colors.platformCrumbleTop;
      topGlossColor = CONFIG.colors.platformCrumbleTopGloss;
      glowColor = CONFIG.colors.platformCrumbleGlow;
    } else if (this.type === 'moving_crumbling') {
      bodyColor = CONFIG.colors.platformHybridBody;
      bodyDark = CONFIG.colors.platformHybridBodyDark;
      borderColor = CONFIG.colors.platformHybridBorder;
      topColor = CONFIG.colors.platformHybridTop;
      topGlossColor = CONFIG.colors.platformHybridTopGloss;
      glowColor = CONFIG.colors.platformHybridGlow;
    }

    // -------------------------------------------------------------------------
    // 1. Shiny Outer Glow
    // -------------------------------------------------------------------------
    if (this.isOscillating() || this.type === 'moving_crumbling') {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
    }

    // -------------------------------------------------------------------------
    // 2. Shiny Metallic / Crystal Body Gradient
    // -------------------------------------------------------------------------
    const bodyGradient = ctx.createLinearGradient(drawX, drawY, drawX, drawY + this.height);
    bodyGradient.addColorStop(0, bodyColor);
    bodyGradient.addColorStop(1, bodyDark);

    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    this.drawRoundedRect(ctx, drawX, drawY, this.width, this.height, 6);
    ctx.fill();
    ctx.stroke();

    // Reset shadow for internal accents
    ctx.shadowBlur = 0;

    // -------------------------------------------------------------------------
    // 3. Specular Shimmer / Shiny Light Sheen Sweep Across Platform
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.beginPath();
    this.drawRoundedRect(ctx, drawX, drawY, this.width, this.height, 6);
    ctx.clip();

    // Shimmer travels diagonally across the platform periodically
    const shimmerSpeed = 130;
    const shimmerPeriod = this.width + 160;
    const shimmerX = drawX - 60 + ((this.motionTimer * shimmerSpeed) % shimmerPeriod);

    const shimmerGrad = ctx.createLinearGradient(shimmerX - 35, drawY, shimmerX + 35, drawY + this.height);
    shimmerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    shimmerGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.42)');
    shimmerGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.65)');
    shimmerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = shimmerGrad;
    ctx.fillRect(drawX - 20, drawY, this.width + 40, this.height);
    ctx.restore();

    // -------------------------------------------------------------------------
    // 4. Moving Platform Accents (Chevrons & Shiny Core)
    // -------------------------------------------------------------------------
    if (this.isOscillating()) {
      this.drawMovingAccents(ctx, drawX, drawY, topColor);
    }

    // -------------------------------------------------------------------------
    // 5. Crumble Accents (Fractures & Danger Warnings)
    // -------------------------------------------------------------------------
    if (this.isCrumbling()) {
      this.drawCrumbleAccents(ctx, drawX, drawY);
    }

    // -------------------------------------------------------------------------
    // 6. Glossy Top Highlight Lip with Specular Glass Glint
    // -------------------------------------------------------------------------
    const topGradient = ctx.createLinearGradient(drawX, drawY + 1, drawX, drawY + 7);
    topGradient.addColorStop(0, topGlossColor);
    topGradient.addColorStop(1, topColor);

    ctx.fillStyle = topGradient;
    ctx.beginPath();
    this.drawRoundedRect(ctx, drawX + 2, drawY + 1, this.width - 4, 6, 3);
    ctx.fill();

    // Thin specular white glint strip
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(drawX + 6, drawY + 1.5, this.width - 12, 1.2);

    // -------------------------------------------------------------------------
    // 7. Twinkling Shiny Corner Star Sparkles
    // -------------------------------------------------------------------------
    this.drawSparkles(ctx, drawX, drawY, topGlossColor);

    // -------------------------------------------------------------------------
    // 8. Label
    // -------------------------------------------------------------------------
    if (this.label) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.label, drawX + this.width / 2, drawY + this.height - 8);
    }

    ctx.restore();
  }

  drawSparkles(ctx, drawX, drawY, color) {
    ctx.save();
    // Twinkle pulse 1 (left side)
    const t1 = (Math.sin(this.motionTimer * 4.0) + 1) / 2;
    if (t1 > 0.6) {
      const sparkleAlpha = (t1 - 0.6) / 0.4;
      const size = 3 + sparkleAlpha * 3;
      this.renderStarSparkle(ctx, drawX + 10, drawY + 3, size, sparkleAlpha, color);
    }

    // Twinkle pulse 2 (right side)
    const t2 = (Math.sin(this.motionTimer * 3.5 + 2.5) + 1) / 2;
    if (t2 > 0.65) {
      const sparkleAlpha = (t2 - 0.65) / 0.35;
      const size = 3 + sparkleAlpha * 3.5;
      this.renderStarSparkle(ctx, drawX + this.width - 12, drawY + 3, size, sparkleAlpha, color);
    }
    ctx.restore();
  }

  renderStarSparkle(ctx, cx, cy, size, alpha, color) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx, cy, cx + size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + size);
    ctx.quadraticCurveTo(cx, cy, cx - size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central bright point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawMovingAccents(ctx, drawX, drawY, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.65;

    const centerY = drawY + this.height / 2 + 1;
    const centerX = drawX + this.width / 2;

    if (this.oscX !== 0) {
      // Horizontal arrows / chevrons
      const arrowSize = 4;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Left chevron
      ctx.moveTo(centerX - 16, centerY - arrowSize);
      ctx.lineTo(centerX - 20, centerY);
      ctx.lineTo(centerX - 16, centerY + arrowSize);
      // Right chevron
      ctx.moveTo(centerX + 16, centerY - arrowSize);
      ctx.lineTo(centerX + 20, centerY);
      ctx.lineTo(centerX + 16, centerY + arrowSize);
      ctx.stroke();
    }

    if (this.oscY !== 0) {
      // Vertical chevrons
      const arrowSize = 4;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Up chevron
      ctx.moveTo(centerX - arrowSize, centerY - 6);
      ctx.lineTo(centerX, centerY - 10);
      ctx.lineTo(centerX + arrowSize, centerY - 6);
      // Down chevron
      ctx.moveTo(centerX - arrowSize, centerY + 6);
      ctx.lineTo(centerX, centerY + 10);
      ctx.lineTo(centerX + arrowSize, centerY + 6);
      ctx.stroke();
    }

    // Center Energy Core Pip with glowing ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawCrumbleAccents(ctx, drawX, drawY) {
    ctx.save();
    const isShaking = this.state === 'shaking';
    ctx.strokeStyle = isShaking ? '#fef08a' : 'rgba(254, 215, 170, 0.45)';
    ctx.lineWidth = isShaking ? 2 : 1;

    // Draw jagged fracture lines
    for (const crack of this.crackPoints) {
      ctx.beginPath();
      ctx.moveTo(drawX + crack.x, drawY + crack.topY);
      ctx.lineTo(drawX + crack.midX, drawY + crack.midY);
      ctx.lineTo(drawX + crack.botX, drawY + crack.botY);
      ctx.stroke();
    }

    // Danger pulse overlay when shaking
    if (isShaking) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      this.drawRoundedRect(ctx, drawX, drawY, this.width, this.height, 6);
      ctx.fill();
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
// 4. PLAYER
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
    this.walkAnimTimer = 0;
    this.blinkTimer = 2.0;
    this.isBlinking = false;
  }

  respawn(spawnPoint, particleSystem) {
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.vx = 0;
    this.vy = 0;
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
    // -------------------------------------------------------------------------
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
    // 2. Horizontal Movement
    // -------------------------------------------------------------------------
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

    // Variable jump cut: if player lets go of jump while moving upwards, cut jump short
    if (!input.jump && this.vy < 0) {
      this.vy += CONFIG.physics.gravity * (1 - CONFIG.physics.jumpCutMultiplier) * dt * 2.5;
    }

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

    // -------------------------------------------------------------------------
    // 5. Physics Collision Resolution (AABB)
    // -------------------------------------------------------------------------
    // Move X first & check collisions
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

    // Move Y next & check collisions
    this.wasGrounded = this.isGrounded;
    this.isGrounded = false;
    this.y += this.vy * dt;

    for (const plat of platforms) {
      if (this.checkCollision(this, plat)) {
        if (this.vy > 0) {
          // Landed on platform top
          this.y = plat.y - this.height;
          this.vy = 0;
          this.isGrounded = true;

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
    ctx.save();

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

    // 3. Hat Band (Golden Accent Ribbon)
    ctx.fillStyle = CONFIG.colors.playerHatBand;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.drawRoundedRect(ctx, -crownWidth / 2 + 1, -4.5, crownWidth - 2, 4, 1.5);
    ctx.fill();
    ctx.stroke();

    // 4. Pom-pom / Golden Star on Top of Hat
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
// 5. CAMERA SYSTEM
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
    // Target position includes lookahead based on player movement
    this.targetX = player.centerX + player.facing * CONFIG.camera.lookAheadDist;
    this.targetY = player.centerY + CONFIG.camera.verticalOffset;

    // Smooth Lerp tracking
    const t = 1 - Math.exp(-CONFIG.camera.lerpSpeed * dt);
    this.x += (this.targetX - this.x) * t;
    this.y += (this.targetY - this.y) * t;
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
// 7. WORLD & SCENE PLATFORMS (MULTI-BLOCK HORIZONTAL MOVEMENT + SHINY HUBS)
// =============================================================================
class World {
  constructor() {
    this.platforms = [
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
      new Platform({ x: 1540, y: 180, width: 160, height: 30, label: 'Checkpoint' }),

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

      // 2. Stepping stones leading up
      { x: 480, y: 280, width: 140, height: 26 },
      { x: 680, y: 220, width: 160, height: 26 },
      { x: 900, y: 150, width: 180, height: 26 },

      // 3. High vantage platform
      { x: 1140, y: 80, width: 260, height: 32, label: 'Peak' },

      // 4. Lower gap challenge
      { x: 1160, y: 320, width: 180, height: 30 },
      { x: 1420, y: 380, width: 220, height: 36 },
      { x: 1720, y: 300, width: 160, height: 26 },

      // 5. Long return runway
      { x: 1940, y: 240, width: 340, height: 40, label: 'Runway' },

      // 6. Floating upper islands
      { x: 740, y: 60, width: 120, height: 24 },
      { x: 500, y: 80, width: 100, height: 24 },
      { x: 280, y: 140, width: 120, height: 24 },
    ];

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
      // Platform Body
      ctx.fillStyle = CONFIG.colors.platformBody;
      ctx.strokeStyle = CONFIG.colors.platformBorder;
      ctx.lineWidth = 2;

      ctx.beginPath();
      this.drawRoundedRect(ctx, plat.x, plat.y, plat.width, plat.height, 6);
      ctx.fill();
      ctx.stroke();

      // Bright top edge highlight (Grass/Energy surface)
      ctx.fillStyle = CONFIG.colors.platformTop;
      ctx.beginPath();
      this.drawRoundedRect(ctx, plat.x + 2, plat.y + 1, plat.width - 4, 6, 3);
      ctx.fill();

      // Subtle label on key platforms
      if (plat.label) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(plat.label, plat.x + plat.width / 2, plat.y + plat.height - 10);
      }
    }

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
// 8. GAME ENGINE & LOOP
// =============================================================================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.statsDisplay = document.getElementById('statsDisplay');

    this.input = new InputManager();
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
    // Toggle Debug overlay
    if (this.input.debugJustPressed) {
      this.debugMode = !this.debugMode;
    }

    // Manual Respawn trigger
    if (this.input.restartJustPressed) {
      this.triggerRespawn();
    }

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

    // Fall-off-the-map detection & respawn
    if (this.player.y > CONFIG.world.deathY) {
      this.triggerRespawn();
    }

    // Update Camera & Particles
    this.camera.update(dt, this.player);
    this.particleSystem.update(dt);

    // Reset single-frame inputs
    this.input.resetFrame();
  }

  triggerRespawn() {
    this.respawnCount++;
    const spawnPos = this.currentSpawnPoint || CONFIG.world.spawnPoint;
    this.player.respawn(spawnPos, this.particleSystem);
    this.updateHUD();
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

    // Draw Platforms & Checkpoints
    this.world.draw(ctx, this.player);

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
});


}
