export interface TrailSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: 'gold' | 'cyan' | 'violet';
}

export interface CausticRipple {
  nx: number;
  ny: number;
  age: number;
  duration: number;
  maxRadiusFactor: number;
  hue: 'gold' | 'cyan';
  strength: number;
}

export interface AnchorPoint {
  x: number;
  y: number;
  hue: 'gold' | 'cyan';
}

export interface WowRuntimeState {
  entranceTime: number;
  entranceRipplesFired: boolean;
  smoothX: number;
  smoothY: number;
  smoothActive: number;
  prevX: number;
  prevY: number;
  speed: number;
  trail: TrailSpark[];
  ripples: CausticRipple[];
  sparkEmitAccum: number;
  randSeed: number;
}

export interface EntranceMetrics {
  progress: number; // 0..1 overall
  warpZOffset: number; // smooth 3D camera deceleration into scene
  constellationScale: number;
  constellationAlpha: number;
  logoAlpha: number;
  logoLiftNorm: number; // 0..1 downward offset that settles to 0
  veilAlpha: number; // obsidian opening veil
  ignitionIntensity: number; // central starlight awakening flash
  surgeProgress: number; // 0..1 energy wave traveling center -> 6 satellite brains
  logoSweepProgress: number; // 0..1 specular glint sweep across DUPAMAN logo
}

export function createWowState(): WowRuntimeState {
  return {
    entranceTime: 0,
    entranceRipplesFired: false,
    smoothX: 0.5,
    smoothY: 0.5,
    smoothActive: 0,
    prevX: 0.5,
    prevY: 0.5,
    speed: 0,
    trail: [],
    ripples: [],
    sparkEmitAccum: 0,
    randSeed: 42197,
  };
}

export function resetWowEntrance(state: WowRuntimeState): void {
  state.entranceTime = 0;
  state.entranceRipplesFired = false;
  state.ripples = [];
}

export function triggerWowRipple(
  state: WowRuntimeState,
  nx: number,
  ny: number,
  strength = 1.0
): void {
  if (state.ripples.length > 8) {
    state.ripples.shift();
  }
  state.ripples.push({
    nx,
    ny,
    age: 0,
    duration: 1.65,
    maxRadiusFactor: 0.58,
    hue: state.ripples.length % 2 === 0 ? 'gold' : 'cyan',
    strength,
  });
}

function nextRand(state: WowRuntimeState): number {
  state.randSeed = (state.randSeed * 1664525 + 1013904223) >>> 0;
  return state.randSeed / 4294967296;
}

function easeOutQuart(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 4);
}

function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function getEntranceMetrics(entranceTime: number): EntranceMetrics {
  const t = Math.max(0, entranceTime);
  const progress = Math.min(1, t / 2.8);

  // Dramatic 3D hyper-glide decelerating into serene 60 FPS cruise
  const warpCurve = 1 - easeOutQuart(t / 2.1);
  const warpZOffset = warpCurve * 640;

  // Constellation gently blooms from depth
  const cBloom = easeOutCubic(t / 1.9);
  const constellationScale = 0.85 + cBloom * 0.15;
  const constellationAlpha = smoothstep(0.12, 1.35, t);

  // Background-free DUPAMAN logo glides softly into focus after central ignition
  const logoAlpha = smoothstep(0.45, 1.85, t);
  const logoLiftNorm = 1 - easeOutCubic((t - 0.4) / 1.5);

  // Pitch obsidian veil lifts cleanly
  const veilAlpha = 1 - smoothstep(0.0, 0.9, t);

  // Central starlight ignition flash peaks at ~0.32s and dissolves smoothly
  const flashRise = smoothstep(0.0, 0.28, t);
  const flashFall = 1 - smoothstep(0.28, 1.35, t);
  const ignitionIntensity = flashRise * flashFall;

  // Outward golden neural surge from central brain to all 6 satellite brains (0.2s -> 1.75s)
  const surgeProgress = smoothstep(0.18, 1.75, t);

  // Specular light sweep gliding across the DUPAMAN logo (0.95s -> 2.35s)
  const logoSweepProgress = Math.min(1, Math.max(0, (t - 0.95) / 1.4));

  return {
    progress,
    warpZOffset,
    constellationScale,
    constellationAlpha,
    logoAlpha,
    logoLiftNorm,
    veilAlpha,
    ignitionIntensity,
    surgeProgress,
    logoSweepProgress,
  };
}

export function stepWowState(
  state: WowRuntimeState,
  dt: number,
  pointer: { x: number; y: number; active: boolean },
  w: number,
  h: number
): EntranceMetrics {
  state.entranceTime += dt;

  // Fire twin cinematic entrance shockwave rings right at site arrival
  if (!state.entranceRipplesFired && state.entranceTime >= 0.06) {
    state.entranceRipplesFired = true;
    state.ripples.push(
      {
        nx: 0.5,
        ny: 0.54,
        age: 0,
        duration: 2.0,
        maxRadiusFactor: 0.78,
        hue: 'gold',
        strength: 1.15,
      },
      {
        nx: 0.5,
        ny: 0.54,
        age: -0.22,
        duration: 2.15,
        maxRadiusFactor: 0.86,
        hue: 'cyan',
        strength: 0.9,
      }
    );
  }

  // Smooth spring-damped pointer inertia for silky cinema feel
  const lerpRate = Math.min(1, dt * 10.5);
  const targetX = pointer.active ? pointer.x : 0.5;
  const targetY = pointer.active ? pointer.y : 0.5;
  state.prevX = state.smoothX;
  state.prevY = state.smoothY;
  state.smoothX += (targetX - state.smoothX) * lerpRate;
  state.smoothY += (targetY - state.smoothY) * lerpRate;
  state.smoothActive += ((pointer.active ? 1 : 0) - state.smoothActive) * Math.min(1, dt * 6.5);

  const dxPx = (state.smoothX - state.prevX) * w;
  const dyPx = (state.smoothY - state.prevY) * h;
  const instSpeed = Math.hypot(dxPx, dyPx) / Math.max(0.008, dt);
  state.speed += (instSpeed - state.speed) * Math.min(1, dt * 9);

  // Emit delicate bioluminescent glass stardust sparks along cursor motion
  if (pointer.active && state.speed > 28) {
    const rate = Math.min(48, state.speed * 0.065);
    state.sparkEmitAccum += rate * dt;
    while (state.sparkEmitAccum >= 1 && state.trail.length < 75) {
      state.sparkEmitAccum -= 1;
      const angle = nextRand(state) * Math.PI * 2;
      const spread = 8 + nextRand(state) * 28;
      const hueRoll = nextRand(state);
      state.trail.push({
        x: state.smoothX * w + (nextRand(state) - 0.5) * 14,
        y: state.smoothY * h + (nextRand(state) - 0.5) * 14,
        vx: Math.cos(angle) * spread - dxPx * 0.12,
        vy: Math.sin(angle) * spread - dyPx * 0.12 - 6,
        life: 0,
        maxLife: 0.55 + nextRand(state) * 0.55,
        size: 1.4 + nextRand(state) * 2.8,
        hue: hueRoll < 0.48 ? 'gold' : hueRoll < 0.86 ? 'cyan' : 'violet',
      });
    }
  } else {
    state.sparkEmitAccum = 0;
  }

  // Advance trail sparks
  for (let i = state.trail.length - 1; i >= 0; i--) {
    const sp = state.trail[i];
    sp.life += dt;
    if (sp.life >= sp.maxLife) {
      state.trail.splice(i, 1);
      continue;
    }
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    sp.vx *= 0.96;
    sp.vy *= 0.96;
  }

  // Advance caustic ripples
  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const rp = state.ripples[i];
    rp.age += dt;
    if (rp.age >= rp.duration) {
      state.ripples.splice(i, 1);
    }
  }

  return getEntranceMetrics(state.entranceTime);
}

/**
 * Renders the "WHOA" cinema entrance ignition, outward satellite surge, caustic shockwaves,
 * magnetic synaptic mouse arcs, volumetric prism flashlight, and bioluminescent stardust trail.
 */
export function renderWowOpticalOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: WowRuntimeState,
  entrance: EntranceMetrics,
  anchors: AnchorPoint[],
  constellationFrame: { drawX: number; drawY: number; baseSize: number }
): void {
  const twoPi = Math.PI * 2;
  const minDim = Math.min(w, h);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // 1. Cinema Entrance: Central Starlight Ignition & Outward 6-Arm Synaptic Surge
  if (entrance.ignitionIntensity > 0.005) {
    const ix = constellationFrame.drawX + constellationFrame.baseSize * 0.5;
    const iy = constellationFrame.drawY + constellationFrame.baseSize * 0.54;
    const r = minDim * (0.34 + (1 - entrance.ignitionIntensity) * 0.25);
    const a = entrance.ignitionIntensity;

    const core = ctx.createRadialGradient(ix, iy, 0, ix, iy, r);
    core.addColorStop(0, `rgba(255, 250, 232, ${(a * 0.95).toFixed(3)})`);
    core.addColorStop(0.22, `rgba(248, 200, 92, ${(a * 0.62).toFixed(3)})`);
    core.addColorStop(0.55, `rgba(68, 214, 255, ${(a * 0.26).toFixed(3)})`);
    core.addColorStop(1, 'rgba(68, 214, 255, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(ix, iy, r, 0, twoPi);
    ctx.fill();

    // Cinema horizontal anamorphic lens flare during ignition
    const flareHalfW = w * 0.44 * a;
    const hFlare = ctx.createLinearGradient(ix - flareHalfW, iy, ix + flareHalfW, iy);
    hFlare.addColorStop(0, 'rgba(110, 226, 255, 0)');
    hFlare.addColorStop(0.32, `rgba(110, 226, 255, ${(a * 0.28).toFixed(3)})`);
    hFlare.addColorStop(0.5, `rgba(255, 244, 208, ${(a * 0.72).toFixed(3)})`);
    hFlare.addColorStop(0.68, `rgba(248, 198, 88, ${(a * 0.28).toFixed(3)})`);
    hFlare.addColorStop(1, 'rgba(248, 198, 88, 0)');
    ctx.strokeStyle = hFlare;
    ctx.lineWidth = Math.max(1.5, minDim * 0.0045 * a);
    ctx.beginPath();
    ctx.moveTo(ix - flareHalfW, iy);
    ctx.lineTo(ix + flareHalfW, iy);
    ctx.stroke();
  }

  // Synchronized golden surge pulses shooting along all 6 arms on site entry
  if (entrance.surgeProgress > 0.01 && entrance.surgeProgress < 0.99) {
    const cx = constellationFrame.drawX + constellationFrame.baseSize * 0.5;
    const cy = constellationFrame.drawY + constellationFrame.baseSize * 0.54;
    const satellites = [
      { x: 0.105, y: 0.185 },
      { x: 0.055, y: 0.555 },
      { x: 0.285, y: 0.905 },
      { x: 0.905, y: 0.165 },
      { x: 0.945, y: 0.535 },
      { x: 0.765, y: 0.895 },
    ];
    const p = entrance.surgeProgress;
    const fade = Math.sin(p * Math.PI);

    for (const sat of satellites) {
      const tx = constellationFrame.drawX + constellationFrame.baseSize * sat.x;
      const ty = constellationFrame.drawY + constellationFrame.baseSize * sat.y;
      const px = cx + (tx - cx) * p;
      const py = cy + (ty - cy) * p;
      const sr = minDim * 0.055 * (0.6 + fade * 0.6);

      const sg = ctx.createRadialGradient(px, py, 0, px, py, sr);
      sg.addColorStop(0, `rgba(255, 248, 220, ${(fade * 0.9).toFixed(3)})`);
      sg.addColorStop(0.35, `rgba(248, 198, 86, ${(fade * 0.55).toFixed(3)})`);
      sg.addColorStop(1, 'rgba(248, 198, 86, 0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(px, py, sr, 0, twoPi);
      ctx.fill();
    }
  }

  // 2. Refractive Glass Caustic Shockwave Ripples (Site Entry + Click/Tap)
  for (const rp of state.ripples) {
    if (rp.age < 0) continue;
    const t = rp.age / rp.duration;
    const eased = easeOutCubic(t);
    const fade = Math.pow(1 - t, 1.65) * rp.strength;
    if (fade <= 0.008) continue;

    const rx = rp.nx * w;
    const ry = rp.ny * h;
    const radius = Math.max(8, eased * Math.max(w, h) * rp.maxRadiusFactor);

    // Outer chromatic dispersion shimmer
    const ringGrad = ctx.createRadialGradient(
      rx,
      ry,
      Math.max(1, radius - minDim * 0.045),
      rx,
      ry,
      radius + minDim * 0.025
    );
    if (rp.hue === 'gold') {
      ringGrad.addColorStop(0, 'rgba(248, 198, 86, 0)');
      ringGrad.addColorStop(0.55, `rgba(248, 204, 102, ${(fade * 0.24).toFixed(3)})`);
      ringGrad.addColorStop(0.82, `rgba(255, 246, 218, ${(fade * 0.42).toFixed(3)})`);
      ringGrad.addColorStop(0.92, `rgba(88, 222, 255, ${(fade * 0.2).toFixed(3)})`);
      ringGrad.addColorStop(1, 'rgba(88, 222, 255, 0)');
    } else {
      ringGrad.addColorStop(0, 'rgba(72, 214, 252, 0)');
      ringGrad.addColorStop(0.55, `rgba(72, 214, 252, ${(fade * 0.22).toFixed(3)})`);
      ringGrad.addColorStop(0.82, `rgba(225, 250, 255, ${(fade * 0.36).toFixed(3)})`);
      ringGrad.addColorStop(0.92, `rgba(176, 138, 255, ${(fade * 0.18).toFixed(3)})`);
      ringGrad.addColorStop(1, 'rgba(176, 138, 255, 0)');
    }

    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(rx, ry, radius + minDim * 0.025, 0, twoPi);
    ctx.fill();
  }

  // 3. Interactive Mouse Hover Field: Volumetric Prism Flashlight + Magnetic Synaptic Arcs
  if (state.smoothActive > 0.015) {
    const mx = state.smoothX * w;
    const my = state.smoothY * h;
    const act = state.smoothActive;
    const speedBoost = Math.min(1, state.speed / 950);

    // Volumetric dual-tone mouse flashlight (luminous golden core + crisp cyan/violet optical prism halo)
    const beamR = minDim * (0.33 + speedBoost * 0.09);
    const beam = ctx.createRadialGradient(mx, my, 0, mx, my, beamR);
    beam.addColorStop(0, `rgba(255, 248, 220, ${(act * (0.38 + speedBoost * 0.16)).toFixed(3)})`);
    beam.addColorStop(0.22, `rgba(246, 196, 84, ${(act * (0.24 + speedBoost * 0.1)).toFixed(3)})`);
    beam.addColorStop(0.52, `rgba(68, 214, 255, ${(act * 0.14).toFixed(3)})`);
    beam.addColorStop(0.78, `rgba(168, 126, 252, ${(act * 0.06).toFixed(3)})`);
    beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.arc(mx, my, beamR, 0, twoPi);
    ctx.fill();

    // Crisp glass prism caustic halo around pointer
    const haloR = minDim * (0.072 + speedBoost * 0.032);
    ctx.strokeStyle = `rgba(255, 232, 168, ${(act * (0.32 + speedBoost * 0.18)).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(mx, my, haloR, 0, twoPi);
    ctx.stroke();

    ctx.strokeStyle = `rgba(104, 230, 255, ${(act * (0.24 + speedBoost * 0.14)).toFixed(3)})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(mx + 2.5, my - 2, haloR * 1.16, 0, twoPi);
    ctx.stroke();

    // Magnetic Synaptic Arcs reaching smoothly to the nearest 4 neural nodes
    const maxConnectDist = minDim * 0.38;
    const nearby = anchors
      .map((pt) => ({ pt, dist: Math.hypot(pt.x - mx, pt.y - my) }))
      .filter((item) => item.dist > 14 && item.dist < maxConnectDist)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4);

    for (let i = 0; i < nearby.length; i++) {
      const { pt, dist } = nearby[i];
      const prox = Math.pow(1 - dist / maxConnectDist, 1.35) * act;
      if (prox <= 0.03) continue;

      const midX = (mx + pt.x) * 0.5;
      const midY = (my + pt.y) * 0.5;
      const perpX = -(pt.y - my) * 0.14 * (i % 2 === 0 ? 1 : -1);
      const perpY = (pt.x - mx) * 0.14 * (i % 2 === 0 ? 1 : -1);
      const ctrlX = midX + perpX;
      const ctrlY = midY + perpY;

      const isGold = pt.hue === 'gold';
      // Luminous synaptic arc aura
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.quadraticCurveTo(ctrlX, ctrlY, pt.x, pt.y);
      ctx.strokeStyle = isGold
        ? `rgba(248, 200, 86, ${(prox * 0.48).toFixed(3)})`
        : `rgba(76, 220, 255, ${(prox * 0.48).toFixed(3)})`;
      ctx.lineWidth = 5.0;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Crisp living filament core
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.quadraticCurveTo(ctrlX, ctrlY, pt.x, pt.y);
      ctx.strokeStyle = isGold
        ? `rgba(255, 250, 228, ${(prox * 0.92).toFixed(3)})`
        : `rgba(232, 253, 255, ${(prox * 0.92).toFixed(3)})`;
      ctx.lineWidth = 1.35;
      ctx.stroke();

      // Luminous contact spark where the synaptic arc touches the neuron
      const contactR = 14 * prox + 4;
      const contactGlow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, contactR);
      contactGlow.addColorStop(0, `rgba(255, 254, 245, ${(prox * 0.96).toFixed(3)})`);
      contactGlow.addColorStop(
        0.4,
        isGold
          ? `rgba(248, 200, 86, ${(prox * 0.62).toFixed(3)})`
          : `rgba(76, 220, 255, ${(prox * 0.62).toFixed(3)})`
      );
      contactGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = contactGlow;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, contactR, 0, twoPi);
      ctx.fill();
    }
  }

  // 4. Bioluminescent Stardust Trail along pointer motion
  for (const sp of state.trail) {
    const lifeNorm = sp.life / sp.maxLife;
    const alpha = Math.sin(lifeNorm * Math.PI) * 0.95;
    if (alpha <= 0.02) continue;

    const r = sp.size * (1.1 - lifeNorm * 0.45);
    const rgb =
      sp.hue === 'gold'
        ? '254, 214, 112'
        : sp.hue === 'cyan'
          ? '102, 232, 255'
          : '196, 160, 255';

    const sg = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, r * 3.6);
    sg.addColorStop(0, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
    sg.addColorStop(0.35, `rgba(${rgb}, ${(alpha * 0.72).toFixed(3)})`);
    sg.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, r * 3.6, 0, twoPi);
    ctx.fill();
  }

  // 5. Opening Obsidian Veil Lift (pure dark -> cinema bloom on arrival)
  if (entrance.veilAlpha > 0.005) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(2, 2, 4, ${entrance.veilAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}
