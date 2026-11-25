// The menu of Dapur Kilat: every ingredient on the counter, every dish on the
// order board, and how new orders arrive. Recipes are multisets of ingredient
// ids: the plate matches a dish when its contents are exactly that dish's
// ingredients, in any order. Prices are the base coins a served dish pays.
// Balance: two quick 2-ingredient dishes are cheap, the 3-ingredient dishes
// pay more, and Gado-Gado pays most for the longest recipe.

export const INGREDIENTS = [
  { id: 'nasi',   name: 'Nasi',   key: '1', color: '#f5efe0', dark: '#cbb98f' },
  { id: 'mie',    name: 'Mie',    key: '2', color: '#f2c14e', dark: '#b98a1d' },
  { id: 'telur',  name: 'Telur',  key: '3', color: '#fff3c4', dark: '#e0a800' },
  { id: 'ayam',   name: 'Ayam',   key: '4', color: '#e07840', dark: '#9c4a1e' },
  { id: 'bakso',  name: 'Bakso',  key: '5', color: '#8a5a33', dark: '#5d3a1e' },
  { id: 'sayur',  name: 'Sayur',  key: '6', color: '#58b368', dark: '#2f7a3e' },
  { id: 'kecap',  name: 'Kecap',  key: '7', color: '#3a2418', dark: '#1d0f08' },
  { id: 'bumbu',  name: 'Bumbu',  key: '8', color: '#e2703a', dark: '#a34a1c' },
  { id: 'kuah',   name: 'Kuah',   key: '9', color: '#e8a34c', dark: '#b5771f' },
];

export const DISHES = [
  { id: 'nasgor', name: 'Nasi Goreng', recipe: ['nasi', 'telur', 'kecap'], price: 20, cook: 3.0, color: '#d98e32' },
  { id: 'miegor', name: 'Mie Goreng',  recipe: ['mie', 'telur', 'sayur'],  price: 20, cook: 3.0, color: '#e0a83c' },
  { id: 'bakso',  name: 'Bakso Kuah',  recipe: ['bakso', 'mie', 'kuah'],   price: 25, cook: 4.0, color: '#a06a35' },
  { id: 'sate',   name: 'Sate Ayam',   recipe: ['ayam', 'bumbu'],          price: 25, cook: 4.0, color: '#c65a2e' },
  { id: 'gado',   name: 'Gado-Gado',   recipe: ['sayur', 'telur', 'bumbu'], price: 30, cook: 2.5, color: '#4d9e57' },
];

export const ingredientById = (id) => INGREDIENTS.find((item) => item.id === id);
export const dishById = (id) => DISHES.find((dish) => dish.id === id);

/** The dish whose recipe equals the plate's ingredients, or null. */
export function matchDish(plate) {
  const have = [...plate].sort().join(',');
  return DISHES.find((dish) => [...dish.recipe].sort().join(',') === have) ?? null;
}

/** Seconds an order waits before the customer walks out, by shift progress 0..1. */
export function orderPatience(progress) {
  return 48 - 18 * progress;
}

/** Seconds between new orders, by shift progress 0..1. */
export function spawnInterval(progress) {
  return 15 - 6 * progress;
}

/** Pick the next dish to order: cheap dishes early, the whole menu once the rush starts. */
export function pickDish(random, progress) {
  const pool = progress < 0.35 ? DISHES.slice(0, 3) : DISHES;
  return pool[Math.floor(random() * pool.length)];
}

/** Tip for serving with `patienceLeft` of `patienceMax` seconds still on the clock. */
export function tipFor(dish, patienceLeft, patienceMax, rush) {
  const base = Math.round(dish.price * 0.5 * (patienceLeft / patienceMax));
  return rush ? base * 2 : base;
}
