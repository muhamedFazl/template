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
    bouncePadForce: 950,    // Launch velocity for springs and bounce pads
    wallSlideSpeed: 110,    // Downward slide speed when in contact with a wall
    wallJumpForceY: 540,    // Vertical jump height from a wall
    wallJumpForceX: 210,    // Outward impulse away from wall
    wallCoyoteTime: 0.10,   // Grace period to jump after leaving a wall
  },
  camera: {
    lerpSpeed: 6.0,         // Camera follow tightness
    lookAheadDist: 80,      // Lookahead distance in facing direction
    verticalOffset: -30,    // Vertical bias for better view of what's ahead
  },
  world: {
    spawnPoint: { x: 140, y: 220 },
    deathY: 750,            // Y-coordinate below which the player respawns
  },
  colors: {
    skyTop: '#0b0f19',
    skyBottom: '#1a2333',
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
    checkpointActive: '#10b981',
    checkpointInactive: '#ef4444',
    checkpointGlow: 'rgba(16, 185, 129, 0.4)',
    springBody: '#f43f5e',
    springCoil: '#cbd5e1',
    springCap: '#e11d48',
    padBody: '#1e293b',
    padBorder: '#475569',
    padGlowBlue: '#3b82f6',
    padGlowPurple: '#a855f7',
    coin: '#fbbf24',
    coinGlow: 'rgba(251, 191, 36, 0.35)',
    coinBorder: '#d97706',
    gem: '#e879f9',
    gemGlow: 'rgba(232, 121, 249, 0.4)',
    gemBorder: '#c026d3',
    enemyBody: '#a855f7',
    enemyBodyLight: '#c084fc',
    enemyGlow: 'rgba(168, 85, 247, 0.35)',
    enemyEye: '#0f172a',
    enemyHat: '#eab308',
    enemyHatBand: '#38bdf8',
    enemyHatBrim: '#ca8a04',
  }
};

// =============================================================================
// PROCEDURAL SOUND EFFECT MANAGER (Web Audio API)
// =============================================================================
class SoundEffectManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
    if (AudioContextClass) {
      try {
        this.ctx = new AudioContextClass();
      } catch (e) {
        console.warn('Web Audio API error:', e);
      }
    }
  }

  playBoing() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.16);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.32);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playJump() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  playLand() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playDamage() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  playStomp() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
  }

  playCoin() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playGem() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [1046.5, 1318.51, 1567.98, 2093.0].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + i * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch (e) {}
  }

  playCheckpoint() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [330, 440, 550, 660].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + i * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.15);
      });
    } catch (e) {}
  }

  playFanfare() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + i * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch (e) {}
  }
}

const SoundManager = new SoundEffectManager();

// =============================================================================
// 2. INPUT MANAGER
// =============================================================================
class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};

    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling on space and arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      SoundManager.init();

      if (!this.keys[e.code]) {
        this.justPressed[e.code] = true;
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('click', () => {
      SoundManager.init();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  isJustPressed(code) {
    return !!this.justPressed[code];
  }

  resetFrame() {
    this.justPressed = {};
  }

  // Convenient Movement Accessors
  get left() {
    return this.isDown('ArrowLeft') || this.isDown('KeyA');
  }

  get right() {
    return this.isDown('ArrowRight') || this.isDown('KeyD');
  }

  get jump() {
    return this.isDown('Space') || this.isDown('ArrowUp') || this.isDown('KeyW');
  }

  get jumpJustPressed() {
    return this.isJustPressed('Space') || this.isJustPressed('ArrowUp') || this.isJustPressed('KeyW');
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

  emit(x, y, count = 8, config = {}) {
    const defaults = {
      color: CONFIG.colors.particle,
      sizeMin: 2,
      sizeMax: 5,
      speedMin: 40,
      speedMax: 180,
      lifeMin: 0.25,
      lifeMax: 0.55,
      gravity: 300,
      angleMin: 0,
      angleMax: Math.PI * 2,
    };
    const c = { ...defaults, ...config };

    for (let i = 0; i < count; i++) {
      const angle = c.angleMin + Math.random() * (c.angleMax - c.angleMin);
      const speed = c.speedMin + Math.random() * (c.speedMax - c.speedMin);
      const size = c.sizeMin + Math.random() * (c.sizeMax - c.sizeMin);
      const lifetime = c.lifeMin + Math.random() * (c.lifeMax - c.lifeMin);

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        initialSize: size,
        color: c.color,
        gravity: c.gravity,
        lifetime,
        maxLife: lifetime,
      });
    }
  }

  emitDust(x, y, dir = 0) {
    const angleMin = dir === 0 ? -Math.PI * 0.85 : (dir > 0 ? -Math.PI * 0.95 : -Math.PI * 0.35);
    const angleMax = dir === 0 ? -Math.PI * 0.15 : (dir > 0 ? -Math.PI * 0.65 : -Math.PI * 0.05);

    this.emit(x, y, 6, {
      color: 'rgba(255, 255, 255, 0.4)',
      sizeMin: 2,
      sizeMax: 4,
      speedMin: 20,
      speedMax: 90,
      lifeMin: 0.2,
      lifeMax: 0.4,
      gravity: 200,
      angleMin,
      angleMax,
    });
  }

  emitBreakDebris(x, y, width, height) {
    const count = Math.max(12, Math.floor(width / 8));
    for (let i = 0; i < count; i++) {
      const pX = x + Math.random() * width;
      const pY = y + Math.random() * height;
      const colors = ['#f97316', '#fb923c', '#fdba74', '#334155', '#475569'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.emit(pX, pY, 1, {
        color,
        sizeMin: 3,
        sizeMax: 6,
        speedMin: 40,
        speedMax: 200,
        lifeMin: 0.4,
        lifeMax: 0.8,
        gravity: 600,
        angleMin: -Math.PI * 0.95,
        angleMax: -Math.PI * 0.05,
      });
    }
  }

  emitRespawnGlow(x, y, width, height) {
    for (let i = 0; i < 14; i++) {
      const pX = x + Math.random() * width;
      const pY = y + Math.random() * height;
      this.emit(pX, pY, 1, {
        color: '#38bdf8',
        sizeMin: 2,
        sizeMax: 4,
        speedMin: 15,
        speedMax: 45,
        lifeMin: 0.3,
        lifeMax: 0.6,
        gravity: -50,
        angleMin: -Math.PI * 0.75,
        angleMax: -Math.PI * 0.25,
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
      gravity: -35,
    });
  }

  emitConfetti(x, y, count = 50) {
    const confettiColors = ['#f43f5e', '#38bdf8', '#fbbf24', '#4ade80', '#e879f9', '#a855f7', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      this.emit(x, y, 1, {
        color,
        sizeMin: 3,
        sizeMax: 7,
        speedMin: 80,
        speedMax: 350,
        lifeMin: 0.8,
        lifeMax: 1.8,
        gravity: 250,
        angleMin: -Math.PI * 0.95,
        angleMax: -Math.PI * 0.05,
      });
    }
  }

  emitSparkle(x, y, color = '#38bdf8') {
    this.emit(x, y, 1, {
      color,
      sizeMin: 1.5,
      sizeMax: 3.5,
      speedMin: 10,
      speedMax: 35,
      lifeMin: 0.3,
      lifeMax: 0.6,
      gravity: -20,
    });
  }

  emitCollect(x, y, color = CONFIG.colors.coin, count = 18) {
    this.emit(x, y, count, {
      color,
      sizeMin: 2.5,
      sizeMax: 6,
      speedMin: 60,
      speedMax: 220,
      lifeMin: 0.35,
      lifeMax: 0.75,
      gravity: 120,
    });
    // Extra sparkling white glints
    this.emit(x, y, Math.floor(count / 2), {
      color: '#ffffff',
      sizeMin: 1.5,
      sizeMax: 3.5,
      speedMin: 40,
      speedMax: 160,
      lifeMin: 0.2,
      lifeMax: 0.5,
      gravity: 60,
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

      // Scale down particle over its lifetime
      p.size = (p.lifetime / p.maxLife) * p.initialSize;
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, p.lifetime / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// =============================================================================
// 4. FLOATING TEXT SYSTEM
// =============================================================================
class FloatingTextSystem {
  constructor() {
    this.texts = [];
  }

  add(x, y, text, color = '#fbbf24') {
    this.texts.push({
      x,
      y,
      text,
      color,
      lifetime: 0.85,
      maxLife: 0.85,
      vy: -70,
    });
  }

  update(dt) {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.lifetime -= dt;
      if (t.lifetime <= 0) {
        this.texts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
      t.vy += 35 * dt; // slight upward deceleration
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const t of this.texts) {
      const progress = t.lifetime / t.maxLife;
      const alpha = Math.min(1, progress * 1.6);
      const scale = 1 + (1 - progress) * 0.25;

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      // Dark drop shadow outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.strokeText(t.text, 0, 0);

      // Main colored text
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);

      ctx.restore();
    }
    ctx.restore();
  }
}

// =============================================================================
// 5. PLATFORM (STATIC, MOVING, CRUMBLING, HYBRID)
// =============================================================================
class Platform {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.label = config.label || '';
    this.type = config.type || 'static'; // 'static' | 'moving' | 'crumbling' | 'moving_crumbling'

    // Moving Platform state
    this.startX = config.x;
    this.startY = config.y;
    this.rangeX = config.rangeX || 0;
    this.rangeY = config.rangeY || 0;
    this.speed = config.speed || 1.2;
    this.phase = config.phase || 0;
    this.motionTime = this.phase;
    this.vx = 0;
    this.vy = 0;
    this.deltaX = 0;
    this.deltaY = 0;

    // Crumbling Platform state
    this.state = 'idle'; // 'idle' | 'crumbling' | 'broken' | 'respawning'
    this.shakeDuration = config.shakeDuration || 0.65;
    this.respawnDuration = config.respawnDuration || 3.0;
    this.timer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.opacity = 1.0;
    this.isSolid = true;

    // Visual aesthetics
    this.sheenTime = Math.random() * Math.PI * 2;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  stepOn() {
    if ((this.type === 'crumbling' || this.type === 'moving_crumbling') && this.state === 'idle') {
      this.state = 'crumbling';
      this.timer = this.shakeDuration;
    }
  }

  update(dt, particleSystem) {
    const isMoving = this.type === 'moving' || this.type === 'moving_crumbling';
    const isCrumbling = this.type === 'crumbling' || this.type === 'moving_crumbling';

    // 1. Moving Platform Kinematics
    if (isMoving && this.state !== 'broken') {
      this.motionTime += dt * this.speed;
      const prevX = this.x;
      const prevY = this.y;

      if (this.rangeX !== 0) {
        this.x = this.startX + Math.sin(this.motionTime) * this.rangeX;
      }
      if (this.rangeY !== 0) {
        this.y = this.startY + Math.sin(this.motionTime) * this.rangeY;
      }

      this.deltaX = this.x - prevX;
      this.deltaY = this.y - prevY;
      this.vx = dt > 0 ? this.deltaX / dt : 0;
      this.vy = dt > 0 ? this.deltaY / dt : 0;
    } else {
      this.deltaX = 0;
      this.deltaY = 0;
      this.vx = 0;
      this.vy = 0;
    }

    // 2. Crumbling Platform Lifecycle
    if (isCrumbling) {
      if (this.state === 'crumbling') {
        this.timer -= dt;
        const progress = 1 - (this.timer / this.shakeDuration);
        const shakeMag = 1.0 + progress * 4.5;
        this.shakeOffsetX = (Math.random() - 0.5) * 2 * shakeMag;
        this.shakeOffsetY = (Math.random() - 0.5) * 2 * shakeMag;

        // Emit falling crumbs
        if (particleSystem && Math.random() < 0.35) {
          const crumbX = this.x + Math.random() * this.width;
          const crumbY = this.y + this.height - 2;
          particleSystem.emit(crumbX, crumbY, 1, {
            color: '#fb923c',
            sizeMin: 2,
            sizeMax: 4,
            speedMin: 20,
            speedMax: 60,
            lifeMin: 0.25,
            lifeMax: 0.5,
            gravity: 450,
            angleMin: Math.PI * 0.25,
            angleMax: Math.PI * 0.75,
          });
        }

        if (this.timer <= 0) {
          this.state = 'broken';
          this.isSolid = false;
          this.opacity = 0;
          this.timer = this.respawnDuration;
          this.shakeOffsetX = 0;
          this.shakeOffsetY = 0;
          if (particleSystem) {
            particleSystem.emitBreakDebris(this.x, this.y, this.width, this.height);
          }
        }
      } else if (this.state === 'broken') {
        this.timer -= dt;
        if (this.timer <= 0.6) {
          this.state = 'respawning';
        }
      } else if (this.state === 'respawning') {
        this.timer -= dt;
        const respawnProgress = Math.max(0, 1 - (this.timer / 0.6));
        this.opacity = respawnProgress;

        if (particleSystem && Math.random() < 0.25) {
          particleSystem.emitRespawnGlow(this.x, this.y, this.width, this.height);
        }

        if (this.timer <= 0) {
          this.state = 'idle';
          this.isSolid = true;
          this.opacity = 1.0;
          this.shakeOffsetX = 0;
          this.shakeOffsetY = 0;
        }
      }
    }

    // Sheen sweep time
    this.sheenTime += dt * 2.2;
  }

  draw(ctx) {
    if (this.state === 'broken') return;

    ctx.save();
    if (this.opacity < 1.0) {
      ctx.globalAlpha = this.opacity;
    }

    const drawX = this.x + this.shakeOffsetX;
    const drawY = this.y + this.shakeOffsetY;
    const w = this.width;
    const h = this.height;
    const radius = 6;

    // Body Fill & Border
    let bodyColor = CONFIG.colors.platformBody;
    let topColor = CONFIG.colors.platformTop;
    let borderColor = CONFIG.colors.platformBorder;

    if (this.type === 'moving') {
      topColor = '#38bdf8'; // Cyan
      borderColor = '#0284c7';
    } else if (this.type === 'crumbling') {
      topColor = this.state === 'crumbling' ? '#f97316' : '#fb923c'; // Orange
      borderColor = '#ea580c';
    } else if (this.type === 'moving_crumbling') {
      topColor = this.state === 'crumbling' ? '#f43f5e' : '#e879f9'; // Fuchsia
      borderColor = '#c026d3';
    }

    // Rounded rectangle body
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    this.drawRoundedRect(ctx, drawX, drawY, w, h, radius);
    ctx.fill();
    ctx.stroke();

    // Grass / Glowing Top Surface Accent Strip
    ctx.fillStyle = topColor;
    ctx.beginPath();
    this.drawRoundedRect(ctx, drawX + 1, drawY + 1, w - 2, Math.min(6, h / 2), 3);
    ctx.fill();

    // Specular Sheen Sweep
    const sheenCycle = (this.sheenTime) % 5.0;
    if (sheenCycle < 1.2) {
      const progress = sheenCycle / 1.2;
      const sheenX = drawX - 20 + progress * (w + 40);
      const sheenGrad = ctx.createLinearGradient(sheenX - 15, drawY, sheenX + 15, drawY);
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.save();
      ctx.beginPath();
      this.drawRoundedRect(ctx, drawX + 1, drawY + 1, w - 2, h - 2, radius);
      ctx.clip();

      ctx.fillStyle = sheenGrad;
      ctx.fillRect(sheenX - 20, drawY, 40, h);
      ctx.restore();
    }

    // Platform Label (if any)
    if (this.label) {
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
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
// 6. SPIKE HAZARD
// =============================================================================
class SpikeHazard {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.width = config.width || 32;
    this.height = config.height || 16;
    this.count = config.count || 2;
    this.direction = config.direction || 'up'; // 'up' | 'down' | 'left' | 'right'
    this.animTimer = Math.random() * Math.PI * 2;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  getHitbox() {
    // Inset slightly to make collision feel forgiving and fair
    const inset = 3;
    return {
      x: this.x + inset,
      y: this.y + inset,
      width: this.width - inset * 2,
      height: this.height - inset * 2,
    };
  }

  update(dt) {
    this.animTimer += dt * 3;
  }

  draw(ctx) {
    ctx.save();
    const spikeW = this.width / this.count;
    const h = this.height;

    for (let i = 0; i < this.count; i++) {
      const sX = this.x + i * spikeW;
      const sY = this.y;

      const grad = ctx.createLinearGradient(sX, sY + h, sX + spikeW / 2, sY);
      grad.addColorStop(0, '#991b1b');
      grad.addColorStop(0.5, '#ef4444');
      grad.addColorStop(1, '#fca5a5');

      ctx.fillStyle = grad;
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(sX, sY + h);
      ctx.lineTo(sX + spikeW / 2, sY);
      ctx.lineTo(sX + spikeW, sY + h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sharp tip glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sX + spikeW / 2, sY + 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// =============================================================================
// 7. BOUNCE PAD & SPRING SYSTEM
// =============================================================================
class BouncePad {
  constructor(x, y, type = 'spring') {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 20;
    this.type = type; // 'spring' | 'pad'
    this.bounceForce = CONFIG.physics.bouncePadForce || 950;
    this.compressScale = 1.0;
    this.animTimer = 0;
    this.isTriggered = false;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  update(dt) {
    if (this.isTriggered) {
      this.animTimer += dt * 14;
      // Damped sine wave for spring wobble
      this.compressScale = 1.0 - Math.sin(this.animTimer * 2) * Math.exp(-this.animTimer * 0.7) * 0.55;
      if (this.animTimer > 4.5) {
        this.isTriggered = false;
        this.compressScale = 1.0;
      }
    } else {
      this.compressScale += (1.0 - this.compressScale) * 8 * dt;
    }
  }

  trigger() {
    this.isTriggered = true;
    this.animTimer = 0;
  }

  draw(ctx) {
    ctx.save();
    // Pivot at bottom center
    ctx.translate(this.x + this.width / 2, this.y + this.height);
    ctx.scale(1 / Math.max(0.2, this.compressScale), this.compressScale);

    const w = this.width;
    const h = this.height;

    if (this.type === 'spring') {
      // Base plate
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-w / 2, -4, w, 4, 2);
      } else {
        ctx.rect(-w / 2, -4, w, 4);
      }
      ctx.fill();

      // Spring coil
      ctx.strokeStyle = CONFIG.colors.springCoil;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      const coils = 3;
      const coilHeight = (h - 8) / coils;
      ctx.moveTo(-w / 4, -4);
      for (let i = 0; i < coils; i++) {
        const yOffset = -4 - i * coilHeight;
        const dir = i % 2 === 0 ? 1 : -1;
        ctx.lineTo(dir * w / 4, yOffset - coilHeight / 2);
        ctx.lineTo(-dir * w / 4, yOffset - coilHeight);
      }
      ctx.stroke();

      // Top Plate (Cap)
      ctx.fillStyle = CONFIG.colors.springCap;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-w / 2 - 2, -h, w + 4, 5, 2);
      } else {
        ctx.rect(-w / 2 - 2, -h, w + 4, 5);
      }
      ctx.fill();

      // Yellow accent strip on Cap
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-w / 2 + 2, -h + 1.5, w - 4, 2);
    } else {
      // Futuristic neon pad
      ctx.fillStyle = CONFIG.colors.padBody;
      ctx.strokeStyle = CONFIG.colors.padBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(-w / 2 + 5, -h);
      ctx.lineTo(w / 2 - 5, -h);
      ctx.lineTo(w / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing core gradient
      const glowGrad = ctx.createLinearGradient(0, -h, 0, 0);
      const glowColor = this.isTriggered ? CONFIG.colors.padGlowPurple : CONFIG.colors.padGlowBlue;
      glowGrad.addColorStop(0, glowColor);
      glowGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');
      
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 6, -h + 2);
      ctx.lineTo(w / 2 - 6, -h + 2);
      ctx.lineTo(w / 2 - 3, -2);
      ctx.lineTo(-w / 2 + 3, -2);
      ctx.closePath();
      ctx.fill();

      // Neon LED line on top
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = this.isTriggered ? 12 : 6;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 4, -h + 1.5);
      ctx.lineTo(w / 2 - 4, -h + 1.5);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// =============================================================================
// 8. COLLECTIBLES (COINS & GEMS)
// =============================================================================
class Collectible {
  constructor(x, y, type = 'coin') {
    this.x = x;
    this.y = y;
    this.type = type; // 'coin' | 'gem'
    this.collected = false;

    if (this.type === 'gem') {
      this.width = 24;
      this.height = 26;
      this.value = 500;
      this.color = CONFIG.colors.gem;
      this.glowColor = CONFIG.colors.gemGlow;
      this.borderColor = CONFIG.colors.gemBorder;
    } else {
      this.width = 20;
      this.height = 20;
      this.value = 100;
      this.color = CONFIG.colors.coin;
      this.glowColor = CONFIG.colors.coinGlow;
      this.borderColor = CONFIG.colors.coinBorder;
    }

    this.animTimer = Math.random() * Math.PI * 2;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.spinOffset = Math.random() * Math.PI * 2;
    this.twinkleTimer = 0.4 + Math.random() * 0.8;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  get currentY() {
    const bobAmplitude = this.type === 'gem' ? 5 : 4;
    const bobFrequency = this.type === 'gem' ? 3.0 : 3.6;
    return this.y + Math.sin(this.animTimer * bobFrequency + this.bobOffset) * bobAmplitude;
  }

  update(dt, particleSystem) {
    if (this.collected) return;
    this.animTimer += dt;

    if (this.type === 'gem') {
      this.twinkleTimer -= dt;
      if (this.twinkleTimer <= 0) {
        this.twinkleTimer = 0.6 + Math.random() * 0.8;
        if (particleSystem) {
          particleSystem.emit(
            this.centerX + (Math.random() - 0.5) * 16,
            this.currentY + this.height / 2 + (Math.random() - 0.5) * 16,
            1,
            {
              color: '#ffffff',
              sizeMin: 1.5,
              sizeMax: 3.5,
              speedMin: 6,
              speedMax: 20,
              lifeMin: 0.25,
              lifeMax: 0.5,
              gravity: -15,
            }
          );
        }
      }
    }
  }

  checkCollision(player) {
    if (this.collected) return false;
    const curY = this.currentY;
    return (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < curY + this.height &&
      player.y + player.height > curY
    );
  }

  collect(particleSystem, floatingTexts) {
    if (this.collected) return 0;
    this.collected = true;

    const curCenterY = this.currentY + this.height / 2;
    if (particleSystem) {
      particleSystem.emitCollect(
        this.centerX,
        curCenterY,
        this.color,
        this.type === 'gem' ? 24 : 16
      );
    }
    if (floatingTexts) {
      floatingTexts.add(
        this.centerX,
        curCenterY - 12,
        `+${this.value}`,
        this.type === 'gem' ? '#e879f9' : '#fbbf24'
      );
    }
    if (this.type === 'gem') {
      SoundManager.playGem();
    } else {
      SoundManager.playCoin();
    }
    return this.value;
  }

  draw(ctx) {
    if (this.collected) return;

    ctx.save();
    const curY = this.currentY;
    const cx = this.x + this.width / 2;
    const cy = curY + this.height / 2;

    ctx.translate(cx, cy);

    if (this.type === 'coin') {
      this.drawCoin(ctx);
    } else {
      this.drawGem(ctx);
    }

    ctx.restore();
  }

  drawCoin(ctx) {
    const spin = Math.cos(this.animTimer * 3.6 + this.spinOffset);
    const scaleX = Math.abs(spin) * 0.75 + 0.25;
    const facingFront = spin >= 0;

    // Glowing aura
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(scaleX, 1);

    // Outer coin rim
    const grad = ctx.createLinearGradient(-10, -10, 10, 10);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.4, '#fbbf24');
    grad.addColorStop(1, '#d97706');

    ctx.fillStyle = grad;
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner rim line
    ctx.beginPath();
    ctx.arc(0, 0, 6.8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.65)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner emblem / star
    if (scaleX > 0.4) {
      ctx.fillStyle = facingFront ? '#ffffff' : '#fef08a';
      ctx.beginPath();
      const rOuter = 3.6;
      const rInner = 1.6;
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? rOuter : rInner;
        const angle = (i * Math.PI) / 4;
        const sx = Math.cos(angle) * r;
        const sy = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  drawGem(ctx) {
    const pulse = 1 + Math.sin(this.animTimer * 4 + this.spinOffset) * 0.08;
    ctx.scale(pulse, pulse);

    // Glowing Aura
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();

    const w = 11.5;
    const h = 13.5;
    const topW = 6.5;
    const topH = 4.5;

    const grad = ctx.createLinearGradient(-w, -h, w, h);
    grad.addColorStop(0, '#f5d0fe');
    grad.addColorStop(0.35, '#c084fc');
    grad.addColorStop(1, '#7e22ce');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#fae8ff';
    ctx.lineWidth = 1.3;

    ctx.beginPath();
    ctx.moveTo(-topW, -h + topH);
    ctx.lineTo(topW, -h + topH);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, h);
    ctx.lineTo(-w, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(-topW, -h + topH);
    ctx.lineTo(0, -h + topH + 2.5);
    ctx.lineTo(topW, -h + topH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(0, -h + topH + 2.5);
    ctx.lineTo(w, 0);
    ctx.moveTo(0, -h + topH + 2.5);
    ctx.lineTo(0, h);
    ctx.stroke();

    const glintAlpha = 0.5 + Math.sin(this.animTimer * 5) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${glintAlpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(-topW * 0.4, -h + topH + 1.2, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =============================================================================
// 9. ENEMY SYSTEM (WALKERS & FLYERS)
// =============================================================================
class Enemy {
  constructor(config) {
    this.type = config.type; // 'walker' | 'flyer'
    this.startX = config.x;
    this.startY = config.y;
    this.x = config.x;
    this.y = config.y;
    this.isDead = false;

    if (this.type === 'flyer') {
      this.width = 24;
      this.height = 28;
      this.rangeX = config.rangeX !== undefined ? config.rangeX : 800;
    } else {
      this.width = 30;
      this.height = 42;
    }

    this.speed = config.speed || 100;
    this.vx = this.speed;
    this.vy = 0;
    this.facing = 1;

    if (this.type === 'walker') {
      this.platform = config.platform;
      if (this.platform) {
        this.y = this.platform.y - this.height;
        this.startY = this.y;
        const inset = 40;
        const minX = this.platform.x + inset;
        const maxX = this.platform.x + this.platform.width - this.width - inset;
        this.startX = Math.max(minX, Math.min(maxX, this.startX));
        this.x = this.startX;
      }
    }

    this.scaleX = 1;
    this.scaleY = 1;
    this.walkAnimTimer = 0;
    this.blinkTimer = 2.0 + Math.random() * 2.0;
    this.isBlinking = false;
    this.hoverTimer = Math.random() * Math.PI * 2;
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = this.speed;
    this.vy = 0;
    this.facing = 1;
    this.isDead = false;
    this.scaleX = 1;
    this.scaleY = 1;
    this.walkAnimTimer = 0;
    this.hoverTimer = Math.random() * Math.PI * 2;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  update(dt, player) {
    if (this.isDead) return;

    if (this.type === 'walker') {
      this.x += this.vx * dt;
      if (this.platform) {
        const inset = 40;
        const minX = this.platform.x + inset;
        const maxX = this.platform.x + this.platform.width - this.width - inset;
        if (this.x <= minX) {
          this.x = minX;
          this.vx = this.speed;
          this.facing = 1;
        } else if (this.x >= maxX) {
          this.x = maxX;
          this.vx = -this.speed;
          this.facing = -1;
        }
      }
      this.walkAnimTimer += dt * 10;
    } else if (this.type === 'flyer') {
      let targetX = this.startX;
      let targetY = this.startY;

      if (player) {
        const dxToPlayer = player.centerX - this.centerX;
        const dyToPlayer = player.centerY - this.centerY;
        const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

        const detectRadius = 800;
        if (distToPlayer < detectRadius) {
          targetX = player.centerX;
          targetY = player.centerY;
        }
      }

      const dxToTarget = targetX - this.centerX;
      const dyToTarget = targetY - this.centerY;
      const distToTarget = Math.sqrt(dxToTarget * dxToTarget + dyToTarget * dyToTarget);

      if (distToTarget > 2) {
        const vx = (dxToTarget / distToTarget) * this.speed;
        const vy = (dyToTarget / distToTarget) * this.speed;
        this.x += vx * dt;
        this.y += vy * dt;
        this.facing = vx > 0 ? 1 : -1;
      } else {
        this.hoverTimer += dt * 4;
        this.y += Math.sin(this.hoverTimer) * 0.5;
      }

      // Clamp distance from anchor
      const dxFromStart = this.centerX - this.startX;
      const dyFromStart = this.centerY - this.startY;
      const distFromStart = Math.sqrt(dxFromStart * dxFromStart + dyFromStart * dyFromStart);
      const maxRadius = this.rangeX;

      if (distFromStart > maxRadius) {
        const angle = Math.atan2(dyFromStart, dxFromStart);
        this.x = this.startX + Math.cos(angle) * maxRadius - this.width / 2;
        this.y = this.startY + Math.sin(angle) * maxRadius - this.height / 2;
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

  draw(ctx) {
    if (this.isDead) return;

    ctx.save();
    const bottomCenterX = this.centerX;
    const bottomCenterY = this.y + this.height;

    let walkOffset = 0;
    if (this.type === 'walker') {
      walkOffset = Math.sin(this.walkAnimTimer) * 2;
    }

    ctx.translate(bottomCenterX, bottomCenterY + walkOffset);
    ctx.scale(this.scaleX, this.scaleY);

    const w = this.width;
    const h = this.height;
    const cornerRadius = this.type === 'flyer' ? 5 : 8;

    // Enemy drop shadow
    ctx.fillStyle = CONFIG.colors.enemyGlow;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body Gradient
    const bodyGradient = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
    bodyGradient.addColorStop(0, CONFIG.colors.enemyBodyLight);
    bodyGradient.addColorStop(1, CONFIG.colors.enemyBody);

    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = '#7e22ce';
    ctx.lineWidth = 2;

    this.drawRoundedRect(ctx, -w / 2, -h, w, h, cornerRadius);
    ctx.fill();
    ctx.stroke();

    // Procedural Animated Eyes
    if (!this.isBlinking) {
      const eyeLookOffset = this.facing * (this.type === 'flyer' ? 2.5 : 3.5);
      const eyeY = -h * 0.65;
      const eyeSpacing = this.type === 'flyer' ? 4 : 6;
      const eyeRadius = this.type === 'flyer' ? 2 : 3;

      ctx.fillStyle = CONFIG.colors.enemyEye;

      // Left Eye
      ctx.beginPath();
      ctx.arc(eyeLookOffset - eyeSpacing / 2, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Right Eye
      ctx.beginPath();
      ctx.arc(eyeLookOffset + eyeSpacing / 2 + (this.type === 'flyer' ? 1 : 2), eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = CONFIG.colors.enemyEye;
      ctx.lineWidth = 2;
      const eyeY = -h * 0.65;
      ctx.beginPath();
      ctx.moveTo(-5 + this.facing * 2, eyeY);
      ctx.lineTo(7 + this.facing * 2, eyeY);
      ctx.stroke();
    }

    // Enemy Horns / Crown Accent
    ctx.fillStyle = CONFIG.colors.enemyHat;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -h);
    ctx.lineTo(-w * 0.15, -h - 6);
    ctx.lineTo(0, -h);
    ctx.lineTo(w * 0.15, -h - 6);
    ctx.lineTo(w * 0.3, -h);
    ctx.closePath();
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
// 10. PLAYER (PHYSICS, ANIMATION, HAT, HEALTH & I-FRAMES)
// =============================================================================
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 42;

    this.vx = 0;
    this.vy = 0;

    // Movement & Jump State
    this.isGrounded = false;
    this.wasGrounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.facing = 1;

    // Wall Jump & Slide State
    this.isTouchingWall = false;
    this.wallDir = 0; // -1: left, 1: right
    this.isWallSliding = false;
    this.wallCoyoteTimer = 0;
    this.lastWallDir = 0;

    // Platform riding
    this.standingPlatform = null;

    // Health & Damage
    this.maxHp = 3;
    this.hp = 3;
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 1.2;
    this.knockbackTimer = 0;

    // Squash & Stretch
    this.scaleX = 1;
    this.scaleY = 1;
    this.walkAnimTimer = 0;
    this.blinkTimer = 2.0 + Math.random() * 2.0;
    this.isBlinking = false;
  }

  takeDamage(amount = 1, fromX = 0, fromY = 0, particleSystem = null, camera = null) {
    if (this.invulnerableTimer > 0) return false;

    this.hp -= amount;
    this.invulnerableTimer = this.invulnerableDuration;
    this.knockbackTimer = 0.22;

    const kxDir = this.centerX < fromX ? -1 : 1;
    this.vx = kxDir * 280;
    this.vy = -340;
    this.isGrounded = false;
    this.standingPlatform = null;

    this.scaleX = 1.4;
    this.scaleY = 0.7;

    if (particleSystem) {
      particleSystem.emit(this.centerX, this.centerY, 18, {
        color: '#f43f5e',
        sizeMin: 3,
        sizeMax: 6,
        speedMin: 80,
        speedMax: 240,
        lifeMin: 0.35,
        lifeMax: 0.65,
        gravity: 400,
      });
    }
    if (camera) {
      camera.shake(0.3, 8);
    }
    SoundManager.playDamage();
    return true;
  }

  respawn(spawnPos, particleSystem) {
    this.x = spawnPos.x;
    this.y = spawnPos.y;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.wasGrounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isTouchingWall = false;
    this.isWallSliding = false;
    this.wallCoyoteTimer = 0;
    this.standingPlatform = null;
    this.hp = this.maxHp;
    this.invulnerableTimer = 0.5;
    this.knockbackTimer = 0;

    this.scaleX = 0.6;
    this.scaleY = 1.4;

    if (particleSystem) {
      particleSystem.emit(this.centerX, this.centerY, 24, {
        color: '#38bdf8',
        sizeMin: 3,
        sizeMax: 6,
        speedMin: 60,
        speedMax: 200,
        lifeMin: 0.4,
        lifeMax: 0.8,
        gravity: 100,
      });
    }
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  update(dt, input, platforms, bouncePads, particleSystem) {
    // 1. Timers
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dt;
    }

    if (this.isGrounded) {
      this.coyoteTimer = CONFIG.physics.coyoteTime;
    } else {
      this.coyoteTimer -= dt;
    }

    if (this.isTouchingWall && !this.isGrounded) {
      this.wallCoyoteTimer = CONFIG.physics.wallCoyoteTime;
      this.lastWallDir = this.wallDir;
    } else {
      this.wallCoyoteTimer -= dt;
    }

    if (input.jumpJustPressed) {
      this.jumpBufferTimer = CONFIG.physics.jumpBufferTime;
    } else {
      this.jumpBufferTimer -= dt;
    }

    // 2. Horizontal Movement
    if (this.knockbackTimer <= 0) {
      let targetVx = 0;
      if (input.left) {
        targetVx -= CONFIG.physics.moveSpeed;
        this.facing = -1;
      }
      if (input.right) {
        targetVx += CONFIG.physics.moveSpeed;
        this.facing = 1;
      }

      const accel = this.isGrounded ? CONFIG.physics.acceleration : CONFIG.physics.airAcceleration;
      const fric = this.isGrounded ? CONFIG.physics.friction : CONFIG.physics.airFriction;

      if (targetVx !== 0) {
        if (Math.sign(this.vx) !== Math.sign(targetVx) && this.vx !== 0) {
          this.vx += Math.sign(targetVx) * (accel + fric) * dt;
        } else {
          this.vx += Math.sign(targetVx) * accel * dt;
          if (Math.abs(this.vx) > CONFIG.physics.moveSpeed) {
            this.vx = targetVx;
          }
        }
      } else {
        if (this.vx > 0) {
          this.vx = Math.max(0, this.vx - fric * dt);
        } else if (this.vx < 0) {
          this.vx = Math.min(0, this.vx + fric * dt);
        }
      }
    }

    // 3. Wall Slide Detection & Physics
    this.isTouchingWall = false;
    this.wallDir = 0;
    const wallCheckDist = 3;

    for (const plat of platforms) {
      if (!plat.isSolid) continue;
      if (this.y + this.height > plat.y && this.y < plat.y + plat.height) {
        if (Math.abs(this.x + this.width - plat.x) <= wallCheckDist && (input.right || this.vx >= 0)) {
          this.isTouchingWall = true;
          this.wallDir = 1;
          break;
        }
        if (Math.abs(this.x - (plat.x + plat.width)) <= wallCheckDist && (input.left || this.vx <= 0)) {
          this.isTouchingWall = true;
          this.wallDir = -1;
          break;
        }
      }
    }

    this.isWallSliding = false;
    if (this.isTouchingWall && !this.isGrounded && this.vy > 0) {
      const pushingIntoWall = (this.wallDir === 1 && input.right) || (this.wallDir === -1 && input.left);
      if (pushingIntoWall) {
        this.isWallSliding = true;
        this.vy = CONFIG.physics.wallSlideSpeed;
        if (particleSystem && Math.random() < 0.35) {
          const dustX = this.wallDir === 1 ? this.x + this.width : this.x;
          particleSystem.emitDust(dustX, this.y + this.height - 4, -this.wallDir);
        }
      }
    }

    // 4. Jump & Wall Jump Execution
    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0) {
        this.vy = -CONFIG.physics.jumpForce;
        this.jumpBufferTimer = 0;
        this.coyoteTimer = 0;
        this.isGrounded = false;
        this.standingPlatform = null;
        this.scaleX = 0.7;
        this.scaleY = 1.35;
        if (particleSystem) particleSystem.emitDust(this.centerX, this.y + this.height);
        SoundManager.playJump();
      } else if (this.wallCoyoteTimer > 0) {
        const jumpWallDir = this.lastWallDir !== 0 ? this.lastWallDir : this.wallDir;
        this.vy = -CONFIG.physics.wallJumpForceY;
        this.vx = -jumpWallDir * CONFIG.physics.wallJumpForceX;
        this.facing = -jumpWallDir;
        this.jumpBufferTimer = 0;
        this.wallCoyoteTimer = 0;
        this.isWallSliding = false;
        this.scaleX = 0.7;
        this.scaleY = 1.35;
        if (particleSystem) {
          const dustX = jumpWallDir === 1 ? this.x + this.width : this.x;
          particleSystem.emitDust(dustX, this.centerY, -jumpWallDir);
        }
        SoundManager.playJump();
      }
    }

    // Variable jump cut
    if (!input.jump && this.vy < 0) {
      this.vy += CONFIG.physics.gravity * (1 - CONFIG.physics.jumpCutMultiplier) * dt * 2.5;
    }

    // 5. Gravity
    if (!this.isWallSliding) {
      this.vy += CONFIG.physics.gravity * dt;
      if (this.vy > CONFIG.physics.terminalVelocity) {
        this.vy = CONFIG.physics.terminalVelocity;
      }
    }

    // 6. Moving platform rider momentum carry
    if (this.standingPlatform && this.standingPlatform.isSolid) {
      this.x += this.standingPlatform.deltaX;
      this.y += this.standingPlatform.deltaY;
    }

    // 7. Horizontal Move & Collision Resolution
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

    // 8. Vertical Move, Bounce Pads & Platform Collision Resolution
    this.wasGrounded = this.isGrounded;
    this.isGrounded = false;
    this.y += this.vy * dt;

    // Check Bounce Pads
    if (bouncePads) {
      for (const pad of bouncePads) {
        if (this.checkCollision(this, pad)) {
          if (this.vy >= 0 && this.y + this.height - this.vy * dt <= pad.y + 14) {
            pad.trigger();
            this.vy = -pad.bounceForce;
            this.y = pad.y - this.height;
            this.isGrounded = false;
            this.standingPlatform = null;
            this.scaleX = 0.45;
            this.scaleY = 2.3;

            const particleColor = pad.type === 'spring' ? CONFIG.colors.springBody : CONFIG.colors.padGlowPurple;
            if (particleSystem) {
              particleSystem.emit(pad.x + pad.width / 2, pad.y, 16, {
                color: particleColor,
                sizeMin: 3,
                sizeMax: 7,
                speedMin: 150,
                speedMax: 320,
                lifeMin: 0.35,
                lifeMax: 0.75,
                angleMin: -Math.PI * 0.75,
                angleMax: -Math.PI * 0.25,
                gravity: 150
              });
            }
            SoundManager.playBoing();
          }
        }
      }
    }

    let landedThisFrame = false;
    for (const plat of platforms) {
      if (!plat.isSolid) continue;
      if (this.checkCollision(this, plat)) {
        if (this.vy > 0) {
          this.y = plat.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
          this.standingPlatform = plat;
          plat.stepOn();

          if (!this.wasGrounded && !landedThisFrame) {
            landedThisFrame = true;
            this.scaleX = 1.35;
            this.scaleY = 0.7;
            if (particleSystem) particleSystem.emitDust(this.centerX, this.y + this.height);
            SoundManager.playLand();
          }
        } else if (this.vy < 0) {
          this.y = plat.y + plat.height;
          this.vy = 0;
        }
      }
    }

    if (!this.isGrounded) {
      this.standingPlatform = null;
    }

    // 9. Procedural Animation
    this.scaleX += (1 - this.scaleX) * 12 * dt;
    this.scaleY += (1 - this.scaleY) * 12 * dt;

    if (this.isGrounded && Math.abs(this.vx) > 20) {
      this.walkAnimTimer += dt * 12;
    } else {
      this.walkAnimTimer = 0;
    }

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
    // i-frame flashing
    if (this.invulnerableTimer > 0) {
      const flash = Math.floor(this.invulnerableTimer * 20) % 2 === 0;
      if (flash) return;
    }

    ctx.save();
    const bottomCenterX = this.centerX;
    const bottomCenterY = this.y + this.height;

    let walkOffset = 0;
    if (this.isGrounded && Math.abs(this.vx) > 20) {
      walkOffset = Math.sin(this.walkAnimTimer) * 2;
    }

    ctx.translate(bottomCenterX, bottomCenterY + walkOffset);
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
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;

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

      // Eye shine
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

    // Procedural Animated Hat
    this.drawHat(ctx, w, h);

    ctx.restore();
  }

  drawHat(ctx, w, h) {
    ctx.save();
    const headTopY = -h;
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

    // 2. Hat Crown
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

    // 3. Hat Band
    ctx.fillStyle = CONFIG.colors.playerHatBand;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.drawRoundedRect(ctx, -crownWidth / 2 + 1, -4.5, crownWidth - 2, 4, 1.5);
    ctx.fill();
    ctx.stroke();

    // 4. Pom-pom / Star on Top
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
// 11. CAMERA SYSTEM
// =============================================================================
class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    // Shake
    this.shakeTimer = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  snapTo(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  shake(duration = 0.25, intensity = 6) {
    this.shakeDuration = duration;
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  update(dt, player) {
    this.targetX = player.centerX + player.facing * CONFIG.camera.lookAheadDist;
    this.targetY = player.centerY + CONFIG.camera.verticalOffset;

    const t = 1 - Math.exp(-CONFIG.camera.lerpSpeed * dt);
    this.x += (this.targetX - this.x) * t;
    this.y += (this.targetY - this.y) * t;

    // Screen Shake update
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = this.shakeTimer / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * progress;
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * 2 * currentIntensity;
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
// 12. CHECKPOINT SYSTEM
// =============================================================================
class Checkpoint {
  constructor(config) {
    this.id = config.id;
    this.x = config.x;
    this.y = config.y;
    this.label = config.label || 'Checkpoint';
    this.isActive = !!config.isActive;
    this.isBaseCamp = !!config.isBaseCamp;

    this.flagWidth = 28;
    this.flagHeight = 18;
    this.poleHeight = 44;

    this.spawnPoint = {
      x: this.x + 8,
      y: this.y - 44,
    };

    this.triggerBounds = {
      x: this.x - 30,
      y: this.y - 50,
      width: 76,
      height: 60,
    };

    this.waveTimer = Math.random() * Math.PI * 2;
    this.ambientTimer = 0;
    this.isNearPlayer = false;
    this.promptScale = 0;
  }

  update(dt, player, particleSystem) {
    this.waveTimer += dt * 3.5;

    // Proximity check
    this.isNearPlayer = (
      player.x < this.triggerBounds.x + this.triggerBounds.width &&
      player.x + player.width > this.triggerBounds.x &&
      player.y < this.triggerBounds.y + this.triggerBounds.height &&
      player.y + player.height > this.triggerBounds.y
    );

    const targetPromptScale = (this.isNearPlayer && !this.isActive) ? 1 : 0;
    this.promptScale += (targetPromptScale - this.promptScale) * 10 * dt;

    if (this.isActive && particleSystem) {
      this.ambientTimer += dt;
      if (this.ambientTimer >= 0.25) {
        this.ambientTimer = 0;
        particleSystem.emitCheckpointAmbient(this.x + 4, this.y - 36);
      }
    }
  }

  activate(particleSystem) {
    if (this.isActive) return false;
    this.isActive = true;
    if (particleSystem) {
      particleSystem.emitCheckpointSparkles(this.x + 4, this.y - 34);
    }
    return true;
  }

  draw(ctx) {
    ctx.save();
    const poleX = this.x + 4;
    const poleBaseY = this.y;
    const poleTopY = this.y - this.poleHeight;

    // Flagpole base plate
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(poleX, poleBaseY, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flagpole
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(poleX, poleBaseY);
    ctx.lineTo(poleX, poleTopY);
    ctx.stroke();

    // Golden Finial Ball on Top
    ctx.fillStyle = this.isActive ? '#fbbf24' : '#cbd5e1';
    ctx.beginPath();
    ctx.arc(poleX, poleTopY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Waving Cloth Flag
    const flagColor = this.isActive ? CONFIG.colors.checkpointActive : CONFIG.colors.checkpointInactive;
    const segments = 6;
    const segW = this.flagWidth / segments;

    ctx.fillStyle = flagColor;
    ctx.beginPath();
    ctx.moveTo(poleX, poleTopY + 2);

    // Top wavy edge
    for (let i = 0; i <= segments; i++) {
      const segX = poleX + i * segW;
      const wave = Math.sin(this.waveTimer + i * 0.9) * (2 + i * 0.6);
      ctx.lineTo(segX, poleTopY + 2 + wave);
    }

    // Bottom wavy edge
    for (let i = segments; i >= 0; i--) {
      const segX = poleX + i * segW;
      const wave = Math.sin(this.waveTimer + i * 0.9) * (2 + i * 0.6);
      ctx.lineTo(segX, poleTopY + 2 + this.flagHeight + wave);
    }

    ctx.closePath();
    ctx.fill();

    // Interactive [F] Key Prompt
    if (this.promptScale > 0.05) {
      ctx.save();
      const promptX = poleX + 16;
      const promptY = poleTopY - 14;

      ctx.translate(promptX, promptY);
      ctx.scale(this.promptScale, this.promptScale);

      // Prompt Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-24, -12, 48, 24, 6);
      ctx.fill();
      ctx.stroke();

      // Key icon text
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('[F]', 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }
}

// =============================================================================
// 13. GOAL ZONE (FINISH LINE ON PEAK)
// =============================================================================
class GoalZone {
  constructor(config) {
    this.x = config.x || 1270;
    this.y = config.y || 16;
    this.width = config.width || 80;
    this.height = config.height || 64;
    this.animTimer = 0;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  update(dt, particleSystem) {
    this.animTimer += dt * 3;
    if (particleSystem && Math.random() < 0.2) {
      particleSystem.emitSparkle(
        this.x + Math.random() * this.width,
        this.y + Math.random() * this.height,
        Math.random() < 0.5 ? '#fbbf24' : '#38bdf8'
      );
    }
  }

  draw(ctx) {
    ctx.save();
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;

    // Glowing finish aura
    const glowGrad = ctx.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, w / 2 + 20);
    glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
    glowGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.12)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(x - 20, y - 20, w + 40, h + 40);

    // Left and Right Finish Posts
    const postWidth = 6;
    [x, x + w - postWidth].forEach((px) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px, y, postWidth, h);

      // Checkered pattern on posts
      ctx.fillStyle = '#0f172a';
      for (let py = y; py < y + h; py += 10) {
        ctx.fillRect(px, py, postWidth, 5);
      }
    });

    // Checkered Finish Ribbon / Banner Across Top
    const ribbonH = 14;
    const squares = 8;
    const sqW = w / squares;

    for (let i = 0; i < squares; i++) {
      ctx.fillStyle = (i % 2 === 0) ? '#ffffff' : '#0f172a';
      ctx.fillRect(x + i * sqW, y, sqW, ribbonH / 2);
      ctx.fillStyle = (i % 2 === 1) ? '#ffffff' : '#0f172a';
      ctx.fillRect(x + i * sqW, y + ribbonH / 2, sqW, ribbonH / 2);
    }

    // Golden Finish Trophy floating in center
    const trophyY = y + 24 + Math.sin(this.animTimer) * 3;
    ctx.fillStyle = '#fbbf24';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', x + w / 2, trophyY);

    ctx.restore();
  }
}

// =============================================================================
// 14. WORLD & SCENE PLATFORMS
// =============================================================================
class World {
  constructor() {
    this.platforms = [
      // 0. Wall Jump Shaft / Left Barrier
      new Platform({ x: -100, y: -40, width: 60, height: 420, label: 'Wall Left' }),
      new Platform({ x: -10, y: 160, width: 30, height: 180, label: 'Wall Shaft' }),

      // 1. Spawn Ground
      new Platform({ x: 40, y: 340, width: 380, height: 40, label: 'Base Camp' }),

      // 2. High Floating Island
      new Platform({ x: 480, y: 260, width: 140, height: 26 }),

      // 3. Horizontally Moving Platform
      new Platform({
        x: 680, y: 200, width: 130, height: 24,
        type: 'moving',
        rangeX: 90,
        speed: 1.5,
        label: 'Moving East'
      }),

      // 4. Stepping Island
      new Platform({ x: 910, y: 140, width: 130, height: 24 }),

      // 5. Crumbling Stepping Stones
      new Platform({
        x: 1090, y: 90, width: 65, height: 22,
        type: 'crumbling',
        shakeDuration: 0.6,
        label: 'Crumb 1'
      }),
      new Platform({
        x: 1180, y: 70, width: 65, height: 22,
        type: 'crumbling',
        shakeDuration: 0.55,
        label: 'Crumb 2'
      }),

      // 6. Grand Peak (Goal Zone)
      new Platform({ x: 1270, y: 80, width: 180, height: 32, label: 'The Peak' }),

      // 7. Descending Upper Route
      new Platform({ x: 1500, y: 140, width: 140, height: 24 }),
      new Platform({ x: 1690, y: 210, width: 130, height: 24 }),

      // 8. Lower Path Runway
      new Platform({ x: 1870, y: 260, width: 440, height: 36, label: 'Runway' }),

      // 9. Vertically Oscillating Elevator
      new Platform({
        x: 1040, y: 280, width: 120, height: 24,
        type: 'moving',
        rangeY: 80,
        speed: 1.8,
        label: 'Elevator'
      }),

      // 10. Lower Gap Bridge Platform
      new Platform({ x: 1420, y: 380, width: 180, height: 26, label: 'Lower Path' }),

      // 11. Oscillating & Crumbling Hybrid Gauntlet Platforms
      new Platform({
        x: 740, y: 60, width: 120, height: 24,
        type: 'moving_crumbling',
        rangeX: 60,
        speed: 1.6,
        label: 'Gauntlet 1'
      }),
      new Platform({
        x: 500, y: 80, width: 100, height: 24,
        type: 'moving_crumbling',
        rangeY: 50,
        speed: 1.4,
        label: 'Gauntlet 2'
      }),
      new Platform({ x: 280, y: 140, width: 120, height: 24, label: 'High Overlook' }),
      new Platform({ x: 1350, y: -160, width: 220, height: 30, label: 'Space Peak' }),
    ];

    // Springs and Neon Bounce Pads
    this.bouncePads = [
      new BouncePad(320, 340 - 20, 'spring'),
      new BouncePad(640, 380 - 20, 'pad'),
      new BouncePad(1510, 380 - 20, 'spring'),
      new BouncePad(2100, 260 - 20, 'pad'),
    ];

    // Spike Hazards
    this.hazards = [
      new SpikeHazard({ x: 530, y: 260 - 16, width: 40, height: 16, count: 3 }),
      new SpikeHazard({ x: 960, y: 140 - 16, width: 32, height: 16, count: 2 }),
      new SpikeHazard({ x: 1550, y: 140 - 16, width: 40, height: 16, count: 3 }),
      new SpikeHazard({ x: 1980, y: 260 - 16, width: 48, height: 16, count: 4 }),
      new SpikeHazard({ x: 330, y: 140 - 16, width: 32, height: 16, count: 2 }),
    ];

    // Collectibles (Coins & Gems)
    this.collectibles = this.createCollectibles();

    // Interactive Checkpoints
    this.checkpoints = [
      new Checkpoint({ id: 'base', x: 220, y: 340, label: 'Base Camp', isBaseCamp: true, isActive: true }),
      new Checkpoint({ id: 'mid', x: 930, y: 140, label: 'Mid Ridge', isActive: false }),
      new Checkpoint({ id: 'peak', x: 1400, y: 80, label: 'High Peak', isActive: false }),
      new Checkpoint({ id: 'runway', x: 2150, y: 260, label: 'Far Runway', isActive: false }),
    ];
  }

  createCollectibles() {
    return [
      new Collectible(180, 295, 'coin'),
      new Collectible(250, 295, 'coin'),
      new Collectible(320, 295, 'coin'),
      new Collectible(415, 260, 'coin'),
      new Collectible(445, 220, 'coin'),
      new Collectible(540, 235, 'coin'),
      new Collectible(750, 175, 'coin'),
      new Collectible(980, 105, 'coin'),
      new Collectible(1185, 35, 'coin'),
      new Collectible(1260, 25, 'gem'),
      new Collectible(1340, 35, 'coin'),
      new Collectible(1240, 275, 'coin'),
      new Collectible(1520, 335, 'coin'),
      new Collectible(1790, 255, 'coin'),
      new Collectible(2010, 195, 'coin'),
      new Collectible(2110, 195, 'coin'),
      new Collectible(2220, 185, 'gem'),
      new Collectible(790, 15, 'coin'),
      new Collectible(540, 30, 'gem'),
      new Collectible(330, 90, 'coin'),
    ];
  }

  resetCollectibles() {
    this.collectibles = this.createCollectibles();
  }

  update(dt, player, particleSystem, input, onCheckpointActivated) {
    // 1. Update platforms
    for (const plat of this.platforms) {
      plat.update(dt, particleSystem);
    }

    // 2. Update Bounce Pads
    for (const pad of this.bouncePads) {
      pad.update(dt);
    }

    // 3. Update Collectibles
    for (const c of this.collectibles) {
      c.update(dt, particleSystem);
    }

    // 4. Update Hazards
    for (const h of this.hazards) {
      h.update(dt);
    }

    // 5. Update Checkpoints
    for (const cp of this.checkpoints) {
      cp.update(dt, player, particleSystem);
      if (cp.isNearPlayer && input.interactJustPressed && !cp.isActive) {
        for (const otherCp of this.checkpoints) {
          otherCp.isActive = false;
        }
        cp.activate(particleSystem);
        if (onCheckpointActivated) {
          onCheckpointActivated(cp);
        }
      }
    }
  }

  draw(ctx, player) {
    // 1. Draw platform motion tracks
    this.drawMotionTracks(ctx);

    // 2. Draw platforms
    for (const plat of this.platforms) {
      plat.draw(ctx);
    }

    // 3. Draw Bounce Pads
    for (const pad of this.bouncePads) {
      pad.draw(ctx);
    }

    // 4. Draw Collectibles
    for (const c of this.collectibles) {
      c.draw(ctx);
    }

    // 5. Draw Spike Hazards
    for (const h of this.hazards) {
      h.draw(ctx);
    }

    // 6. Draw Checkpoints
    for (const cp of this.checkpoints) {
      cp.draw(ctx);
    }
  }

  drawMotionTracks(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);

    for (const plat of this.platforms) {
      if (plat.type === 'moving' || plat.type === 'moving_crumbling') {
        if (plat.rangeX !== 0) {
          ctx.beginPath();
          ctx.moveTo(plat.startX - plat.rangeX + plat.width / 2, plat.y + plat.height / 2);
          ctx.lineTo(plat.startX + plat.rangeX + plat.width / 2, plat.y + plat.height / 2);
          ctx.stroke();
        }
        if (plat.rangeY !== 0) {
          ctx.beginPath();
          ctx.moveTo(plat.x + plat.width / 2, plat.startY - plat.rangeY + plat.height / 2);
          ctx.lineTo(plat.x + plat.width / 2, plat.startY + plat.rangeY + plat.height / 2);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}

// =============================================================================
// 15. GAME ENGINE & LOOP
// =============================================================================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.statsDisplay = document.getElementById('statsDisplay');
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.timerDisplay = document.getElementById('timerDisplay');
    this.bestTimeDisplay = document.getElementById('bestTimeDisplay');
    this.heartsContainer = document.getElementById('heartsContainer');
    this.healthBarFill = document.getElementById('healthBarFill');
    this.victoryOverlay = document.getElementById('victoryOverlay');
    this.victoryTime = document.getElementById('victoryTime');
    this.victoryBest = document.getElementById('victoryBest');
    this.recordAlert = document.getElementById('recordAlert');

    this.input = new InputManager();
    this.particleSystem = new ParticleSystem();
    this.floatingTexts = new FloatingTextSystem();
    this.world = new World();
    this.player = new Player(CONFIG.world.spawnPoint.x, CONFIG.world.spawnPoint.y);
    this.camera = new Camera(CONFIG.canvas.width, CONFIG.canvas.height);

    // Goal Zone finish line on the Peak
    this.goalZone = new GoalZone({ x: 1270, y: 16, width: 80, height: 64 });

    // Speedrun Stopwatch State
    this.timerState = 'READY'; // 'READY' | 'RUNNING' | 'FINISHED'
    this.runTime = 0.0;
    this.bestTime = this.loadBestTime();

    // Checkpoint & Respawn state
    this.currentCheckpoint = this.world.checkpoints.find(c => c.isActive) || this.world.checkpoints[0];
    this.currentSpawnPoint = this.currentCheckpoint ? { ...this.currentCheckpoint.spawnPoint } : { ...CONFIG.world.spawnPoint };

    // Snap player & camera
    this.player.x = this.currentSpawnPoint.x;
    this.player.y = this.currentSpawnPoint.y;
    this.camera.snapTo(this.player.centerX, this.player.centerY);

    // Enemies (Walkers on platforms, Flyers in air)
    this.enemies = [
      new Enemy({ type: 'walker', platform: this.world.platforms[1], x: 220, speed: 70 }),
      new Enemy({ type: 'walker', platform: this.world.platforms[4], x: 940, speed: 85 }),
      new Enemy({ type: 'walker', platform: this.world.platforms[9], x: 2050, speed: 110 }),
      new Enemy({ type: 'flyer', x: 580, y: 390, rangeX: 800, speed: 110 }),
      new Enemy({ type: 'flyer', x: 1050, y: 390, rangeX: 800, speed: 115 }),
      new Enemy({ type: 'flyer', x: 1850, y: 90, rangeX: 800, speed: 110 }),
      new Enemy({ type: 'flyer', x: 280, y: 30, rangeX: 800, speed: 95 }),
    ];

    // Collectibles & Score
    this.score = 0;
    this.collectedCount = 0;
    this.totalCollectibles = this.world.collectibles.length;
    this.killsCount = 0;

    // Checkpoint activation banner
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
    this.updateHealthUI(true);
    this.updateScoreDisplay();

    // Start Game Loop
    requestAnimationFrame((time) => this.loop(time));
  }

  loadBestTime() {
    try {
      const stored = localStorage.getItem('platformer_best_time');
      return stored ? parseFloat(stored) : null;
    } catch (e) {
      return null;
    }
  }

  saveBestTime(time) {
    try {
      localStorage.setItem('platformer_best_time', time.toString());
      this.bestTime = time;
    } catch (e) {}
  }

  formatTime(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '--:--.--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  }

  updateHUD() {
    if (this.statsDisplay) {
      const cpName = this.currentCheckpoint ? this.currentCheckpoint.label : 'Base Camp';
      this.statsDisplay.textContent = `FPS: ${this.fps} | Respawns: ${this.respawnCount} | Kills: ${this.killsCount} | Flag: ${cpName}`;
    }
    if (this.timerDisplay && this.timerState !== 'RUNNING') {
      this.timerDisplay.textContent = this.formatTime(this.runTime);
    }
    if (this.bestTimeDisplay) {
      this.bestTimeDisplay.textContent = `🏆 PB: ${this.formatTime(this.bestTime)}`;
    }
  }

  updateScoreDisplay(animate = false) {
    if (this.scoreDisplay) {
      this.scoreDisplay.innerHTML = `🪙 Score: ${this.score} &nbsp;|&nbsp; ${this.collectedCount}/${this.totalCollectibles}`;
      if (animate) {
        this.scoreDisplay.classList.remove('pop');
        void this.scoreDisplay.offsetWidth;
        this.scoreDisplay.classList.add('pop');
      }
    }
  }

  updateHealthUI(forceRebuild = false) {
    if (this.heartsContainer) {
      if (forceRebuild || this.heartsContainer.children.length !== this.player.maxHp) {
        this.heartsContainer.innerHTML = '';
        for (let i = 0; i < this.player.maxHp; i++) {
          const heartDiv = document.createElement('div');
          heartDiv.className = 'heart-icon';
          heartDiv.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
          this.heartsContainer.appendChild(heartDiv);
        }
      }

      const hearts = this.heartsContainer.children;
      for (let i = 0; i < hearts.length; i++) {
        if (i < this.player.hp) {
          hearts[i].classList.remove('empty');
        } else {
          hearts[i].classList.add('empty');
        }
      }
    }

    if (this.healthBarFill) {
      const pct = Math.max(0, Math.min(1, this.player.hp / this.player.maxHp)) * 100;
      this.healthBarFill.style.width = `${pct}%`;
      if (pct <= 34) {
        this.healthBarFill.classList.add('low');
      } else {
        this.healthBarFill.classList.remove('low');
      }
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

  completeRun() {
    if (this.timerState === 'FINISHED') return;
    this.timerState = 'FINISHED';

    const isNewPB = this.bestTime === null || this.runTime < this.bestTime;
    if (isNewPB) {
      this.saveBestTime(this.runTime);
    }

    if (this.victoryOverlay) {
      if (this.victoryTime) this.victoryTime.textContent = this.formatTime(this.runTime);
      if (this.victoryBest) this.victoryBest.textContent = this.formatTime(this.bestTime);
      if (this.recordAlert) {
        if (isNewPB) this.recordAlert.classList.remove('hidden');
        else this.recordAlert.classList.add('hidden');
      }
      this.victoryOverlay.classList.remove('hidden');
    }

    this.particleSystem.emitConfetti(this.player.centerX, this.player.centerY, 50);
    SoundManager.playFanfare();
    this.updateHUD();
  }

  resetRun() {
    this.timerState = 'READY';
    this.runTime = 0.0;
    if (this.victoryOverlay) {
      this.victoryOverlay.classList.add('hidden');
    }
    this.updateHUD();
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
      }
    }

    // Update World (Platforms + Bounce Pads + Collectibles + Checkpoints)
    this.world.update(dt, this.player, this.particleSystem, this.input, (activatedCheckpoint) => {
      this.currentCheckpoint = activatedCheckpoint;
      this.currentSpawnPoint = { ...activatedCheckpoint.spawnPoint };
      this.showCheckpointBanner('CHECKPOINT ACTIVATED!', activatedCheckpoint.label);
      SoundManager.playCheckpoint();
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
    this.player.update(dt, this.input, this.world.platforms, this.world.bouncePads, this.particleSystem);

    // Update Floating Text popups
    this.floatingTexts.update(dt);

    // Check Collectibles collision
    for (const c of this.world.collectibles) {
      if (c.checkCollision(this.player)) {
        const val = c.collect(this.particleSystem, this.floatingTexts);
        if (val > 0) {
          this.score += val;
          this.collectedCount++;
          this.updateScoreDisplay(true);
        }
      }
    }

    // Update Enemies & Check Player-Enemy Collisions
    for (const enemy of this.enemies) {
      enemy.update(dt, this.player);
      if (!enemy.isDead) {
        if (this.player.checkCollision(this.player, enemy)) {
          const playerBottom = this.player.y + this.player.height;
          const enemyTop = enemy.y;
          const isFalling = this.player.vy >= 0;
          const wasAbove = (playerBottom - this.player.vy * dt) <= (enemyTop + 14);

          if (isFalling && wasAbove) {
            // Stomp kill!
            enemy.isDead = true;
            this.killsCount++;
            this.player.vy = -CONFIG.physics.jumpForce * 0.8;
            this.player.scaleX = 0.8;
            this.player.scaleY = 1.4;

            this.particleSystem.emit(enemy.centerX, enemy.centerY, 20, {
              color: CONFIG.colors.enemyBody,
              sizeMin: 3,
              sizeMax: 8,
              speedMin: 80,
              speedMax: 240,
              lifeMin: 0.35,
              lifeMax: 0.75,
            });
            this.floatingTexts.add(enemy.centerX, enemy.centerY - 10, '+KILL', '#c084fc');
            SoundManager.playStomp();
            this.updateHUD();
          } else {
            // Touch damage
            const tookDamage = this.player.takeDamage(
              1,
              enemy.centerX,
              enemy.centerY,
              this.particleSystem,
              this.camera
            );
            if (tookDamage) {
              this.updateHealthUI();
              if (this.player.hp <= 0) {
                this.triggerRespawn();
                break;
              }
            }
          }
        }
      }
    }

    // Spike Hazard Collision Detection
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
    this.resetRun();
    // Revive all enemies
    for (const enemy of this.enemies) {
      enemy.reset();
    }
    const spawnPos = this.currentSpawnPoint || CONFIG.world.spawnPoint;
    this.player.respawn(spawnPos, this.particleSystem);
    this.updateHUD();
    this.updateHealthUI(true);
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Clear Screen & Draw Parallax Sky Background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
    skyGradient.addColorStop(0, CONFIG.colors.skyTop);
    skyGradient.addColorStop(1, CONFIG.colors.skyBottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, w, h);

    this.drawParallaxStars(ctx);

    // 2. World Space Rendering (Camera Transformed)
    this.camera.apply(ctx);

    // Draw Goal Zone Finish Line
    this.goalZone.draw(ctx);

    // Draw World (Platforms, Tracks, Bounce Pads, Collectibles, Hazards, Checkpoints)
    this.world.draw(ctx, this.player);

    // Draw Particles
    this.particleSystem.draw(ctx);

    // Draw Floating Score Popups
    this.floatingTexts.draw(ctx);

    // Draw Enemies
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }

    // Draw Player
    this.player.draw(ctx);

    // Draw Debug Bounding Boxes
    if (this.debugMode) {
      this.drawDebug(ctx);
    }

    this.camera.restore(ctx);

    // 3. Screen Space UI & Overlays
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
    const bannerY = 80 + slideY;

    // Glowing background card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 10);
    ctx.fill();
    ctx.stroke();

    // Banner Icon / Title
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🚩 ${banner.title}`, w / 2, bannerY + 22);

    // Banner Subtitle
    ctx.fillStyle = '#f8fafc';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(banner.subtitle, w / 2, bannerY + 42);

    ctx.restore();
  }

  drawParallaxStars(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';

    for (let i = 0; i < 40; i++) {
      const baseX = (i * 97) % 2400;
      const baseY = (i * 61) % 500;
      const starX = (baseX - this.camera.x * 0.15) % this.canvas.width;
      const starY = (baseY - this.camera.y * 0.1) % this.canvas.height;
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

    // Goal Zone Hitbox
    if (this.goalZone) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.goalZone.x, this.goalZone.y, this.goalZone.width, this.goalZone.height);
    }

    // Bounce Pad Hitboxes
    for (const pad of this.world.bouncePads) {
      ctx.strokeStyle = pad.type === 'spring' ? '#f43f5e' : '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pad.x, pad.y, pad.width, pad.height);
    }

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

    // Enemies Hitboxes
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }

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
    ctx.fillRect(16, 60, 330, 260);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 60, 330, 260);

    const activeCpName = this.currentCheckpoint ? this.currentCheckpoint.label : 'None';
    const platType = this.player.standingPlatform ? this.player.standingPlatform.type : 'None';
    const platState = this.player.standingPlatform ? this.player.standingPlatform.state : '-';
    const aliveEnemies = this.enemies.filter(e => !e.isDead).length;

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`DEBUG TELEMETRY (F3)`, 26, 80);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '11px monospace';
    ctx.fillText(`Pos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`, 26, 98);
    ctx.fillText(`Vel: (${Math.round(this.player.vx)}, ${Math.round(this.player.vy)})`, 26, 114);
    ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp} | i-Frames: ${this.player.invulnerableTimer.toFixed(2)}s`, 26, 130);
    ctx.fillText(`Grounded: ${this.player.isGrounded} | Coyote: ${this.player.coyoteTimer.toFixed(2)}s`, 26, 146);
    ctx.fillText(`Platform: ${platType} [${platState}]`, 26, 162);
    ctx.fillText(`Wall: ${this.player.isTouchingWall} (dir: ${this.player.wallDir}) | Slide: ${this.player.isWallSliding}`, 26, 178);
    ctx.fillText(`Enemies: ${aliveEnemies}/${this.enemies.length} Alive | Kills: ${this.killsCount}`, 26, 194);
    ctx.fillText(`Score: ${this.score} (${this.collectedCount}/${this.totalCollectibles}) | Pads: ${this.world.bouncePads.length}`, 26, 210);
    ctx.fillText(`Checkpoint: ${activeCpName} | Hazards: ${this.world.hazards.length}`, 26, 226);
    ctx.fillText(`Timer: ${this.timerState} (${this.runTime.toFixed(2)}s) | PB: ${this.formatTime(this.bestTime)}`, 26, 242);
    ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)}) | Particles: ${this.particleSystem.particles.length}`, 26, 258);
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
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      new Game();
    });
  } else {
    new Game();
  }
}
