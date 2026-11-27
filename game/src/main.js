// Gobble Run — the boot and the loop: screens, the fixed-step clock, sound
// cues from the world's events, and the ?shot= scenes for screenshots.
import { STEP, VIEW_W, VIEW_H } from './config.js';
import {
  createWorld, resetWorld, stepWorld,
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSE, SCREEN_CAUGHT, SCREEN_ESCAPED,
} from './world.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { stageShot, autopilotInput } from './shots.js';
import {
  ensureAudio, setMuted, isMuted, musicTick,
  sfxJump, sfxDash, sfxCorn, sfxPie, sfxFeather, sfxHit, sfxGobble,
  sfxYell, sfxStage, sfxWin, sfxLose, sfxClick,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : (Date.now() % 2147483647);

const input = createInput(canvas);
const world = createWorld(seed);
let screen = SCREEN_TITLE;
let best = 0;
try {
  best = Number(window.localStorage.getItem('gobble-run-best')) || 0;
} catch {
  best = 0;
}
world.best = best;

function saveBest() {
  if (world.score <= best) return;
  best = world.score;
  world.best = best;
  try {
    window.localStorage.setItem('gobble-run-best', String(best));
  } catch {
    // Private mode or no storage: the run still counts.
  }
}

function playEvent(event) {
  switch (event) {
    case 'jump': sfxJump(); break;
    case 'dash': sfxDash(); break;
    case 'corn': sfxCorn(); break;
    case 'pie': sfxPie(); break;
    case 'feather': sfxFeather(); break;
    case 'hit': sfxHit(); sfxGobble(); break;
    case 'throw': sfxYell(); break;
    case 'hide': sfxGobble(); break;
    case 'stage': sfxStage(); break;
    case 'escaped': sfxWin(); break;
    case 'caught': sfxLose(); break;
    default: break;
  }
}

function drainEvents() {
  for (const event of world.events) playEvent(event);
  world.events.length = 0;
}

function startRun() {
  ensureAudio();
  resetWorld(world, seed);
  world.best = best;
  screen = SCREEN_PLAY;
  sfxGobble();
}

function toTitle() {
  resetWorld(world, seed);
  world.best = best;
  screen = SCREEN_TITLE;
}

function frame(nowSeconds) {
  // Pause and mute are live on every screen.
  if (input.consume('mute')) setMuted(!isMuted());
  if (input.consume('pause')) {
    if (screen === SCREEN_PLAY) screen = SCREEN_PAUSE;
    else if (screen === SCREEN_PAUSE) screen = SCREEN_PLAY;
  }
  const jumpPressed = input.consume('jump') || input.consume('click') || input.consume('confirm');
  const restartPressed = input.consume('restart') || jumpPressed;

  if (screen === SCREEN_TITLE) {
    // The title scene is a live demo: the autopilot runs the farm behind
    // the panel, and a caught demo turkey quietly starts over.
    stepWorld(world, STEP, autopilotInput(world, 'good'));
    world.events.length = 0;
    if (world.gameOver) {
      resetWorld(world, seed);
      world.best = best;
    }
    if (jumpPressed) {
      sfxClick();
      startRun();
    }
  } else if (screen === SCREEN_PLAY) {
    const stepInput = {
      jump: jumpPressed,
      duck: input.down('duck'),
      dash: input.consume('dash'),
      hide: input.consume('hide') || input.consume('duck'),
    };
    stepWorld(world, STEP, stepInput);
    drainEvents();
    musicTick(nowSeconds);
    if (world.gameOver === 'caught') {
      saveBest();
      screen = SCREEN_CAUGHT;
    } else if (world.gameOver === 'escaped') {
      saveBest();
      screen = SCREEN_ESCAPED;
    }
  } else if (screen === SCREEN_PAUSE) {
    if (jumpPressed) screen = SCREEN_PLAY;
  } else if (screen === SCREEN_CAUGHT || screen === SCREEN_ESCAPED) {
    if (restartPressed) {
      sfxClick();
      startRun();
    }
  }
  input.endFrame();
  render(ctx, world, screen, best);
}

function resize() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', resize);
resize();

if (shotName) {
  // Screenshot mode: stage the scene once, draw it, and hold the frame.
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  render(ctx, world, screen, best);
} else {
  let last = performance.now();
  function loop(now) {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    // Fixed steps keep the run fair on fast and slow screens alike.
    let steps = Math.floor(elapsed / STEP);
    if (steps === 0) steps = 1;
    if (steps > 5) steps = 5;
    for (let i = 0; i < steps; i += 1) frame(now / 1000);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
