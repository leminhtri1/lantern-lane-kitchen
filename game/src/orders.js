// The ticket rail: customers order from tonight's menu at a pace set by the rush curve, each
// ticket's patience drains, a dish served fast earns a tip, back-to-back serves build a combo, and
// a ticket that runs out costs coins and breaks the combo.
import { MAX_TICKETS, MISS_PENALTY } from './config.js';
import { RECIPES, matchRecipe } from './recipes.js';

function smooth(a, b, x) {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
}

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
	const menu = state.menu.filter((id) => state.orders.filter((o) => o.recipe === id).length < 2);
	const pool = menu.length ? menu : state.menu;
	return pool[Math.floor(state.random() * pool.length)];
}

export function addOrder(state, recipeId = pickRecipe(state), patienceShare = 1, vip = false) {
	const patience = patienceFor(state, recipeId) * (vip ? 0.8 : 1);
	const order = {
		id: state.orderSeq,
		recipe: recipeId,
		patience: patience * patienceShare,
		maxPatience: patience,
		age: 0,
		customer: state.orderSeq % 7,
		leaving: 0,
		outcome: null,
		vip,
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
		if (live.length < MAX_TICKETS) {
			const vip = state.nightIndex >= 1 && !live.some((o) => o.vip) && state.random() < 0.16;
			addOrder(state, pickRecipe(state), 1, vip);
		}
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
	const tip = Math.round(recipe.price * 0.6 * share) * (best.vip ? 2 : 1);
	state.combo += 1;
	state.bestCombo = Math.max(state.bestCombo, state.combo);
	const comboBonus = Math.min(5, state.combo - 1) * 3;
	const coins = recipe.price * (best.vip ? 2 : 1) + tip + comboBonus;
	state.coins += coins;
	state.served += 1;
	state.servedLog.push(recipeId);
	state.tips += tip;
	best.outcome = 'served';
	best.plate = plate;
	state.events.push({ type: 'served', order: best, coins, tip, combo: state.combo, vip: best.vip, station });
	return { ok: true, coins };
}

export function starsFor(state) {
	return state.night.stars.filter((need) => state.coins >= need).length;
}
