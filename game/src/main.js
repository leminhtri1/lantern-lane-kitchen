// Boot and the one loop. Input is read every frame, the shift advances in fixed 1/60 s steps, its
// events become sounds, and the renderer paints. The game moves between four screens: title
// (pick a night), play, paused (the recipe book) and results.
//
// ?seed=N fixes the order sequence. ?shot=<name>&seed=N stages a screenshot scene instead of
// running the loop (see shots.js), paints it twice and sets window.__shotReady.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import { NIGHTS } from './recipes.js';
import { createShift, idleShift, NO_CONTROLS, stepShift } from './shift.js';
import { starsFor, rushLevel } from './orders.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { createAudio } from './audio.js';
import { loadProgress, saveProgress, unlockedNight } from './save.js';
import { resultButtonRects, titleCardRects } from './screens.js';
import { dressKitchen, stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const RESULTS_DELAY = 1.6;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const fixedSeed = Number.isInteger(seedParam) ? seedParam : null;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

function announce(text) {
  status.textContent = text;
}

function inside(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function runShot(name) {
  const scene = stageShot(name, fixedSeed ?? 1);
  let painted = 0;
  function paint() {
    renderer.draw(scene);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, renderer.toLogical);
  const audio = createAudio();
  const progress = loadProgress();
  const ui = { selected: 0, unlocked: 0, stars: progress.stars, time: 0, age: 0, canAdvance: false, newUnlock: false };
  ui.unlocked = unlockedNight(progress);
  ui.selected = ui.unlocked;
  let screen = 'title';
  let state = createShift(0, createRandom(7));
  dressKitchen(state);
  let accumulator = 0;
  let last = performance.now();
  let overFor = 0;
  let pendingUse = false;
  let pendingClicks = [];

  function startNight(index) {
    state = createShift(index, createRandom(fixedSeed ?? Math.floor(Math.random() * 2 ** 31)));
    screen = 'play';
    accumulator = 0;
    overFor = 0;
    audio.play('order');
    announce(`Night ${index + 1}: ${NIGHTS[index].title}. The stall is open.`);
  }

  function toTitle() {
    screen = 'title';
    ui.unlocked = unlockedNight(progress);
    ui.selected = Math.min(ui.selected, ui.unlocked);
    state = createShift(0, createRandom(7));
    dressKitchen(state);
    announce('Lantern Lane Kitchen. Pick a night.');
  }

  function finishNight() {
    const stars = starsFor(state);
    const n = state.nightIndex;
    const before = progress.stars[n] ?? 0;
    progress.stars[n] = Math.max(before, stars);
    saveProgress(progress);
    ui.stars = progress.stars;
    ui.age = 0;
    ui.canAdvance = stars >= 1 && n < NIGHTS.length - 1;
    ui.newUnlock = ui.canAdvance && before === 0;
    ui.selected = ui.canAdvance ? n + 1 : n;
    screen = 'results';
    announce(`Night over. ${state.coins} coins, ${stars} star${stars === 1 ? '' : 's'}.`);
  }

  function playEvents() {
    for (const e of state.events) audio.play(e.type);
  }

  function handleTitle(pressed, clicks) {
    if (pressed.has('left')) ui.selected = Math.max(0, ui.selected - 1);
    if (pressed.has('right')) ui.selected = Math.min(ui.unlocked, ui.selected + 1);
    if (pressed.has('left') || pressed.has('right')) audio.play('click');
    if (pressed.has('confirm') || pressed.has('use')) startNight(ui.selected);
    for (const click of clicks) {
      const card = titleCardRects().find((r) => inside(click, r));
      if (card && card.night <= ui.unlocked) {
        ui.selected = card.night;
        startNight(card.night);
      }
    }
  }

  function handleResults(pressed, clicks) {
    let choice = null;
    if (pressed.has('confirm') || pressed.has('use')) choice = ui.canAdvance ? 'next' : 'retry';
    if (pressed.has('retry')) choice = 'retry';
    if (pressed.has('pause')) choice = 'menu';
    for (const click of clicks) {
      const b = resultButtonRects(ui.canAdvance).find((r) => inside(click, r));
      if (b) choice = b.id;
    }
    if (choice === 'next') startNight(state.nightIndex + 1);
    else if (choice === 'retry') startNight(state.nightIndex);
    else if (choice === 'menu') toTitle();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    ui.time += dt;
    ui.age += dt;
    const pressed = input.takePressed();
    const clicks = input.takeClicks();
    if (pressed.size || clicks.length) audio.start();
    if (pressed.has('music')) audio.toggleMusic();

    if (screen === 'title') {
      handleTitle(pressed, clicks);
      idleShift(state, dt);
    } else if (screen === 'paused') {
      if (pressed.has('pause') || clicks.length) screen = 'play';
      else if (pressed.has('quit')) toTitle();
    } else if (screen === 'results') {
      idleShift(state, dt);
      handleResults(pressed, clicks);
    } else if (screen === 'play') {
      if (pressed.has('pause') && !state.over) {
        screen = 'paused';
        announce('Paused.');
      } else {
        accumulator += dt;
        // Presses and clicks wait for the next fixed step, so none is lost on a short frame.
        pendingUse = pendingUse || pressed.has('use');
        pendingClicks.push(...clicks);
        while (accumulator >= STEP) {
          const controls = { dir: input.direction(), usePressed: pendingUse, useHeld: input.isDown('use'), clicks: pendingClicks };
          stepShift(state, STEP, state.over ? NO_CONTROLS : controls);
          pendingUse = false;
          pendingClicks = [];
          playEvents();
          accumulator -= STEP;
        }
        let sizzle = 0;
        for (const s of state.kitchen.stations) if (s.type === 'wok' || s.type === 'grill') sizzle += s.items.length;
        audio.setSizzle(state.over ? 0 : sizzle);
        audio.setIntensity(rushLevel(state));
        if (state.over) {
          overFor += dt;
          if (overFor >= RESULTS_DELAY) finishNight();
        }
      }
    }
    renderer.draw({ state, screen, ui });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === 'play' && !state.over) screen = 'paused';
  });

  // A read-only window onto the running game for automated play-tests.
  window.__lantern = {
    get state() {
      return state;
    },
    get screen() {
      return screen;
    },
  };
  announce('Lantern Lane Kitchen. Press Enter or click a night to open the stall.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
