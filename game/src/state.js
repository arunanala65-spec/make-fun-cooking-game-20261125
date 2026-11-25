// The rules engine of Dapur Kilat: one shift, its orders, its plate and its wok.
// Pure state plus small actions; the renderer only reads it, the loop only ticks
// it. A shift lasts SHIFT_SECONDS; reach TARGET_COINS before the clock runs out
// to win. Three hearts: one is lost when an order's patience runs out.

import { DISHES, ingredientById, matchDish, orderPatience, pickDish, spawnInterval, tipFor } from './recipes.js';

export const SHIFT_SECONDS = 180;
export const TARGET_COINS = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 3;
export const PLATE_SLOTS = 4;

/** Where the cooking needle must stop: the green zone pays a perfect bonus. */
export const PERFECT_FROM = 0.55;
export const PERFECT_TO = 0.85;

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_PAUSED = 'paused';
export const PHASE_OVER = 'over';

export function createGame(random) {
  return {
    random,
    phase: PHASE_TITLE,
    time: 0,
    coins: 0,
    hearts: MAX_HEARTS,
    combo: 0,
    bestCombo: 0,
    served: 0,
    perfects: 0,
    burnt: 0,
    orders: [],
    nextOrderIn: 2,
    orderSeq: 0,
    plate: [],
    cookedDish: null,
    lastCookPerfect: false,
    cooking: null, // { dish, t, duration } while the wok is hot
    message: '',
    messageT: 0,
    won: false,
    muted: false,
    shake: 0,
    rush: false,
    flash: 0,
  };
}

export function progressOf(game) {
  return Math.min(1, game.time / SHIFT_SECONDS);
}

export function timeLeft(game) {
  return Math.max(0, SHIFT_SECONDS - game.time);
}

export function matchedDish(game) {
  return game.cookedDish ?? matchDish(game.plate);
}

function setMessage(game, text) {
  game.message = text;
  game.messageT = 2.2;
}

function spawnOrder(game) {
  const progress = progressOf(game);
  const dish = pickDish(game.random, progress);
  const patience = orderPatience(progress);
  game.orders.push({
    id: ++game.orderSeq,
    dishId: dish.id,
    patience,
    patienceMax: patience,
  });
}

function loseHeart(game, why) {
  game.hearts -= 1;
  game.combo = 0;
  setMessage(game, why);
  game.shake = 0.45;
  if (game.hearts <= 0) endShift(game, false);
}

function endShift(game, won) {
  game.phase = PHASE_OVER;
  game.won = won;
  game.cooking = null;
}

/** Add one ingredient to the plate. Returns 'ok' | 'full' | 'cooked'. */
export function addIngredient(game, id) {
  if (game.phase !== PHASE_PLAY) return 'idle';
  if (game.cookedDish) return 'cooked';
  if (game.plate.length >= PLATE_SLOTS) return 'full';
  game.plate.push(id);
  return 'ok';
}

/** Take one ingredient back off the plate (the last matching one). */
export function removeFromPlate(game, id) {
  const at = game.plate.lastIndexOf(id);
  if (at === -1) return false;
  game.plate.splice(at, 1);
  return true;
}

export function clearPlate(game) {
  if (game.cookedDish) {
    game.cookedDish = null;
    game.plate = [];
    return 'trashed-dish';
  }
  if (game.plate.length === 0) return 'empty';
  game.plate = [];
  return 'trashed';
}

/** Light the wok: only a plate that matches a recipe can cook. */
export function startCooking(game) {
  if (game.phase !== PHASE_PLAY || game.cooking || game.cookedDish) return false;
  const dish = matchDish(game.plate);
  if (!dish) return false;
  game.cooking = { dish, t: 0, duration: dish.cook };
  return true;
}

/**
 * Stop the wok. The needle at t / duration decides the result:
 * inside the green zone the dish comes out perfect, past 0.9 it burns,
 * anywhere else it is simply cooked. Returns the outcome or null.
 */
export function stopCooking(game) {
  if (!game.cooking) return null;
  const { dish, t, duration } = game.cooking;
  const at = t / duration;
  game.cooking = null;
  if (at > 0.9) {
    game.plate = [];
    game.burnt += 1;
    game.combo = 0;
    setMessage(game, 'Gosong! Hidangan hangus, buang dan rakit lagi.');
    return 'burnt';
  }
  game.cookedDish = dish;
  game.lastCookPerfect = at >= PERFECT_FROM && at <= PERFECT_TO;
  if (game.lastCookPerfect) {
    game.perfects += 1;
    setMessage(game, `Sempurna! ${dish.name} matang pas.`);
    return 'perfect';
  }
  setMessage(game, `${dish.name} matang — sajikan sekarang!`);
  return 'cooked';
}

/** Serve the finished dish to the order that wants it. */
export function serveDish(game) {
  if (game.phase !== PHASE_PLAY || !game.cookedDish) return 'none';
  const dish = game.cookedDish;
  const orderIndex = game.orders.findIndex((order) => order.dishId === dish.id);
  if (orderIndex === -1) {
    game.coins = Math.max(0, game.coins - 5);
    game.combo = 0;
    game.cookedDish = null;
    game.plate = [];
    setMessage(game, 'Tidak ada yang pesan itu — salah saji, −5 koin.');
    game.shake = 0.3;
    return 'wrong';
  }
  const order = game.orders[orderIndex];
  game.orders.splice(orderIndex, 1);
  const rush = game.rush;
  const tip = tipFor(dish, order.patience, order.patienceMax, rush);
  const perfect = game.lastCookPerfect;
  game.lastCookPerfect = false;
  const earned = dish.price + tip + (perfect ? Math.round(dish.price / 2) : 0);
  game.coins += earned;
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.served += 1;
  game.cookedDish = null;
  game.plate = [];
  game.flash = 0.5;
  setMessage(game, `Tersaji! ${dish.name} +${earned} koin${game.combo > 1 ? ` — kombo x${game.combo}` : ''}`);
  if (game.coins >= TARGET_COINS) endShift(game, true);
  return 'served';
}

/** Advance the shift by dt seconds: orders, patience, the clock, the rush. */
export function tick(game, dt) {
  if (game.phase !== PHASE_PLAY) return;
  game.time += dt;
  game.messageT = Math.max(0, game.messageT - dt);
  game.shake = Math.max(0, game.shake - dt);
  game.flash = Math.max(0, game.flash - dt);
  const progress = progressOf(game);
  game.rush = timeLeft(game) <= 30 && timeLeft(game) > 0;

  if (game.cooking) {
    game.cooking.t += dt;
    if (game.cooking.t / game.cooking.duration > 1) stopCooking(game);
  }

  game.nextOrderIn -= dt;
  if (game.nextOrderIn <= 0 && game.orders.length < MAX_ORDERS) {
    spawnOrder(game);
    game.nextOrderIn = spawnInterval(progress) * (0.8 + game.random() * 0.4);
  }

  for (let i = game.orders.length - 1; i >= 0; i -= 1) {
    const order = game.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      game.orders.splice(i, 1);
      loseHeart(game, `Pelanggan ${dishName(order.dishId)} pergi — kehabisan sabar!`);
      if (game.phase !== PHASE_PLAY) return;
    }
  }

  if (timeLeft(game) <= 0) endShift(game, game.coins >= TARGET_COINS);
}

export function dishName(dishId) {
  return DISHES.find((dish) => dish.id === dishId)?.name ?? dishId;
}

export function ingredientName(id) {
  return ingredientById(id)?.name ?? id;
}
