// Boot and the one loop: input is read on clicks and keys, the world advances
// in fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens: title,
// play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { addIngredient, clearPlate, createGame, PHASE_OVER, PHASE_PAUSED, PHASE_PLAY, PHASE_TITLE, removeFromPlate, serveDish, startCooking, stopCooking, tick } from './state.js';
import { layout, render, VIEW_H, VIEW_W } from './render.js';
import { setMuted, sfxChop, sfxClick, sfxError, sfxLose, sfxOrder, sfxPerfect, sfxServe, sfxSizzle, sfxStart, sfxWin } from './audio.js';
import { stageShot } from './shots.js';

const BEST_KEY = 'dapur-kilat-best';
const STEP = 1 / 60;
/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

/** A small deterministic PRNG so a seed always deals the same orders. */
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let game = shot ? stageShot(shot, mulberry32(seed)) : createGame(mulberry32(seed));
let best = 0;
try {
  best = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
} catch {
  best = 0;
}

function saveBest() {
  if (game.coins > best) {
    best = game.coins;
    try {
      window.localStorage.setItem(BEST_KEY, String(best));
    } catch {
      // Private mode: the record simply does not persist.
    }
  }
}

function announce(text) {
  status.textContent = text;
}

function startShift() {
  game = createGame(mulberry32(Math.floor(Math.random() * 4294967296)));
  game.phase = PHASE_PLAY;
  announce('Shift dimulai. Rakit pesanan, masak, sajikan.');
  sfxStart();
}

function endShiftSounds() {
  saveBest();
  if (game.won) sfxWin();
  else sfxLose();
}

function inRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function handleAction(action, arg) {
  if (action === 'toggle-mute') {
    game.muted = !game.muted;
    setMuted(game.muted);
    return;
  }
  if (game.phase === PHASE_TITLE) {
    if (action === 'confirm') startShift();
    return;
  }
  if (game.phase === PHASE_OVER) {
    if (action === 'confirm' || action === 'restart') startShift();
    return;
  }
  if (action === 'pause') {
    if (game.phase === PHASE_PLAY) {
      game.phase = PHASE_PAUSED;
      announce('Jeda.');
    } else if (game.phase === PHASE_PAUSED) {
      game.phase = PHASE_PLAY;
      announce('Lanjut.');
    }
    return;
  }
  if (game.phase !== PHASE_PLAY) return;
  if (action === 'ingredient') {
    const result = addIngredient(game, arg);
    if (result === 'ok') sfxChop();
    else if (result === 'full') sfxError();
    else if (result === 'cooked') sfxError();
    return;
  }
  if (action === 'plate-slot') {
    if (removeFromPlate(game, arg)) sfxClick();
    return;
  }
  if (action === 'wok') {
    if (game.cooking) {
      const outcome = stopCooking(game);
      if (outcome === 'perfect') sfxPerfect();
      else if (outcome === 'burnt') sfxError();
      else if (outcome === 'cooked') sfxServe();
    } else if (startCooking(game)) {
      sfxSizzle();
    } else {
      sfxError();
    }
    return;
  }
  if (action === 'serve') {
    const result = serveDish(game);
    if (result === 'served') sfxServe();
    else if (result === 'wrong') sfxError();
    return;
  }
  if (action === 'trash') {
    const result = clearPlate(game);
    if (result !== 'empty') sfxClick();
    return;
  }
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  const { x, y } = canvasPoint(event);
  const L = layout();
  if (inRect(x, y, L.mute)) {
    handleAction('toggle-mute');
    return;
  }
  if (game.phase === PHASE_TITLE && inRect(x, y, L.start)) {
    handleAction('confirm');
    return;
  }
  if (game.phase === PHASE_OVER && inRect(x, y, L.restart)) {
    handleAction('restart');
    return;
  }
  if (game.phase !== PHASE_PLAY) return;
  for (const bin of L.bins) {
    if (inRect(x, y, bin)) {
      handleAction('ingredient', bin.id);
      return;
    }
  }
  for (let i = 0; i < L.plateSlots.length; i += 1) {
    if (inRect(x, y, L.plateSlots[i])) {
      const id = game.plate[i];
      if (id) handleAction('plate-slot', id);
      return;
    }
  }
  if (inRect(x, y, L.wok)) {
    handleAction('wok');
    return;
  }
  if (inRect(x, y, L.serve)) {
    handleAction('serve');
    return;
  }
  if (inRect(x, y, L.trash)) {
    handleAction('trash');
  }
});

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key >= '1' && key <= '9') {
    const index = Number.parseInt(key, 10) - 1;
    const ingredients = ['nasi', 'mie', 'telur', 'ayam', 'bakso', 'sayur', 'kecap', 'bumbu', 'kuah'];
    handleAction('ingredient', ingredients[index]);
    return;
  }
  if (key === ' ') {
    event.preventDefault();
    handleAction('wok');
  } else if (key === 'enter') {
    if (game.phase === PHASE_TITLE || game.phase === PHASE_OVER) handleAction('confirm');
    else handleAction('serve');
  } else if (key === 'backspace') {
    handleAction('trash');
  } else if (key === 'p') {
    handleAction('pause');
  } else if (key === 'r') {
    if (game.phase === PHASE_OVER || game.phase === PHASE_PAUSED) handleAction('restart');
  } else if (key === 'm') {
    handleAction('toggle-mute');
  }
});

let last = performance.now();

function frame(now) {
  const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
  last = now;
  if (!shot && game.phase === PHASE_PLAY) {
    let remaining = elapsed;
    while (remaining > 0) {
      const dt = Math.min(STEP, remaining);
      const before = game.orders.length;
      tick(game, dt);
      if (game.orders.length > before) sfxOrder();
      if (game.phase === PHASE_OVER) {
        endShiftSounds();
        break;
      }
      remaining -= dt;
    }
  } else if (!shot && game.phase === PHASE_TITLE) {
    game.time += elapsed;
  }
  render(ctx, game, best, now / 1000);
  requestAnimationFrame(frame);
}

if (shot) {
  render(ctx, game, best, 1.2);
  render(ctx, game, best, 1.2);
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}
