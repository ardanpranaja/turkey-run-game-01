// Gobble Run — the renderer: every pixel the player sees. It draws the
// farm, the barn, the kitchen, the turkey, the farmer, the HUD and the
// title / pause / end screens on one 1280x720 canvas.
import {
  VIEW_W, VIEW_H, GROUND_Y, TURKEY_X, GOAL_METERS, STAGES, PALETTE,
} from './config.js';
import { SCREEN_TITLE, SCREEN_PAUSE, SCREEN_CAUGHT, SCREEN_ESCAPED } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(x, y, 52 * s, 20 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 34 * s, y + 6 * s, 32 * s, 15 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 36 * s, y + 6 * s, 34 * s, 16 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFarmyardBackdrop(ctx, stage, world) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, stage.skyTop);
  g.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  ellipse(ctx, 1080, 110, 56, 56, stage.sun);
  ellipse(ctx, 1080, 110, 72, 72, 'rgba(255,243,196,0.35)');
  for (const c of world.clouds) drawCloud(ctx, c.x, c.y, c.s);
  // Distant hills and the old red barn on the horizon.
  ctx.fillStyle = stage.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.quadraticCurveTo(300, 470, 640, GROUND_Y);
  ctx.quadraticCurveTo(980, 500, VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a03a2a';
  ctx.fillRect(880, 470, 130, 110);
  ctx.beginPath();
  ctx.moveTo(870, 472);
  ctx.lineTo(945, 420);
  ctx.lineTo(1020, 472);
  ctx.closePath();
  ctx.fillStyle = '#7a2a1e';
  ctx.fill();
  ctx.fillStyle = stage.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.quadraticCurveTo(420, 540, 900, GROUND_Y);
  ctx.quadraticCurveTo(1120, 560, VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // A crooked fence line and two autumn trees.
  ctx.strokeStyle = '#6e4520';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 560);
  ctx.lineTo(VIEW_W, 560);
  ctx.moveTo(0, 580);
  ctx.lineTo(VIEW_W, 580);
  ctx.stroke();
  for (const fx of [140, 420, 700, 980, 1220]) {
    ctx.fillStyle = '#6e4520';
    ctx.fillRect(fx, 545, 10, 46);
  }
  for (const [tx, ty, s] of [[180, 520, 1], [1150, 505, 1.25]]) {
    ctx.fillStyle = '#6e4520';
    ctx.fillRect(tx - 7 * s, ty, 14 * s, 80 * s);
    ellipse(ctx, tx, ty - 20 * s, 62 * s, 52 * s, '#c96a2e');
    ellipse(ctx, tx - 40 * s, ty + 6 * s, 40 * s, 34 * s, '#d97e35');
    ellipse(ctx, tx + 42 * s, ty + 4 * s, 42 * s, 36 * s, '#b85a26');
  }
}

function drawBarnBackdrop(ctx, stage, world) {
  ctx.fillStyle = '#3a2110';
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  ctx.fillStyle = stage.skyTop;
  ctx.fillRect(0, 0, VIEW_W, 60);
  // Wooden plank wall.
  for (let y = 60; y < GROUND_Y; y += 56) {
    ctx.fillStyle = y % 112 === 60 ? '#6e4520' : '#7d5026';
    ctx.fillRect(0, y, VIEW_W, 54);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, y + 52, VIEW_W, 3);
  }
  // Rafters and a hanging lantern.
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(0, 120, VIEW_W, 18);
  ctx.fillRect(0, 300, VIEW_W, 18);
  const lx = 640 + Math.sin(world.time * 0.8) * 8;
  ctx.strokeStyle = '#2a1a0c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lx, 138);
  ctx.lineTo(lx, 190);
  ctx.stroke();
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath();
  ctx.ellipse(lx, 214, 90, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,210,122,0.35)';
  ctx.beginPath();
  ctx.ellipse(lx, 214, 150, 120, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2a1a';
  roundRect(ctx, lx - 26, 196, 52, 44, 8);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(lx - 18, 204, 36, 26);
  // A high window with evening light.
  ctx.fillStyle = '#f7c873';
  ctx.fillRect(180, 170, 150, 110);
  ctx.fillStyle = '#3a2110';
  ctx.fillRect(250, 170, 10, 110);
  ctx.fillRect(180, 220, 150, 10);
  ctx.fillStyle = 'rgba(247,200,115,0.14)';
  ctx.beginPath();
  ctx.moveTo(180, 280);
  ctx.lineTo(480, 280);
  ctx.lineTo(560, GROUND_Y);
  ctx.lineTo(120, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function drawKitchenBackdrop(ctx, stage, world) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, stage.skyTop);
  g.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  // Cream tile wall.
  ctx.fillStyle = '#f3e2c2';
  ctx.fillRect(0, 0, VIEW_W, 430);
  ctx.strokeStyle = '#d9c49a';
  ctx.lineWidth = 2;
  for (let y = 0; y <= 430; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();
  }
  for (let x = 0; x <= VIEW_W; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 430);
    ctx.stroke();
  }
  // Window over the sink: the forest outside, so close.
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(880, 60, 300, 240);
  ctx.fillStyle = '#bfe3a8';
  ctx.fillRect(896, 76, 268, 208);
  ellipse(ctx, 1000, 190, 90, 70, '#5a8a3a');
  ellipse(ctx, 1100, 220, 70, 55, '#4a7a30');
  ellipse(ctx, 940, 230, 60, 48, '#6a9a45');
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(1024, 76, 12, 208);
  ctx.fillRect(896, 174, 268, 12);
  // Hanging pots and a shelf of jars.
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(120, 40);
  ctx.lineTo(120, 120);
  ctx.moveTo(240, 40);
  ctx.lineTo(240, 120);
  ctx.stroke();
  ellipse(ctx, 120, 150, 46, 30, '#5a5a5a');
  ellipse(ctx, 240, 150, 40, 26, '#8a6a3a');
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(420, 210, 300, 16);
  for (const [jx, jc] of [[450, '#c96a2e'], [520, '#7a9a45'], [590, '#b03a2e'], [660, '#d9b23c']]) {
    ctx.fillStyle = jc;
    roundRect(ctx, jx, 160, 44, 50, 6);
    ctx.fill();
  }
  // Big red-checked tablecloth on the table at the back.
  ctx.fillStyle = '#b03a2e';
  ctx.fillRect(0, 430, VIEW_W, 170);
  ctx.fillStyle = '#e8dcc8';
  for (let y = 430; y < 600; y += 42) {
    for (let x = ((y / 42) % 2 === 0 ? 0 : 42); x < VIEW_W; x += 84) {
      ctx.fillRect(x, y, 42, 42);
    }
  }
}

function drawGround(ctx, stage, world) {
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = stage.groundDark;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
  // Scudding tufts and leaves show the speed.
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let i = 0; i < 14; i += 1) {
    const x = ((i * 173 + world.distancePx * 1.7) % 1400) - 60;
    ctx.fillRect(x, GROUND_Y + 34 + (i % 4) * 20, 26, 5);
  }
  if (world.stageIndex === 2) {
    // Kitchen checkerboard floor.
    for (let x = 0; x < VIEW_W; x += 64) {
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(x, GROUND_Y + 14, 32, 106);
    }
  }
}

function drawTurkey(ctx, world) {
  const t = world.turkey;
  if (t.hiding) return;
  const blink = t.invuln > 0 && Math.floor(world.time * 14) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;
  const x = TURKEY_X;
  const y = t.y;
  const legSwing = t.onGround ? Math.sin(t.runPhase) * 14 : 0;
  const bob = t.onGround ? Math.abs(Math.sin(t.runPhase)) * 4 : 0;
  const duck = t.ducking;
  ctx.save();
  ctx.translate(x, y - bob);
  if (duck) ctx.scale(1.15, 0.62);
  // Legs.
  ctx.strokeStyle = '#e07b39';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -26);
  ctx.lineTo(-14 + legSwing, 0);
  ctx.moveTo(10, -26);
  ctx.lineTo(16 - legSwing, 0);
  ctx.stroke();
  // Tail fan.
  const tailColors = [PALETTE.tailA, PALETTE.tailB, PALETTE.tailC, PALETTE.tailB, PALETTE.tailA];
  for (let i = 0; i < 5; i += 1) {
    const angle = -0.9 + i * 0.45;
    ctx.save();
    ctx.translate(-26, -58);
    ctx.rotate(angle);
    ellipse(ctx, 0, -26, 13, 30, tailColors[i]);
    ctx.restore();
  }
  // Body and wing.
  ellipse(ctx, 0, -58, 40, 34, PALETTE.turkeyBody);
  ellipse(ctx, 0, -48, 26, 20, PALETTE.turkeyBelly);
  ctx.save();
  ctx.translate(4, -56);
  ctx.rotate(duck ? 0.5 : -0.5 + Math.sin(t.runPhase) * 0.12);
  ellipse(ctx, 0, 0, 22, 13, '#6e4520');
  ctx.restore();
  // Neck, head, beak, wattle, eye.
  ctx.fillStyle = PALETTE.turkeyHead;
  ctx.fillRect(26, -104, 12, 34);
  ellipse(ctx, 34, -108, 17, 15, PALETTE.turkeyHead);
  ctx.fillStyle = PALETTE.turkeyBeak;
  ctx.beginPath();
  ctx.moveTo(48, -112);
  ctx.lineTo(66, -106);
  ctx.lineTo(48, -100);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.turkeyWattle;
  ctx.beginPath();
  ctx.ellipse(44, -94, 6, 11, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(38, -112, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(40, -112, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
  if (t.invuln > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', x, y - 150);
  }
}

function drawFarmer(ctx, world) {
  const gap = world.gap;
  const x = TURKEY_X - gap - 84;
  if (x < -140) return;
  const f = world.farmer;
  const stride = Math.sin(world.time * 11) * 12;
  const bob = Math.abs(Math.sin(world.time * 11)) * 4;
  const searching = f.mode === 'search';
  ctx.save();
  ctx.translate(x, GROUND_Y - bob);
  // Legs and boots.
  ctx.strokeStyle = '#2e3a4a';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -52);
  ctx.lineTo(-16 + stride, 0);
  ctx.moveTo(8, -52);
  ctx.lineTo(18 - stride, 0);
  ctx.stroke();
  // Overalls and shirt.
  ctx.fillStyle = PALETTE.farmerShirt;
  roundRect(ctx, -30, -118, 64, 62, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerOveralls;
  roundRect(ctx, -28, -74, 60, 30, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.fillRect(-28, -104, 60, 18);
  // Arm reaching forward with the pitchfork.
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(28, -100);
  ctx.lineTo(58, -84);
  ctx.stroke();
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(58, -140);
  ctx.lineTo(58, -40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(48, -140);
  ctx.lineTo(48, -118);
  ctx.moveTo(58, -144);
  ctx.lineTo(58, -118);
  ctx.moveTo(68, -140);
  ctx.lineTo(68, -118);
  ctx.stroke();
  // Head, hat, moustache, angry brows.
  ellipse(ctx, 2, -138, 20, 19, PALETTE.farmerSkin);
  ctx.fillStyle = PALETTE.farmerHat;
  ellipse(ctx, 2, -152, 26, 8, PALETTE.farmerHat);
  ellipse(ctx, 2, -158, 15, 10, PALETTE.farmerHat);
  ctx.fillStyle = '#5a4a2a';
  ctx.beginPath();
  ctx.ellipse(8, -130, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, -146);
  ctx.lineTo(2, -142);
  ctx.moveTo(14, -146);
  ctx.lineTo(6, -142);
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(-2, -141, 2, 0, Math.PI * 2);
  ctx.arc(12, -141, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (searching) {
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', x + 40, GROUND_Y - 210);
  }
}

function drawObstacle(ctx, o, world) {
  const x = o.x;
  const y = o.y;
  ctx.save();
  if (o.kind === 'fence') {
    ctx.fillStyle = '#8a5a2e';
    ctx.fillRect(x, y, 10, o.h);
    ctx.fillRect(x + o.w - 10, y, 10, o.h);
    ctx.fillStyle = '#a9713a';
    ctx.fillRect(x, y + 8, o.w, 12);
    ctx.fillRect(x, y + 36, o.w, 12);
    ctx.fillRect(x, y + 64, o.w, 12);
  } else if (o.kind === 'pumpkin') {
    ellipse(ctx, x + o.w / 2, y + o.h - 24, 30, 26, '#d96a1e');
    ellipse(ctx, x + o.w / 2 - 12, y + o.h - 24, 16, 22, '#c85a16');
    ellipse(ctx, x + o.w / 2 + 12, y + o.h - 24, 16, 22, '#e07b2a');
    ctx.strokeStyle = '#5a7a2a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + o.w / 2, y + 6);
    ctx.quadraticCurveTo(x + o.w / 2 + 8, y - 6, x + o.w / 2 + 16, y - 2);
    ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 20);
    ctx.lineTo(x + 22, y + 28);
    ctx.lineTo(x + 14, y + 28);
    ctx.closePath();
    ctx.moveTo(x + 44, y + 20);
    ctx.lineTo(x + 36, y + 28);
    ctx.lineTo(x + 44, y + 28);
    ctx.closePath();
    ctx.fill();
  } else if (o.kind === 'haybale') {
    ctx.fillStyle = '#d9b23c';
    roundRect(ctx, x, y, o.w, o.h, 14);
    ctx.fill();
    ctx.strokeStyle = '#b8932e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 14);
    ctx.lineTo(x + o.w - 8, y + 14);
    ctx.moveTo(x + 8, y + o.h - 14);
    ctx.lineTo(x + o.w - 8, y + o.h - 14);
    ctx.stroke();
  } else if (o.kind === 'pitchfork') {
    ctx.strokeStyle = '#8a8a8a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 15, y + o.h);
    ctx.lineTo(x + 15, y + 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 22);
    ctx.lineTo(x + 5, y);
    ctx.moveTo(x + 15, y + 26);
    ctx.lineTo(x + 15, y);
    ctx.moveTo(x + 25, y + 22);
    ctx.lineTo(x + 25, y);
    ctx.stroke();
    ctx.fillStyle = '#6e4520';
    ctx.fillRect(x + 9, y + o.h - 34, 12, 34);
  } else if (o.kind === 'crate') {
    ctx.fillStyle = '#a9713a';
    ctx.fillRect(x, y, o.w, o.h);
    ctx.strokeStyle = '#6e4520';
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 2, y + 2, o.w - 4, o.h - 4);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + o.w, y + o.h);
    ctx.moveTo(x + o.w, y);
    ctx.lineTo(x, y + o.h);
    ctx.stroke();
  } else if (o.kind === 'pot') {
    ctx.fillStyle = '#3a3a3a';
    roundRect(ctx, x, y + 8, o.w, o.h - 8, 8);
    ctx.fill();
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(x - 6, y + 12, 10, 14);
    ctx.fillRect(x + o.w - 4, y + 12, 10, 14);
    ctx.fillStyle = '#d9e8d9';
    ellipse(ctx, x + o.w / 2, y + 10, o.w / 2 - 4, 8, '#e8f2e8');
  } else if (o.kind === 'oven') {
    ctx.fillStyle = '#4a4a4a';
    roundRect(ctx, x, y, o.w, o.h, 6);
    ctx.fill();
    const glow = 0.6 + Math.sin(world.time * 6 + o.wobble) * 0.4;
    ctx.fillStyle = `rgba(255,123,28,${0.55 + glow * 0.4})`;
    roundRect(ctx, x + 12, y + 8, o.w - 24, o.h - 16, 4);
    ctx.fill();
    ctx.fillStyle = '#ffd27a';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT!', x + o.w / 2, y + 30);
  } else if (o.kind === 'puddle') {
    ctx.fillStyle = 'rgba(122,155,181,0.85)';
    ellipse(ctx, x + o.w / 2, y + 8, o.w / 2, 9, 'rgba(122,155,181,0.85)');
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ellipse(ctx, x + o.w / 2 - 20, y + 6, 26, 4, 'rgba(255,255,255,0.5)');
  }
  ctx.restore();
}

function drawHaystack(ctx, h, world) {
  const sway = Math.sin(world.time * 2 + h.sway) * 2;
  ctx.save();
  ctx.translate(h.x + h.w / 2, h.y + h.h);
  ctx.fillStyle = '#e0b64a';
  ctx.beginPath();
  ctx.moveTo(-56, 0);
  ctx.quadraticCurveTo(-52, -110, 0, -118);
  ctx.quadraticCurveTo(52, -110, 56, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b8932e';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 18, -10);
    ctx.quadraticCurveTo(i * 20 + sway, -60, i * 14, -104);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPickup(ctx, p, world) {
  const bobY = Math.sin(world.time * 3 + p.bob) * 4;
  const x = p.x + p.w / 2;
  const y = p.y + p.h / 2 + bobY;
  if (p.kind === 'corn') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.35);
    ellipse(ctx, 0, 0, 11, 19, PALETTE.cornYellow);
    ctx.strokeStyle = '#e8a91c';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 6, -16);
      ctx.lineTo(i * 6, 16);
      ctx.stroke();
    }
    ctx.fillStyle = '#7a9a45';
    ctx.beginPath();
    ctx.moveTo(-8, 16);
    ctx.lineTo(-16, 30);
    ctx.lineTo(-2, 22);
    ctx.closePath();
    ctx.moveTo(8, 16);
    ctx.lineTo(16, 30);
    ctx.lineTo(2, 22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (p.kind === 'pie') {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#b85a26';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 20, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d98a3d';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 14, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (p.kind === 'feather') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(world.time * 2) * 0.3);
    ctx.fillStyle = '#b8f5a0';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 20, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a8a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 22);
    ctx.stroke();
    ctx.restore();
  }
}

function drawKnife(ctx, k) {
  ctx.save();
  ctx.translate(k.x + k.w / 2, k.y + k.h / 2);
  ctx.rotate(k.spin % (Math.PI * 2));
  ctx.fillStyle = PALETTE.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(-32, -5);
  ctx.lineTo(14, -5);
  ctx.lineTo(32, 0);
  ctx.lineTo(14, 5);
  ctx.lineTo(-32, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.knifeHandle;
  roundRect(ctx, -32, -6, 16, 12, 3);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const p of world.popups) {
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.color;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(p.text, p.x, p.y - p.age * 40);
  }
  ctx.globalAlpha = 1;
}

function drawHeart(ctx, x, y, filled) {
  ctx.fillStyle = filled ? '#e0483e' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.bezierCurveTo(x - 14, y - 4, x - 6, y - 14, x, y - 5);
  ctx.bezierCurveTo(x + 6, y - 14, x + 14, y - 4, x, y + 10);
  ctx.fill();
}

function drawHud(ctx, world) {
  ctx.textAlign = 'left';
  // Score panel.
  ctx.fillStyle = 'rgba(30,18,8,0.55)';
  roundRect(ctx, 18, 14, 300, 92, 12);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('SCORE', 34, 38);
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(String(world.score).padStart(6, '0'), 34, 76);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#ffd23c';
  ctx.fillText(`CORN ${world.corn}`, 220, 38);
  // Distance bar with stage ticks.
  const barX = 360;
  const barW = 560;
  const barY = 22;
  ctx.fillStyle = 'rgba(30,18,8,0.55)';
  roundRect(ctx, barX - 8, barY - 8, barW + 16, 58, 12);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`${STAGES[world.stageIndex].name.toUpperCase()}  •  ${Math.floor(world.meters)} m / ${GOAL_METERS} m`, barX, barY + 6);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, barX, barY + 14, barW, 14, 7);
  ctx.fill();
  ctx.fillStyle = '#7ac74f';
  roundRect(ctx, barX, barY + 14, Math.max(14, barW * Math.min(1, world.meters / GOAL_METERS)), 14, 7);
  ctx.fill();
  for (const tick of [1000, 2000]) {
    const tx = barX + (barW * tick) / GOAL_METERS;
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(tx - 1, barY + 12, 2, 18);
  }
  // Lives.
  ctx.fillStyle = 'rgba(30,18,8,0.55)';
  roundRect(ctx, 952, 14, 310, 92, 12);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('LIVES', 970, 38);
  for (let i = 0; i < 3; i += 1) drawHeart(ctx, 992 + i * 34, 52, i < world.lives);
  // Farmer closeness meter.
  const danger = 1 - world.gap / 340;
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('FARMER BRAM', 970, 88);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 1096, 76, 150, 12, 6);
  ctx.fill();
  ctx.fillStyle = danger > 0.66 ? '#e0483e' : danger > 0.36 ? '#e07b39' : '#7ac74f';
  roundRect(ctx, 1096, 76, Math.max(6, 150 * danger), 12, 6);
  ctx.fill();
  if (danger > 0.66) {
    ctx.fillStyle = '#ff8a7a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("HE'S RIGHT BEHIND YOU!", VIEW_W / 2, 150);
    ctx.textAlign = 'left';
  }
  // Dash stamina.
  if (world.dash.stamina < 1 || world.dash.active) {
    ctx.fillStyle = 'rgba(30,18,8,0.55)';
    roundRect(ctx, 18, 118, 150, 26, 8);
    ctx.fill();
    ctx.fillStyle = '#8ecae6';
    roundRect(ctx, 26, 126, 134 * world.dash.stamina, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('DASH (SHIFT)', 26, 138);
  }
  // Stage banner.
  if (world.banner.timer > 0) {
    const a = Math.min(1, world.banner.timer);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(30,18,8,0.6)';
    roundRect(ctx, VIEW_W / 2 - 340, 190, 680, 96, 14);
    ctx.fill();
    ctx.fillStyle = '#ffd23c';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(world.banner.text, VIEW_W / 2, 232);
    ctx.fillStyle = '#fff3c4';
    ctx.font = '18px sans-serif';
    ctx.fillText(world.banner.sub, VIEW_W / 2, 264);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

function overlayPanel(ctx, title, titleColor, lines, hint) {
  ctx.fillStyle = 'rgba(20,12,6,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(30,18,8,0.85)';
  roundRect(ctx, VIEW_W / 2 - 420, 130, 840, 460, 20);
  ctx.fill();
  ctx.strokeStyle = '#ffd23c';
  ctx.lineWidth = 3;
  roundRect(ctx, VIEW_W / 2 - 420, 130, 840, 460, 20);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(title, VIEW_W / 2, 220);
  ctx.fillStyle = '#fff3c4';
  ctx.font = '20px sans-serif';
  let y = 268;
  for (const line of lines) {
    ctx.fillText(line, VIEW_W / 2, y);
    y += 34;
  }
  ctx.fillStyle = '#ffd23c';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(hint, VIEW_W / 2, 540);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, world, best) {
  ctx.fillStyle = 'rgba(20,12,6,0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23c';
  ctx.font = 'bold 96px sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 18;
  ctx.fillText('GOBBLE RUN', VIEW_W / 2, 190);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('The Great Thanksgiving Escape', VIEW_W / 2, 238);
  ctx.font = '19px sans-serif';
  const lines = [
    'Farmer Bram has picked YOU for Thanksgiving dinner. Run 3000 m to the forest!',
    'SPACE / CLICK — jump      ↓ / S — duck & hide in the hay',
    'SHIFT — dash      P — pause      M — mute',
    'Dodge fences, pumpkins, pitchforks, pots and the red-hot oven.',
    'In the kitchen, DUCK the carving knives he throws at you.',
    'Corn is points. Pie is more points. A golden feather is a life.',
  ];
  let y = 300;
  for (const line of lines) {
    ctx.fillText(line, VIEW_W / 2, y);
    y += 32;
  }
  ctx.fillStyle = '#ffd23c';
  ctx.font = 'bold 28px sans-serif';
  const pulse = 0.75 + Math.sin(world.time * 4) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.fillText('PRESS SPACE OR CLICK TO START', VIEW_W / 2, 540);
  ctx.globalAlpha = 1;
  if (best > 0) {
    ctx.fillStyle = '#fff3c4';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Best score: ${best}`, VIEW_W / 2, 584);
  }
  ctx.textAlign = 'left';
}

function drawEnd(ctx, world, best, escaped) {
  const stats = [
    `Score: ${world.score}   •   Distance: ${Math.floor(world.meters)} m   •   Corn: ${world.corn}`,
    `Best score: ${Math.max(best, world.score)}`,
  ];
  if (escaped) {
    overlayPanel(ctx, 'ESCAPED!', '#7ac74f', [
      'You burst out of the kitchen, past the fence, and into the forest.',
      'Farmer Bram is still looking under haystacks. You are free —',
      'and Thanksgiving dinner will have to be tofu this year.',
      '',
      ...stats,
    ], 'PRESS R OR CLICK TO RUN AGAIN');
  } else {
    overlayPanel(ctx, 'CAUGHT!', '#e0483e', [
      'Farmer Bram got you. Thanksgiving dinner is served...',
      '...unless you run it back and make him eat his words instead.',
      '',
      ...stats,
    ], 'PRESS R OR CLICK TO RUN AGAIN');
  }
}

// The one call main.js makes every frame.
export function render(ctx, world, screen, best) {
  ctx.save();
  if (world.shake > 0) {
    // Deterministic jitter from the clock, so a screenshot frame is exact.
    const s = world.shake * 22;
    const jx = Math.sin(world.time * 91.7) * s;
    const jy = Math.cos(world.time * 113.3) * s;
    ctx.translate(jx, jy);
  }
  const stage = STAGES[world.stageIndex];
  if (world.stageIndex === 0) drawFarmyardBackdrop(ctx, stage, world);
  else if (world.stageIndex === 1) drawBarnBackdrop(ctx, stage, world);
  else drawKitchenBackdrop(ctx, stage, world);
  drawGround(ctx, stage, world);
  for (const h of world.haystacks) drawHaystack(ctx, h, world);
  for (const o of world.obstacles) drawObstacle(ctx, o, world);
  for (const p of world.pickups) {
    if (!p.taken) drawPickup(ctx, p, world);
  }
  for (const k of world.knives) {
    if (k.active) drawKnife(ctx, k);
  }
  drawFarmer(ctx, world);
  drawTurkey(ctx, world);
  drawParticles(ctx, world);
  ctx.restore();
  if (screen === SCREEN_TITLE) {
    drawTitle(ctx, world, best);
  } else if (screen === SCREEN_PAUSE) {
    drawHud(ctx, world);
    overlayPanel(ctx, 'PAUSED', '#ffd23c', [
      'The turkey is catching its breath. So is Farmer Bram.',
      'Probably.',
    ], 'PRESS P OR CLICK TO KEEP RUNNING');
  } else if (screen === SCREEN_CAUGHT) {
    drawHud(ctx, world);
    drawEnd(ctx, world, best, false);
  } else if (screen === SCREEN_ESCAPED) {
    drawHud(ctx, world);
    drawEnd(ctx, world, best, true);
  } else {
    drawHud(ctx, world);
  }
}
