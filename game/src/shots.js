// The screenshot scenes behind ?shot=start|play|serve. Each one stages a real
// game state — no fake pixels, no composited frames — so the screenshots are
// what a short game really looks like, and the same seed always gives the same
// frame. After staging, the scene paints twice and sets window.__shotReady
// for the screenshot tool.

import { createGame, PHASE_PLAY } from './state.js';

/** A fixed mid-shift state: three orders, a plate mid-assembly, the wok hot. */
function stagePlay(game) {
  game.phase = PHASE_PLAY;
  game.time = 29;
  game.coins = 85;
  game.combo = 3;
  game.bestCombo = 3;
  game.served = 4;
  game.perfects = 2;
  game.orders = [
    { id: 1, dishId: 'nasgor', patience: 32, patienceMax: 44 },
    { id: 2, dishId: 'miegor', patience: 24, patienceMax: 40 },
    { id: 3, dishId: 'bakso', patience: 40, patienceMax: 48 },
  ];
  game.plate = ['nasi', 'telur'];
  game.cooking = { dish: { id: 'nasgor', name: 'Nasi Goreng', recipe: ['nasi', 'telur', 'kecap'], price: 20, cook: 3.0, color: '#d98e32' }, t: 1.86, duration: 3.0 };
  game.message = 'Nasi Goreng di wajan — angkat di zona hijau!';
  game.messageT = 99;
}

/** A finished plate, ready to serve, with its order waiting on the board. */
function stageServe(game) {
  game.phase = PHASE_PLAY;
  game.time = 108;
  game.coins = 120;
  game.combo = 2;
  game.bestCombo = 4;
  game.served = 6;
  game.perfects = 3;
  game.orders = [
    { id: 7, dishId: 'nasgor', patience: 18, patienceMax: 36 },
    { id: 8, dishId: 'sate', patience: 27, patienceMax: 42 },
  ];
  game.plate = ['nasi', 'telur', 'kecap'];
  game.cookedDish = { id: 'nasgor', name: 'Nasi Goreng', recipe: ['nasi', 'telur', 'kecap'], price: 20, cook: 3.0, color: '#d98e32' };
  game.message = 'Sempurna! Nasi Goreng matang pas.';
  game.messageT = 99;
  game.flash = 0.3;
}

/**
 * Stage one scene on a fresh game and return it. Unknown names fall back to
 * the title screen. The caller paints the result twice, then flags readiness.
 */
export const SHOT_NAMES = ['start', 'play', 'serve'];

export function stageShot(name, random) {
  const game = createGame(random);
  if (name === 'play') stagePlay(game);
  else if (name === 'serve') stageServe(game);
  return game;
}
