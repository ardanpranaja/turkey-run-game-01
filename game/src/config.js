// Gobble Run — every number the game balances on lives here.
// One job: tuning, stages and the look of each stretch of the escape.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 600;
export const TURKEY_X = 420;
export const GOAL_METERS = 3000;
export const STEP = 1 / 60;
export const METERS_PER_PX = 1 / 50;

export const GRAVITY = 3200;
export const JUMP_VELOCITY = 1300;
export const BASE_SPEED = 430;
export const MAX_SPEED = 780;
export const DASH_MULTIPLIER = 1.45;
export const DASH_SECONDS = 0.9;
export const DASH_RECHARGE = 2.2;

export const START_LIVES = 3;
export const MAX_LIVES = 3;
export const START_GAP = 300;
export const MAX_GAP = 340;
export const GAP_REGEN = 14;
export const STUMBLE_GAP_LOSS = 115;
export const PUDDLE_GAP_LOSS = 34;
export const CORN_GAP_GAIN = 9;

export const SCORE_PER_METER = 10;
export const SCORE_CORN = 25;
export const SCORE_PIE = 100;
export const SCORE_FEATHER = 150;

// A stage is a stretch of the run: its palette, its dangers and its mood.
export const STAGES = [
  {
    name: 'The Farmyard',
    from: 0,
    to: 1000,
    skyTop: '#ffe9bd',
    skyBottom: '#ffb35c',
    sun: '#fff3c4',
    hillFar: '#c98f4e',
    hillNear: '#a9713a',
    ground: '#b07a3e',
    groundDark: '#96652f',
    banner: 'STAGE 1 — THE FARMYARD',
    bannerSub: 'Jump the fences. Grab the corn. Do not stop.',
  },
  {
    name: 'The Barn',
    from: 1000,
    to: 2000,
    skyTop: '#5d3a1e',
    skyBottom: '#8a5a2e',
    sun: '#ffd27a',
    hillFar: '#4a2c14',
    hillNear: '#3a2110',
    ground: '#6e4520',
    groundDark: '#59371a',
    banner: 'STAGE 2 — THE BARN',
    bannerSub: 'Pitchforks, crates and dark corners. He is closer now.',
  },
  {
    name: 'The Kitchen',
    from: 2000,
    to: 3000,
    skyTop: '#f7e8c8',
    skyBottom: '#f2c98a',
    sun: '#fff8dc',
    hillFar: '#d9a05b',
    hillNear: '#c08a45',
    ground: '#c99a5b',
    groundDark: '#a97e45',
    banner: 'STAGE 3 — THE KITCHEN',
    bannerSub: 'Knives fly. The oven glows. The forest is almost in reach.',
  },
];

// Obstacle kinds: what they are, how big, and what beats them.
export const OBSTACLES = {
  fence: { w: 48, h: 84, beat: 'jump', score: 0 },
  pumpkin: { w: 58, h: 54, beat: 'jump', score: 0 },
  haybale: { w: 96, h: 72, beat: 'jump', score: 0 },
  pitchfork: { w: 30, h: 118, beat: 'jump', score: 0 },
  crate: { w: 72, h: 66, beat: 'jump', score: 0 },
  pot: { w: 66, h: 60, beat: 'jump', score: 0 },
  oven: { w: 160, h: 48, beat: 'jump', score: 0 },
  puddle: { w: 130, h: 16, beat: 'jump', score: 0 },
};

// Which dangers each stage throws, with their spawn weights: one table
// per stage, in stage order.
export const STAGE_SPAWNS = [
  [['fence', 4], ['pumpkin', 4], ['haybale', 3], ['puddle', 3]],
  [['fence', 3], ['pitchfork', 4], ['crate', 4], ['haybale', 3], ['pumpkin', 2]],
  [['pot', 4], ['oven', 4], ['pitchfork', 3], ['crate', 3], ['fence', 2]],
];

export const PICKUPS = {
  corn: { w: 34, h: 42, score: SCORE_CORN },
  pie: { w: 46, h: 38, score: SCORE_PIE },
  feather: { w: 42, h: 30, score: SCORE_FEATHER },
};

// Autumn palette shared by every drawing file.
export const PALETTE = {
  turkeyBody: '#8a5a2b',
  turkeyBelly: '#c98f4e',
  turkeyHead: '#e8b06a',
  turkeyBeak: '#e07b39',
  turkeyWattle: '#c0392b',
  tailA: '#7a4a1e',
  tailB: '#b06a2c',
  tailC: '#d98a3d',
  farmerShirt: '#b03a2e',
  farmerOveralls: '#2e5a8a',
  farmerHat: '#d9b23c',
  farmerSkin: '#e8b98a',
  knifeBlade: '#dfe6ea',
  knifeHandle: '#3a2a1a',
  ovenGlow: '#ff7b1c',
  cornYellow: '#ffd23c',
  hay: '#e0b64a',
};
