// Gobble Run — the screenshot scenes behind ?shot=start|play|caught|escaped.
// Each one plays the real rules forward from a fresh world for a fixed
// number of steps, steered by a simple autopilot, so the frame is what a
// short game really looks like — and the same seed always gives the same
// frame. Nothing here draws; it only moves the world.
import { STEP, TURKEY_X } from './config.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_CAUGHT, SCREEN_ESCAPED, stepWorld,
} from './world.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 24;
const CAUGHT_LIMIT_SECONDS = 240;
const ESCAPED_LIMIT_SECONDS = 600;

/** The nearest thing ahead the turkey could hit: an obstacle, a knife, a haystack. */
function lookAhead(world) {
  let obstacle = null;
  for (const o of world.obstacles) {
    if (o.x + o.w < TURKEY_X - 40) continue;
    if (!obstacle || o.x < obstacle.x) obstacle = o;
  }
  let knife = null;
  for (const k of world.knives) {
    if (!k.active || k.x + k.w < TURKEY_X - 40) continue;
    if (!knife || k.x < knife.x) knife = k;
  }
  let hay = null;
  for (const h of world.haystacks) {
    if (h.x + h.w < TURKEY_X - 40) continue;
    if (!hay || h.x < hay.x) hay = h;
  }
  return { obstacle, knife, hay };
}

/**
 * The autopilot, shared by the screenshot scenes and the title screen's
 * live demo. `skill` is how far ahead it plans: a good pilot jumps in time
 * and ducks knives; a careless one reacts late and never hides, so it gets
 * caught — which is exactly what the caught scene needs.
 */
export function autopilotInput(world, skill) {
  const input = { jump: false, duck: false, dash: false, hide: false };
  const t = world.turkey;
  if (t.hiding) return input;
  const { obstacle, knife, hay } = lookAhead(world);
  const speed = Math.max(1, world.speed);
  // Hide when the farmer is breathing down the turkey's neck and hay is near.
  if (skill === 'good' && hay && world.gap < 170) {
    const hayCentre = hay.x + hay.w / 2;
    if (Math.abs(hayCentre - (TURKEY_X + 10)) < 130 && t.onGround) input.hide = true;
  }
  // A knife and an obstacle at once is the kitchen's cruelest moment: the
  // obstacle wins. Duck the knife only when nothing needs jumping.
  const obstacleReach = obstacle ? (obstacle.x - (TURKEY_X + 40)) / speed : Infinity;
  if (knife) {
    const closing = (knife.x - TURKEY_X) / 760;
    if (closing < 0.35 && closing > -0.1 && obstacleReach > 0.45) input.duck = true;
  }
  // Jump the thing ahead, in time — wider dangers need a later jump, so
  // the turkey is still above them when their far edge passes under it.
  // The careless pilot jumps far too late and never hides, so it is caught.
  if (obstacle && t.onGround && !input.duck) {
    const reach = (obstacle.x - (TURKEY_X + 40)) / speed;
    const window = skill === 'good' ? Math.max(0.12, 0.40 - obstacle.w / speed) : 0.05;
    if (reach < window && reach > -0.05) input.jump = true;
  }
  return input;
}

function simulate(world, seconds, skill) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.gameOver) break;
    stepWorld(world, STEP, autopilotInput(world, skill));
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Unknown names stage the title scene.
 */
export function stageShot(name, world) {
  world.gameOver = null;
  if (name === 'play') {
    simulate(world, PLAY_SECONDS, 'good');
    return { screen: world.gameOver === 'caught' ? SCREEN_CAUGHT : SCREEN_PLAY };
  }
  if (name === 'caught') {
    simulate(world, CAUGHT_LIMIT_SECONDS, 'careless');
    return { screen: SCREEN_CAUGHT };
  }
  if (name === 'escaped') {
    simulate(world, ESCAPED_LIMIT_SECONDS, 'good');
    return { screen: world.gameOver === 'escaped' ? SCREEN_ESCAPED : SCREEN_PLAY };
  }
  simulate(world, START_SECONDS, 'good');
  return { screen: SCREEN_TITLE };
}
