// Gobble Run — the world: turkey physics, obstacles, pickups, the farmer
// who chases him, and the scoring. No drawing here, no DOM: pure state
// stepped forward in fixed 1/60 s steps so a screenshot run is exact.
import {
  VIEW_W, GROUND_Y, TURKEY_X, GOAL_METERS, GRAVITY, JUMP_VELOCITY,
  BASE_SPEED, MAX_SPEED, DASH_MULTIPLIER, DASH_SECONDS, DASH_RECHARGE,
  METERS_PER_PX, START_LIVES, MAX_LIVES, START_GAP, MAX_GAP, GAP_REGEN,
  STUMBLE_GAP_LOSS, PUDDLE_GAP_LOSS, CORN_GAP_GAIN, SCORE_PER_METER,
  SCORE_CORN, SCORE_PIE, SCORE_FEATHER, STAGES, OBSTACLES, STAGE_SPAWNS, PICKUPS,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

// A tiny seeded generator: the same seed always grows the same run, which
// is what makes the screenshot scenes reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSpawnKind(rng, stageIndex) {
  const table = STAGE_SPAWNS[stageIndex];
  let total = 0;
  for (const [, weight] of table) total += weight;
  let roll = rng() * total;
  for (const [kind, weight] of table) {
    roll -= weight;
    if (roll <= 0) return kind;
  }
  return table[0][0];
}

export function stageIndexFor(meters) {
  if (meters >= STAGES[2].from) return 2;
  if (meters >= STAGES[1].from) return 1;
  return 0;
}

export function createWorld(seed) {
  const world = {
    seed,
    rng: mulberry32(seed),
    time: 0,
    distancePx: 0,
    meters: 0,
    score: 0,
    corn: 0,
    pieScore: 0,
    featherScore: 0,
    lives: START_LIVES,
    speed: BASE_SPEED,
    gap: START_GAP,
    stageIndex: 0,
    gameOver: null,
    turkey: {
      y: GROUND_Y,
      vy: 0,
      onGround: true,
      ducking: false,
      hiding: false,
      hideTimer: 0,
      invuln: 0,
      runPhase: 0,
    },
    farmer: { mode: 'chase', timer: 0, throwTimer: 2.4, stride: 0 },
    dash: { active: false, timer: 0, stamina: 1 },
    obstacles: [],
    pickups: [],
    haystacks: [],
    knives: [],
    particles: [],
    popups: [],
    spawnInPx: 500,
    hayInPx: 2600,
    banner: { text: STAGES[0].banner, sub: STAGES[0].bannerSub, timer: 2.6 },
    shake: 0,
    events: [],
    clouds: [],
    best: 0,
  };
  for (let i = 0; i < 6; i += 1) {
    world.clouds.push({ x: world.rng() * VIEW_W, y: 40 + world.rng() * 130, s: 0.6 + world.rng() * 0.9, v: 8 + world.rng() * 14 });
  }
  return world;
}

export function resetWorld(world, seed) {
  const fresh = createWorld(seed === undefined ? world.seed : seed);
  for (const key of Object.keys(fresh)) world[key] = fresh[key];
}

function turkeyBox(world) {
  const t = world.turkey;
  const height = t.ducking ? 58 : 94;
  // Slightly narrower than the drawing: a forgiving hitbox feels fair.
  return { x: TURKEY_X - 30, y: t.y - height, w: 60, h: height };
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function burst(world, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = world.rng() * Math.PI * 2;
    const v = speed * (0.4 + world.rng() * 0.8);
    world.particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 120,
      life: 0.5 + world.rng() * 0.4,
      age: 0,
      size: 3 + world.rng() * 5,
      color,
    });
  }
}

function popup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color: color || '#fff3c4', age: 0, life: 1.1 });
}

function spawnObstacle(world, x) {
  const kind = pickSpawnKind(world.rng, world.stageIndex);
  const def = OBSTACLES[kind];
  world.obstacles.push({
    kind, x,
    y: GROUND_Y - def.h,
    w: def.w, h: def.h,
    passed: false,
    wobble: world.rng() * Math.PI * 2,
  });
  // Sometimes a corn arc hangs over the jump, sometimes a ground line.
  const roll = world.rng();
  if (roll < 0.45) {
    for (let i = 0; i < 5; i += 1) {
      const arcX = x - 70 + i * 38;
      const arcY = GROUND_Y - 150 - Math.sin((i / 4) * Math.PI) * 70;
      world.pickups.push({ kind: 'corn', x: arcX, y: arcY, w: PICKUPS.corn.w, h: PICKUPS.corn.h, taken: false, bob: world.rng() * 6 });
    }
  } else if (roll < 0.6) {
    for (let i = 0; i < 3; i += 1) {
      world.pickups.push({ kind: 'corn', x: x + 130 + i * 44, y: GROUND_Y - 46, w: PICKUPS.corn.w, h: PICKUPS.corn.h, taken: false, bob: world.rng() * 6 });
    }
  }
}

function spawnHaystack(world, x) {
  world.haystacks.push({ x, y: GROUND_Y - 118, w: 112, h: 118, sway: world.rng() * Math.PI * 2 });
}

function spawnBonus(world, x) {
  const roll = world.rng();
  if (roll < 0.12) {
    world.pickups.push({ kind: 'feather', x, y: GROUND_Y - 190, w: PICKUPS.feather.w, h: PICKUPS.feather.h, taken: false, bob: 0 });
  } else if (roll < 0.3) {
    world.pickups.push({ kind: 'pie', x, y: GROUND_Y - 60, w: PICKUPS.pie.w, h: PICKUPS.pie.h, taken: false, bob: 0 });
  }
}

function stumble(world, how) {
  const t = world.turkey;
  if (t.invuln > 0) return;
  world.lives -= 1;
  t.invuln = 1.4;
  world.gap = Math.max(0, world.gap - STUMBLE_GAP_LOSS);
  world.shake = 0.45;
  burst(world, TURKEY_X, t.y - 60, '#ffd23c', 16, 260);
  burst(world, TURKEY_X, t.y - 60, '#ffffff', 8, 180);
  world.events.push('hit');
  popup(world, TURKEY_X + 30, t.y - 130, how, '#ff8a7a');
  if (world.lives <= 0 || world.gap <= 0) {
    world.gameOver = 'caught';
    world.events.push('caught');
  }
}

function updateFarmer(world, dt, input) {
  const f = world.farmer;
  const t = world.turkey;
  if (f.mode === 'search') {
    f.timer -= dt;
    if (f.timer <= 0) {
      f.mode = 'chase';
      world.gap = 300;
      world.events.push('searchOver');
      popup(world, TURKEY_X - 120, GROUND_Y - 190, 'He lost you!', '#b8f5a0');
    }
    return;
  }
  // The farmer gains when the turkey dawdles or stumbles, and loses ground
  // while the turkey runs clean. Dash stretches the lead fast.
  world.gap = Math.min(MAX_GAP, world.gap + GAP_REGEN * dt * (world.dash.active ? 2.2 : 1));
  if (world.stageIndex === 2) {
    f.throwTimer -= dt;
    if (f.throwTimer <= 0) {
      f.throwTimer = 2.6 + world.rng() * 1.4;
      // The farmer only throws when the lane is clear: a knife arriving
      // in the same breath as a fence would be a cheap death, not a test.
      const laneBusy = world.obstacles.some((o) => o.x > TURKEY_X - 100 && o.x < TURKEY_X + 650);
      if (laneBusy) return;
      const farmerX = TURKEY_X - world.gap - 84;
      // The knife always flies at a grounded turkey's chest height, so a
      // jump clears it and a duck clears it — but only if timed right.
      world.knives.push({
        x: farmerX + 70, y: GROUND_Y - 74, vx: 760, w: 66, h: 16, spin: 0, active: true,
      });
      world.events.push('throw');
    }
  }
  if (input.hide && t.onGround && !t.hiding) {
    for (const hay of world.haystacks) {
      if (Math.abs(hay.x + hay.w / 2 - (TURKEY_X + 10)) < 130) {
        t.hiding = true;
        t.hideTimer = 2.4;
        f.mode = 'search';
        f.timer = 2.4;
        world.events.push('hide');
        burst(world, hay.x + hay.w / 2, GROUND_Y - 90, '#e0b64a', 10, 120);
        break;
      }
    }
  }
}

function updateTurkey(world, dt, input) {
  const t = world.turkey;
  if (t.invuln > 0) t.invuln -= dt;
  if (t.hiding) {
    t.hideTimer -= dt;
    if (t.hideTimer <= 0) t.hiding = false;
    return;
  }
  t.ducking = Boolean(input.duck) && t.onGround;
  if (input.jump && t.onGround && !t.ducking) {
    t.vy = -JUMP_VELOCITY;
    t.onGround = false;
    world.events.push('jump');
    burst(world, TURKEY_X, GROUND_Y, '#d9b98a', 6, 90);
  }
  if (!t.onGround) {
    t.vy += GRAVITY * dt;
    t.y += t.vy * dt;
    if (t.y >= GROUND_Y) {
      t.y = GROUND_Y;
      t.vy = 0;
      t.onGround = true;
      burst(world, TURKEY_X, GROUND_Y, '#d9b98a', 4, 70);
    }
  }
  if (input.dash && world.dash.stamina >= 0.99 && !world.dash.active) {
    world.dash.active = true;
    world.dash.timer = DASH_SECONDS;
    world.dash.stamina = 0;
    world.events.push('dash');
  }
  if (world.dash.active) {
    world.dash.timer -= dt;
    if (world.dash.timer <= 0) world.dash.active = false;
  } else {
    world.dash.stamina = Math.min(1, world.dash.stamina + dt / DASH_RECHARGE);
  }
  t.runPhase += dt * world.speed * 0.045;
}

function updateWorldMotion(world, dt) {
  const t = world.turkey;
  const progress = world.meters / GOAL_METERS;
  let speed = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * progress;
  if (world.dash.active) speed *= DASH_MULTIPLIER;
  if (t.hiding || world.farmer.mode === 'search') speed = 0;
  world.speed = speed;
  const dx = speed * dt;
  world.distancePx += dx;
  world.meters = world.distancePx * METERS_PER_PX;
  world.score = Math.floor(world.meters) * SCORE_PER_METER + world.corn * SCORE_CORN + world.pieScore + world.featherScore;
  for (const cloud of world.clouds) {
    cloud.x -= (cloud.v + speed * 0.05) * dt;
    if (cloud.x < -180) { cloud.x = VIEW_W + 40; cloud.y = 40 + world.rng() * 130; }
  }
  // Stage banners on crossing a boundary.
  const nextStage = stageIndexFor(world.meters);
  if (nextStage !== world.stageIndex) {
    world.stageIndex = nextStage;
    world.banner = { text: STAGES[nextStage].banner, sub: STAGES[nextStage].bannerSub, timer: 3 };
    world.events.push('stage');
  }
  if (world.banner.timer > 0) world.banner.timer -= dt;
  if (world.shake > 0) world.shake -= dt;

  world.spawnInPx -= dx;
  if (world.spawnInPx <= 0) {
    // The gap must outrun one jump's ground distance, or the turkey lands
    // with the next danger already on top of it. It scales with speed.
    const minGap = Math.max(560, world.speed * 0.85);
    const gapPx = minGap + world.rng() * 280 - progress * 60;
    world.spawnInPx = Math.max(minGap, gapPx);
    spawnObstacle(world, VIEW_W + 80);
    if (world.rng() < 0.3) spawnBonus(world, VIEW_W + 260);
  }
  world.hayInPx -= dx;
  if (world.hayInPx <= 0) {
    world.hayInPx = 4200 + world.rng() * 2600;
    spawnHaystack(world, VIEW_W + 120);
  }

  const move = (list) => {
    for (const item of list) item.x -= dx;
  };
  move(world.obstacles);
  move(world.pickups);
  move(world.haystacks);
  for (const knife of world.knives) {
    // A thrown knife flies across the screen at its own speed, whatever the
    // scroll is doing: it must stay a threat at full run speed.
    knife.x += knife.vx * dt;
    knife.spin += dt * 14;
  }
  world.obstacles = world.obstacles.filter((o) => o.x + o.w > -80);
  world.pickups = world.pickups.filter((p) => !p.taken && p.x + p.w > -80);
  world.haystacks = world.haystacks.filter((h) => h.x + h.w > -80);
  world.knives = world.knives.filter((k) => k.active && k.x < VIEW_W + 120 && k.x + k.w > -80);

  for (const p of world.particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 500 * dt;
  }
  world.particles = world.particles.filter((p) => p.age < p.life);
  for (const p of world.popups) p.age += dt;
  world.popups = world.popups.filter((p) => p.age < p.life);
}

function updateCollisions(world) {
  const t = world.turkey;
  if (t.hiding) return;
  const box = turkeyBox(world);
  let inPuddle = false;
  for (const o of world.obstacles) {
    // Inset the obstacle's box a little: clipping a corner by a pixel
    // should not end a run.
    const oBox = { x: o.x + 8, y: o.y + 6, w: o.w - 16, h: o.h - 6 };
    if (!overlap(box, oBox)) {
      if (!o.passed && o.x + o.w < TURKEY_X - 34) {
        o.passed = true;
        world.events.push('clear');
      }
      continue;
    }
    if (o.kind === 'puddle') { inPuddle = true; continue; }
    if (t.invuln <= 0) stumble(world, o.kind === 'oven' ? 'TOO HOT!' : 'OUCH!');
    if (world.gameOver) return;
  }
  if (inPuddle) {
    world.speed *= 0.55;
    world.gap = Math.max(0, world.gap - PUDDLE_GAP_LOSS * (1 / 60));
    if (world.rng() < 0.02) burst(world, TURKEY_X, GROUND_Y - 6, '#7a9bb5', 2, 60);
  }
  for (const p of world.pickups) {
    if (p.taken) continue;
    const pBox = { x: p.x, y: p.y + Math.sin(world.time * 3 + p.bob) * 4, w: p.w, h: p.h };
    if (!overlap(box, pBox)) continue;
    p.taken = true;
    if (p.kind === 'corn') {
      world.corn += 1;
      world.gap = Math.min(MAX_GAP, world.gap + CORN_GAP_GAIN);
      world.events.push('corn');
      popup(world, p.x, p.y - 20, '+25', '#ffd23c');
      burst(world, p.x + 17, p.y + 20, '#ffd23c', 7, 140);
    } else if (p.kind === 'pie') {
      world.pieScore += SCORE_PIE;
      world.events.push('pie');
      popup(world, p.x, p.y - 20, '+100 PIE!', '#ff9e5e');
    } else if (p.kind === 'feather') {
      if (world.lives < MAX_LIVES) {
        world.lives += 1;
        popup(world, p.x, p.y - 20, '+1 LIFE!', '#b8f5a0');
      } else {
        world.featherScore += SCORE_FEATHER;
        popup(world, p.x, p.y - 20, '+150', '#b8f5a0');
      }
      world.events.push('feather');
    }
  }
  for (const k of world.knives) {
    if (!k.active) continue;
    const kBox = { x: k.x, y: k.y, w: k.w, h: k.h };
    if (overlap(box, kBox)) {
      k.active = false;
      if (t.invuln <= 0) stumble(world, 'KNIFE!');
      if (world.gameOver) return;
    }
  }
}

// One fixed step of the run. `input` is {jump, duck, dash, hide} booleans;
// jump/dash/hide are edge-triggered (true only on the frame pressed).
export function stepWorld(world, dt, input) {
  world.time += dt;
  if (world.gameOver) return;
  updateFarmer(world, dt, input);
  updateTurkey(world, dt, input);
  updateWorldMotion(world, dt);
  updateCollisions(world);
  if (world.meters >= GOAL_METERS && !world.gameOver) {
    world.gameOver = 'escaped';
    world.events.push('escaped');
  }
  if (world.gap <= 0 && !world.gameOver) {
    world.gameOver = 'caught';
    world.events.push('caught');
  }
}
