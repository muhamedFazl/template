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
    coin: '#fbbf24',
    coinGlow: 'rgba(251, 191, 36, 0.35)',
    coinBorder: '#d97706',
    gem: '#c084fc',
    gemGlow: 'rgba(192, 132, 252, 0.45)',
    gemBorder: '#9333ea',
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
// 4. FLOATING TEXT SYSTEM (Score Popups)
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

      // Bright text fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}

// =============================================================================
// 5. COLLECTIBLE (Coins & Gems)
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
    // Sinusoidal floating/bobbing
    const bobAmplitude = this.type === 'gem' ? 5 : 4;
    const bobFrequency = this.type === 'gem' ? 3.0 : 3.6;
    return this.y + Math.sin(this.animTimer * bobFrequency + this.bobOffset) * bobAmplitude;
  }

  update(dt, particleSystem) {
    if (this.collected) return;
    this.animTimer += dt;

    // Passive sparkle twinkle for gems
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
    // 3D Horizontal rotation effect
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
    // Pulsing floating scale
    const pulse = 1 + Math.sin(this.animTimer * 4 + this.spinOffset) * 0.08;
    ctx.scale(pulse, pulse);

    // Glowing Aura
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();

    // Gem Diamond / Hex Geometry
    const w = 11.5;
    const h = 13.5;
    const topW = 6.5;
    const topH = 4.5;

    // Linear gradient for gem body
    const grad = ctx.createLinearGradient(-w, -h, w, h);
    grad.addColorStop(0, '#f5d0fe');
    grad.addColorStop(0.35, '#c084fc');
    grad.addColorStop(1, '#7e22ce');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#fae8ff';
    ctx.lineWidth = 1.3;

    // Faceted gem outer contour
    ctx.beginPath();
    ctx.moveTo(-topW, -h + topH); // top left
    ctx.lineTo(topW, -h + topH);   // top right
    ctx.lineTo(w, 0);             // mid right
    ctx.lineTo(0, h);             // bottom tip
    ctx.lineTo(-w, 0);            // mid left
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner facet lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;

    // Top table facet
    ctx.beginPath();
    ctx.moveTo(-topW, -h + topH);
    ctx.lineTo(0, -h + topH + 2.5);
    ctx.lineTo(topW, -h + topH);
    ctx.stroke();

    // Center to bottom tip and side facets
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(0, -h + topH + 2.5);
    ctx.lineTo(w, 0);
    ctx.moveTo(0, -h + topH + 2.5);
    ctx.lineTo(0, h);
    ctx.stroke();

    // Twinkle shine highlight
    const glintAlpha = 0.5 + Math.sin(this.animTimer * 5) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${glintAlpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(-topW * 0.4, -h + topH + 1.2, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =============================================================================
// 6. PLAYER
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
    this.walkAnimTimer = 0;
    this.blinkTimer = 2.0;
    this.isBlinking = false;
  }

  respawn(spawnPoint, particleSystem) {
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.vx = 0;
    this.vy = 0;
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

  update(dt, input, platforms, particleSystem) {
    // -------------------------------------------------------------------------
    // 1. Timers & Input Buffering
    // -------------------------------------------------------------------------
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
    // 3. Jump Handling (Variable Jump Height + Coyote + Buffer)
    // -------------------------------------------------------------------------
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      // Execute Jump
      this.vy = -CONFIG.physics.jumpForce;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.isGrounded = false;

      // Visual juice: stretch vertically on jump
      this.scaleX = 0.75;
      this.scaleY = 1.35;

      particleSystem.emitDust(this.centerX, this.y + this.height);
    }

    // Variable jump cut: if player lets go of jump while moving upwards, cut jump short
    if (!input.jump && this.vy < 0) {
      this.vy += CONFIG.physics.gravity * (1 - CONFIG.physics.jumpCutMultiplier) * dt * 2.5;
    }

    // -------------------------------------------------------------------------
    // 4. Gravity & Vertical Movement
    // -------------------------------------------------------------------------
    this.vy += CONFIG.physics.gravity * dt;
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
// 7. CAMERA SYSTEM
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
// 8. WORLD & SCENE PLATFORMS & COLLECTIBLES
// =============================================================================
class World {
  constructor() {
    this.platforms = [
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

    this.collectibles = this.createCollectibles();
  }

  createCollectibles() {
    return [
      // 1. Start Ground Coins
      new Collectible(180, 295, 'coin'),
      new Collectible(250, 295, 'coin'),
      new Collectible(320, 295, 'coin'),

      // 2. Jump Arc between Start Ground and Stepping Stone
      new Collectible(415, 260, 'coin'),
      new Collectible(445, 220, 'coin'),

      // 3. Stepping Stones
      new Collectible(540, 235, 'coin'),
      new Collectible(750, 175, 'coin'),
      new Collectible(980, 105, 'coin'),

      // 4. High Vantage "Peak" (Coins & Center Gem)
      new Collectible(1185, 35, 'coin'),
      new Collectible(1260, 25, 'gem'),
      new Collectible(1340, 35, 'coin'),

      // 5. Lower Gap Challenge
      new Collectible(1240, 275, 'coin'),
      new Collectible(1520, 335, 'coin'),
      new Collectible(1790, 255, 'coin'),

      // 6. Long Runway (Coins & Finish Line Gem)
      new Collectible(2010, 195, 'coin'),
      new Collectible(2110, 195, 'coin'),
      new Collectible(2220, 185, 'gem'),

      // 7. Upper Floating Sky Islands (Secret High Route Gem & Coins)
      new Collectible(790, 15, 'coin'),
      new Collectible(540, 30, 'gem'),
      new Collectible(330, 90, 'coin'),
    ];
  }

  resetCollectibles() {
    this.collectibles = this.createCollectibles();
  }

  update(dt, particleSystem) {
    for (const c of this.collectibles) {
      c.update(dt, particleSystem);
    }
  }

  draw(ctx) {
    this.drawPlatforms(ctx);
    this.drawCollectibles(ctx);
  }

  drawPlatforms(ctx) {
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
  }

  drawCollectibles(ctx) {
    for (const c of this.collectibles) {
      c.draw(ctx);
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
// 9. GAME ENGINE & LOOP
// =============================================================================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.statsDisplay = document.getElementById('statsDisplay');
    this.scoreDisplay = document.getElementById('scoreDisplay');

    this.input = new InputManager();
    this.particleSystem = new ParticleSystem();
    this.floatingTexts = new FloatingTextSystem();
    this.world = new World();
    this.player = new Player(CONFIG.world.spawnPoint.x, CONFIG.world.spawnPoint.y);
    this.camera = new Camera(CONFIG.canvas.width, CONFIG.canvas.height);

    this.camera.snapTo(this.player.centerX, this.player.centerY);

    this.score = 0;
    this.collectedCount = 0;
    this.totalCollectibles = this.world.collectibles.length;
    this.updateScoreDisplay();

    this.respawnCount = 0;
    this.debugMode = false;

    this.lastTime = performance.now();
    this.fps = 60;
    this.fpsTimer = 0;
    this.frameCount = 0;

    // Start Game Loop
    requestAnimationFrame((time) => this.loop(time));
  }

  updateScoreDisplay(animate = false) {
    if (this.scoreDisplay) {
      this.scoreDisplay.innerHTML = `🪙 Score: ${this.score} &nbsp;|&nbsp; ${this.collectedCount}/${this.totalCollectibles}`;
      if (animate) {
        this.scoreDisplay.classList.remove('pop');
        // Force reflow for CSS animation restart
        void this.scoreDisplay.offsetWidth;
        this.scoreDisplay.classList.add('pop');
      }
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

    // Update Player & Physics
    this.player.update(dt, this.input, this.world.platforms, this.particleSystem);

    // Update Collectibles & Floating Text
    this.world.update(dt, this.particleSystem);
    this.floatingTexts.update(dt);

    // Check Collectible Pickups
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
    this.player.respawn(CONFIG.world.spawnPoint, this.particleSystem);
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

    // Draw Platforms
    this.world.drawPlatforms(ctx);

    // Draw Collectibles (Coins & Gems)
    this.world.drawCollectibles(ctx);

    // Draw Particles
    this.particleSystem.draw(ctx);

    // Draw Floating Score Popups
    this.floatingTexts.draw(ctx);

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
    if (this.debugMode) {
      this.drawDebugOverlay(ctx);
    }
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

    // Collectibles Hitboxes
    for (const c of this.world.collectibles) {
      if (!c.collected) {
        ctx.strokeStyle = c.type === 'gem' ? '#e879f9' : '#eab308';
        ctx.lineWidth = 1;
        ctx.strokeRect(c.x, c.currentY, c.width, c.height);
      }
    }

    // Velocity vector line
    ctx.strokeStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(this.player.centerX, this.player.centerY);
    ctx.lineTo(this.player.centerX + this.player.vx * 0.1, this.player.centerY + this.player.vy * 0.1);
    ctx.stroke();

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
    ctx.fillRect(16, 60, 240, 150);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 60, 240, 150);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px monospace';
    ctx.fillText(`DEBUG MODE (F3)`, 26, 80);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Pos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`, 26, 100);
    ctx.fillText(`Vel: (${Math.round(this.player.vx)}, ${Math.round(this.player.vy)})`, 26, 120);
    ctx.fillText(`Score: ${this.score} (${this.collectedCount}/${this.totalCollectibles})`, 26, 140);
    ctx.fillText(`Grounded: ${this.player.isGrounded} | Coyote: ${this.player.coyoteTimer.toFixed(2)}s`, 26, 160);
    ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, 26, 180);
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
