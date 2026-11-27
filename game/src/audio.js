// Gobble Run — sound: everything is synthesized with WebAudio at run time,
// so the game ships no audio files at all. Nothing here runs until the
// player first presses a key or clicks, which is when browsers allow sound.
let audioCtx = null;
let muted = false;
let musicStep = 0;
let musicNextTime = 0;

// A short autumn walk, one note a step, looped quietly under the run.
const MELODY = [
  392, 0, 440, 523, 440, 392, 330, 0,
  392, 0, 440, 587, 523, 440, 392, 0,
  330, 0, 392, 440, 392, 330, 294, 0,
  330, 392, 440, 392, 330, 0, 294, 0,
];

export function ensureAudio() {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      audioCtx = new Ctor();
    } catch {
      audioCtx = null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') void audioCtx.resume();
}

export function setMuted(value) {
  muted = Boolean(value);
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, delay, slideTo) {
  if (!audioCtx || muted) return;
  const start = audioCtx.currentTime + (delay || 0);
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  gain.gain.setValueAtTime(vol || 0.08, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export function sfxJump() {
  tone(280, 0.16, 'square', 0.07, 0, 620);
}

export function sfxDash() {
  tone(180, 0.2, 'sawtooth', 0.06, 0, 720);
}

export function sfxCorn() {
  tone(880, 0.08, 'sine', 0.09);
  tone(1318, 0.12, 'sine', 0.08, 0.07);
}

export function sfxPie() {
  tone(523, 0.1, 'sine', 0.09);
  tone(659, 0.1, 'sine', 0.09, 0.08);
  tone(784, 0.16, 'sine', 0.09, 0.16);
}

export function sfxFeather() {
  tone(1046, 0.1, 'triangle', 0.09);
  tone(1568, 0.18, 'triangle', 0.08, 0.09);
}

export function sfxHit() {
  tone(140, 0.25, 'sawtooth', 0.12, 0, 60);
  tone(90, 0.3, 'square', 0.1, 0.02, 40);
}

export function sfxGobble() {
  // A turkey gobble: five quick falling blips.
  for (let i = 0; i < 5; i += 1) {
    tone(520 - i * 70, 0.07, 'square', 0.07, i * 0.08, 300 - i * 40);
  }
}

export function sfxYell() {
  tone(220, 0.35, 'sawtooth', 0.09, 0, 110);
  tone(165, 0.3, 'sawtooth', 0.08, 0.12, 90);
}

export function sfxStage() {
  tone(392, 0.12, 'triangle', 0.09);
  tone(523, 0.12, 'triangle', 0.09, 0.1);
  tone(659, 0.2, 'triangle', 0.09, 0.2);
}

export function sfxWin() {
  const notes = [523, 659, 784, 1046, 784, 1046, 1318];
  notes.forEach((n, i) => tone(n, 0.22, 'triangle', 0.1, i * 0.13));
}

export function sfxLose() {
  const notes = [392, 370, 349, 311];
  notes.forEach((n, i) => tone(n, 0.3, 'sawtooth', 0.07, i * 0.18));
}

export function sfxClick() {
  tone(660, 0.05, 'sine', 0.06);
}

// One quiet music step, called from the game loop while playing.
export function musicTick(nowSeconds) {
  if (!audioCtx || muted) return;
  if (nowSeconds < musicNextTime) return;
  const note = MELODY[musicStep % MELODY.length];
  musicStep += 1;
  musicNextTime = nowSeconds + 0.24;
  if (note > 0) tone(note, 0.2, 'triangle', 0.035);
}
