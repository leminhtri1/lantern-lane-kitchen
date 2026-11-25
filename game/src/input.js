// Keyboard and mouse, read once a frame: a movement direction, "use" pressed this frame or held,
// menu keys, and clicks already turned into logical canvas coordinates.

const KEYS = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'use',
  KeyE: 'use',
  KeyJ: 'use',
  Enter: 'confirm',
  NumpadEnter: 'confirm',
  Escape: 'pause',
  KeyP: 'pause',
  KeyM: 'music',
  KeyR: 'retry',
  KeyQ: 'quit',
};

export function createInput(canvas, toLogical) {
  const down = new Set();
  let pressed = new Set();
  let clicks = [];
  let mouseDown = false;

  window.addEventListener('keydown', (event) => {
    const key = KEYS[event.code];
    if (!key) return;
    event.preventDefault();
    if (!down.has(key)) pressed.add(key);
    down.add(key);
  });
  window.addEventListener('keyup', (event) => {
    const key = KEYS[event.code];
    if (key) down.delete(key);
  });
  window.addEventListener('blur', () => {
    down.clear();
    mouseDown = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    mouseDown = true;
    clicks.push(toLogical(event.clientX, event.clientY));
  });
  window.addEventListener('pointerup', () => {
    mouseDown = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    direction() {
      const x = (down.has('right') ? 1 : 0) - (down.has('left') ? 1 : 0);
      const y = (down.has('down') ? 1 : 0) - (down.has('up') ? 1 : 0);
      return { x, y };
    },
    isDown(key) {
      return down.has(key);
    },
    get mouseDown() {
      return mouseDown;
    },
    /** Keys first pressed since the last call. */
    takePressed() {
      const out = pressed;
      pressed = new Set();
      return out;
    },
    takeClicks() {
      const out = clicks;
      clicks = [];
      return out;
    },
  };
}
