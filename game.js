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
    spikeBody: '#ef4444',
    spikeGlow: 'rgba(239, 68, 68, 0.35)',
    spikeHighlight: '#fca5a5',
    spikeBase: '#334155',
    damageParticle: '#ef4444',
    heartFull: '#f43f5e',
    heartEmpty: '#334155',
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

    // Health & Combat state
    this.maxHp = CONFIG.player.maxHp || 3;
    this.hp = this.maxHp;
    this.invulnerableTimer = 0;
    this.knockbackTimer = 0;

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

  update(dt, input, platforms, particleSystem) {
    // -------------------------------------------------------------------------
    // 1. Timers & Input Buffering
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

    if (input.jumpJustPressed) {
      this.jumpBufferTimer = CONFIG.physics.jumpBufferTime;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // -------------------------------------------------------------------------
    // 2. Horizontal Movement
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

// =============================================================================
// 7. WORLD & SCENE PLATFORMS
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

  update(dt) {
    for (const hazard of this.hazards) {
      hazard.update(dt);
    }
  }

  draw(ctx) {
    // 1. Draw platforms
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

    // 2. Draw hazards on top of platforms
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
// 7. GAME ENGINE & LOOP
// =============================================================================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.statsDisplay = document.getElementById('statsDisplay');
    this.heartsContainer = document.getElementById('heartsContainer');
    this.healthBarFill = document.getElementById('healthBarFill');

    this.input = new InputManager();
    this.particleSystem = new ParticleSystem();
    this.world = new World();
    this.player = new Player(CONFIG.world.spawnPoint.x, CONFIG.world.spawnPoint.y);
    this.camera = new Camera(CONFIG.canvas.width, CONFIG.canvas.height);

    this.camera.snapTo(this.player.centerX, this.player.centerY);

    this.respawnCount = 0;
    this.debugMode = false;
    this.lastRenderedHp = -1;

    this.lastTime = performance.now();
    this.fps = 60;
    this.fpsTimer = 0;
    this.frameCount = 0;

    // Initial HUD Health Render
    this.updateHealthUI(true);

    // Start Game Loop
    requestAnimationFrame((time) => this.loop(time));
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

    // Update World & Hazards
    this.world.update(dt);

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

    // Update Camera & Particles
    this.camera.update(dt, this.player);
    this.particleSystem.update(dt);

    // Reset single-frame inputs
    this.input.resetFrame();
  }

  triggerRespawn() {
    this.respawnCount++;
    this.player.respawn(CONFIG.world.spawnPoint, this.particleSystem);
    this.updateHealthUI(true);
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

    // Draw Platforms & Hazards
    this.world.draw(ctx);

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

    // Hazard Hitboxes
    for (const hazard of this.world.hazards) {
      const hb = hazard.getHitbox();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
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
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(16, 60, 260, 160);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 60, 260, 160);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`DEBUG MODE (F3)`, 26, 80);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '11px monospace';
    ctx.fillText(`Pos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`, 26, 100);
    ctx.fillText(`Vel: (${Math.round(this.player.vx)}, ${Math.round(this.player.vy)})`, 26, 118);
    ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp} | i-Frames: ${this.player.invulnerableTimer.toFixed(2)}s`, 26, 136);
    ctx.fillText(`Knockback Active: ${this.player.knockbackTimer > 0}`, 26, 154);
    ctx.fillText(`Grounded: ${this.player.isGrounded} | Coyote: ${this.player.coyoteTimer.toFixed(2)}s`, 26, 172);
    ctx.fillText(`Active Particles: ${this.particleSystem.particles.length}`, 26, 190);
    ctx.fillText(`Hazards: ${this.world.hazards.length}`, 26, 208);
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
