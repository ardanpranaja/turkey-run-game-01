// Gobble Run — input: keyboard and mouse, with edge-triggered presses so a
// jump fires once per key press, not once per frame the key is held.
const KEYMAP = {
  Space: 'jump',
  ArrowUp: 'jump',
  KeyW: 'jump',
  ArrowDown: 'duck',
  KeyS: 'duck',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  KeyD: 'dash',
  KeyH: 'hide',
  KeyP: 'pause',
  Escape: 'pause',
  KeyR: 'restart',
  KeyM: 'mute',
  Enter: 'confirm',
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let clickX = 0;
  let clickY = 0;

  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (!action) return;
    if (action === 'jump' || action === 'duck') event.preventDefault();
    if (!event.repeat) pressed.add(action);
    held.add(action);
  }

  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (action) held.delete(action);
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    clickX = ((event.clientX - rect.left) / rect.width) * 1280;
    clickY = ((event.clientY - rect.top) / rect.height) * 720;
    pressed.add('click');
    held.add('click');
  }

  function onPointerUp() {
    held.delete('click');
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    // True while the action's key is held down.
    down(action) {
      return held.has(action);
    },
    // True once, on the frame the action was pressed; consumed on read.
    consume(action) {
      if (!pressed.has(action)) return false;
      pressed.delete(action);
      return true;
    },
    // True if the action was pressed at all since the last frame.
    peek(action) {
      return pressed.has(action);
    },
    clickPosition() {
      return { x: clickX, y: clickY };
    },
    // Drop this frame's edge presses (jump, click, ...) after the loop read them.
    endFrame() {
      pressed.clear();
    },
  };
}
