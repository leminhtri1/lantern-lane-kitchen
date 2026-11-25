// The ticket rail: customers order from tonight's menu at a pace set by the rush curve, each
// ticket's patience drains, a dish served fast earns a tip, back-to-back serves build a combo, and
// a ticket that runs out costs coins and breaks the combo.
import { MAX_TICKETS, MISS_PENALTY } from './config.js';
import { RECIPES, matchRecipe } from './recipes.js';

function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * How busy the street is, 0..1, across the shift: a calm opening, a rush hour from about 40% to
 * 85% of the night, and a slightly softer last stretch.
 */
export function rushLevel(state) {
  const p = 1 - state.timeLeft / state.duration;
  const build = 0.18 + 0.82 * smooth(0.12, 0.45, p);
  const ease = 1 - 0.3 * smooth(0.86, 1, p);
  return Math.min(1, build * ease);
}

export function isRushHour(state) {
  return rushLevel(state) > 0.78;
}

export function patienceFor(state, recipeId) {
  const parts = RECIPES[recipeId].parts.length;
  const night = state.nightIndex;
  return (44 + 15 * parts) * (1 - 0.035 * night) * (isRushHour(state) ? 0.92 : 1);
}

function pickRecipe(state) {
  // Avoid a third copy of a dish already twice on the rail, so tickets stay varied.
  const menu = state.menu.filter((id) => state.orders.filter((o) => o.recipe === id).length < 2);
  const pool = menu.length ? menu : state.menu;
  return pool[Math.floor(state.random() * pool.length)];
}

export function addOrder(state, recipeId = pickRecipe(state), patienceShare = 1) {
  const patience = patienceFor(state, recipeId);
  const order = {
    id: state.orderSeq,
    recipe: recipeId,
    patience: patience * patienceShare,
    maxPatience: patience,
    age: 0,
    customer: state.orderSeq % 7,
    leaving: 0,
    outcome: null,
  };
  state.orderSeq += 1;
  state.orders.push(order);
  state.events.push({ type: 'order', order });
  return order;
}

function nextGap(state) {
  const [slow, fast] = state.night.spawn;
  const rush = rushLevel(state);
  const gap = slow + (fast - slow) * rush;
  return gap * (0.8 + 0.4 * state.random());
}

export function updateOrders(state, dt) {
  const live = state.orders.filter((o) => !o.outcome);
  state.nextOrderIn -= dt * (live.length === 0 ? 3 : 1);
  if (state.nextOrderIn <= 0 && state.timeLeft > 8) {
    if (live.length < MAX_TICKETS) addOrder(state);
    state.nextOrderIn = nextGap(state);
  }
  for (const order of state.orders) {
    order.age += dt;
    if (order.outcome) {
      order.leaving += dt;
      continue;
    }
    order.patience -= dt;
    if (order.patience <= 0) {
      order.outcome = 'missed';
      state.missed += 1;
      state.combo = 0;
      state.coins = Math.max(0, state.coins - MISS_PENALTY);
      state.events.push({ type: 'missed', order });
    }
  }
  state.orders = state.orders.filter((o) => !o.outcome || o.leaving < 0.9);
}

/** Serve `plate` at the hatch: the most impatient ticket for its dish takes it. */
export function serveDish(state, plate, station) {
  const recipeId = matchRecipe(plate, state.menu);
  if (!recipeId) return { ok: false, reason: plate.items.length ? 'Not finished yet' : 'The plate is empty' };
  let best = null;
  for (const order of state.orders) {
    if (order.outcome || order.recipe !== recipeId) continue;
    if (!best || order.patience < best.patience) best = order;
  }
  if (!best) return { ok: false, reason: `Nobody ordered ${RECIPES[recipeId].short}` };
  const recipe = RECIPES[recipeId];
  const share = Math.max(0, best.patience / best.maxPatience);
  const tip = Math.round(recipe.price * 0.6 * share);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const comboBonus = Math.min(5, state.combo - 1) * 3;
  const coins = recipe.price + tip + comboBonus;
  state.coins += coins;
  state.served += 1;
  state.servedLog.push(recipeId);
  state.tips += tip;
  best.outcome = 'served';
  best.plate = plate;
  state.events.push({ type: 'served', order: best, coins, tip, combo: state.combo, station });
  return { ok: true, coins };
}

/** Stars earned for the night so far (0..3). */
export function starsFor(state) {
  return state.night.stars.filter((need) => state.coins >= need).length;
}
