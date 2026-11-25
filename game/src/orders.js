// The ticket rail: arrivals, patience, VIPs, critics, tables of two, tips, combos and serving.
import { MAX_TICKETS, MISS_PENALTY } from './config.js';
import { RECIPES, dishSpecs, matchRecipe, plateKeys, sameParts } from './recipes.js';
import { EXTRA_PRICE, applyExtra, rollExtra } from './modifiers.js';
import { perk } from './upgrades.js';

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
	const tea = perk(state, 'tea', 1.15);
	return (44 + 15 * parts) * (1 - 0.035 * night) * (isRushHour(state) ? 0.92 : 1) * tea;
}

function pickRecipe(state) {
	const menu = state.menu.filter((id) => state.orders.filter((o) => o.recipe === id).length < 2);
	const pool = menu.length ? menu : state.menu;
	return pool[Math.floor(state.random() * pool.length)];
}

/** opts: { share, vip, critic, table, extra } (extra: undefined rolls one, null forces none). */
export function addOrder(state, recipeId = pickRecipe(state), opts = {}) {
	const { share = 1, vip = false, critic = false, table = 0 } = opts;
	const extra = opts.extra === undefined ? rollExtra(state, recipeId) : opts.extra;
	const patience = patienceFor(state, recipeId) * (vip ? 0.8 : critic ? 0.75 : 1) * (table ? 1.15 : 1);
	const order = {
		id: state.orderSeq,
		recipe: recipeId,
		extra,
		parts: applyExtra(RECIPES[recipeId].parts, extra),
		patience: patience * share,
		maxPatience: patience,
		age: 0,
		customer: state.orderSeq % 7,
		leaving: 0,
		outcome: null,
		vip,
		critic,
		table,
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

/** A new arrival: one customer, a VIP or a critic, or from night 3 a table of two ordering a set. */
function spawnCustomers(state, live) {
	const r = state.random();
	const n = state.nightIndex;
	if (n >= 2 && live.length <= MAX_TICKETS - 2 && r < 0.22) {
		state.tableSeq = (state.tableSeq ?? 0) + 1;
		const table = (state.tableSeq % 8) + 1;
		addOrder(state, pickRecipe(state), { table });
		addOrder(state, pickRecipe(state), { table });
		return;
	}
	const special = !live.some((o) => o.vip || o.critic);
	if (n >= 3 && special && r > 0.88) addOrder(state, pickRecipe(state), { critic: true, extra: null });
	else addOrder(state, pickRecipe(state), { vip: n >= 1 && special && r > 0.8 });
}

export function updateOrders(state, dt) {
	const live = state.orders.filter((o) => !o.outcome);
	state.nextOrderIn -= dt * (live.length === 0 ? 3 : 1);
	if (state.nextOrderIn <= 0 && state.timeLeft > 8) {
		if (live.length < MAX_TICKETS) spawnCustomers(state, live);
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

/** Serve `plate` at the hatch: the most impatient ticket whose parts it matches takes it. */
export function serveDish(state, plate, station) {
	const keys = plateKeys(plate);
	const fits = state.orders.filter((o) => !o.outcome && sameParts(keys, o.parts));
	if (!fits.length) {
		const id = matchRecipe(plate, dishSpecs(state));
		if (!id) return { ok: false, reason: plate.items.length ? 'Not finished yet' : 'The plate is empty' };
		const asked = state.orders.find((o) => !o.outcome && o.recipe === id);
		return { ok: false, reason: asked ? `Check the ticket: ${asked.extra?.label ?? 'as listed'}` : `Nobody ordered ${RECIPES[id].short}` };
	}
	const best = fits.reduce((a, b) => (b.patience < a.patience ? b : a));
	const recipe = RECIPES[best.recipe];
	const share = Math.max(0, best.patience / best.maxPatience);
	const mult = best.vip ? 2 : best.critic ? (share > 0.5 ? 3 : 1) : 1;
	const price = recipe.price + (best.extra ? EXTRA_PRICE : 0);
	const tip = Math.round(recipe.price * 0.6 * share * perk(state, 'tipjar', 1.5)) * (best.vip ? 2 : 1);
	state.combo += 1;
	state.bestCombo = Math.max(state.bestCombo, state.combo);
	const comboBonus = Math.min(5, state.combo - 1) * 3;
	const half = (state.tableHalf ??= new Set());
	const tableBonus = best.table && half.has(best.table) ? 20 : 0;
	if (best.table) half.add(best.table);
	const coins = price * mult + tip + comboBonus + tableBonus;
	state.coins += coins;
	state.served += 1;
	state.servedLog.push(best.recipe);
	state.tips += tip;
	best.outcome = 'served';
	best.plate = plate;
	state.events.push({ type: 'served', order: best, coins, tip, combo: state.combo, vip: best.vip, critic: best.critic && share > 0.5, table: tableBonus, station });
	return { ok: true, coins };
}
export function starsFor(state) {
	return state.night.stars.filter((need) => state.coins >= need).length;
}
