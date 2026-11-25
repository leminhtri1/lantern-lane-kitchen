// The deterministic screenshot scenes behind ?shot=rush|rush-hour|recipes|results.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import { createShift } from './shift.js';
import { stationAt, tileCenter } from './kitchen-layout.js';
import { addToCook } from './stations.js';
import { addOrder } from './orders.js';
import { extraByLabel } from './modifiers.js';
import { emit, floatText, updateEffects } from './effects.js';
import { ambientEffects, applyFeedback } from './feedback.js';
import { facingStation } from './player.js';

function item(ing, state = 'raw', progress = 0) {
	return { kind: 'item', ing, state, progress, cookTo: null };
}

function plate(...parts) {
	return { kind: 'plate', items: parts.map((p) => item(...p.split(':'))) };
}

function at(state, c, r) {
	return stationAt(state.kitchen, c, r);
}

function cook(state, c, r, ing, from, progress) {
	const station = at(state, c, r);
	const it = item(ing, from);
	addToCook(station, it);
	it.progress = progress;
	if (progress >= 1) it.state = it.cookTo;
	return it;
}

function setOrders(state, list) {
	state.orders = [];
	for (const [recipe, share, opts] of list) {
		const order = addOrder(state, recipe, { share, extra: null, ...opts });
		order.age = 5;
	}
	state.events = [];
}

function placeCook(state, c, r, fx, fy, dy = 0) {
	const p = tileCenter(c, r);
	state.player.x = p.x;
	state.player.y = p.y + dy;
	state.player.fx = fx;
	state.player.fy = fy;
	state.player.target = facingStation(state.player, state.kitchen);
}

function settle(state, seconds, perStep) {
	const steps = Math.round(seconds / STEP);
	for (let i = 0; i < steps; i += 1) {
		state.events = [];
		state.clock += STEP;
		if (perStep) perStep(i);
		applyFeedback(state);
		ambientEffects(state, STEP);
		updateEffects(state.fx, STEP);
	}
	state.events = [];
}

export function dressKitchen(state) {
	cook(state, 1, 0, 'noodles', 'raw', 0.4);
	cook(state, 1, 0, 'egg', 'raw', 0.4);
	cook(state, 4, 0, 'rice', 'raw', 0.5);
	cook(state, 7, 0, 'bun', 'raw', 0.3);
	cook(state, 9, 0, 'chicken', 'chopped', 0.6);
	at(state, 5, 3).held = plate('noodles:boiled', 'egg:boiled', 'scallion:chopped');
	at(state, 3, 3).held = item('mango');
	state.orders = [];
	settle(state, 1.5);
}

function stageRush(seed) {
	const state = createShift(2, createRandom(seed));
	state.timeLeft = 74;
	state.rushAnnounced = true;
	state.banner = null;
	state.coins = 236;
	state.combo = 3;
	state.bestCombo = 4;
	state.served = 7;
	setOrders(state, [
		['skewers', 0.17],
		['friedrice', 0.42, { extra: extraByLabel('friedrice', 'Double egg'), table: 2 }],
		['dumplings', 0.5, { table: 2 }],
		['bao', 0.7, { vip: true }],
		['soup', 0.93, { extra: extraByLabel('soup', 'No scallion') }],
	]);
	state.focusId = state.orders[3].id;
	cook(state, 1, 0, 'noodles', 'raw', 0.62);
	cook(state, 2, 0, 'egg', 'raw', 0.55);
	cook(state, 2, 0, 'egg', 'raw', 0.55);
	cook(state, 4, 0, 'rice', 'raw', 0.45);
	cook(state, 4, 0, 'egg', 'raw', 0.45);
	cook(state, 4, 0, 'egg', 'raw', 0.45);
	cook(state, 8, 0, 'cabbage', 'chopped', 0.85);
	cook(state, 9, 0, 'chicken', 'chopped', 1.62);
	cook(state, 9, 0, 'mushroom', 'raw', 1.62);
	at(state, 3, 0).held = item('egg');
	at(state, 4, 3).held = item('scallion', 'raw', 0.55);
	at(state, 5, 3).held = plate('bun:steamed');
	at(state, 6, 3).held = item('cabbage');
	at(state, 7, 3).held = item('mango');
	at(state, 3, 3).held = item('bun');
	at(state, 11, 1).held = plate('pork:steamed', 'cabbage:steamed');
	at(state, 11, 4).held = plate('chicken:grilled', 'mushroom:grilled');
	at(state, 9, 6).held = item('mushroom', 'chopped');
	placeCook(state, 4, 2, 0, 1, 14);
	state.player.chopping = at(state, 4, 3);
	const board = at(state, 4, 3);
	settle(state, 1.4, (i) => {
		if (i % 8 === 0) state.events.push({ type: 'chop', station: board, item: board.held });
	});
	const hatch = tileCenter(11, 2);
	floatText(state.fx, hatch.x - 40, hatch.y - 20, '+46', '#ffd85e', 34, 1.4);
	floatText(state.fx, hatch.x - 40, hatch.y + 20, 'Combo x3', '#ff9fd0', 22, 1.3);
	emit(state.fx, state.random, 'spark', hatch.x - 10, hatch.y, 14, { colors: ['#ffd166', '#fff4b0'], speed: 120, life: 0.8, size: 8 });
	updateEffects(state.fx, 0.12);
	return { state, screen: 'play', ui: { time: 0 } };
}

function stageRushHour(seed) {
	const state = createShift(3, createRandom(seed));
	state.timeLeft = 106;
	state.rushAnnounced = true;
	state.banner = { text: 'Rush hour!', sub: 'The lanterns are lit and the street is full', time: 1.2 };
	state.coins = 168;
	state.combo = 4;
	state.bestCombo = 4;
	setOrders(state, [
		['shrimpsoup', 0.3],
		['dumplings', 0.5],
		['mango', 0.64],
		['bao', 0.8],
		['friedrice', 0.96],
	]);
	state.orders[3].vip = true;
	cook(state, 4, 0, 'rice', 'raw', 0.7);
	cook(state, 4, 0, 'egg', 'raw', 0.7);
	cook(state, 2, 0, 'noodles', 'raw', 0.3);
	cook(state, 7, 0, 'rice', 'raw', 0.85);
	cook(state, 8, 0, 'pork', 'chopped', 0.5);
	cook(state, 8, 0, 'cabbage', 'chopped', 0.5);
	cook(state, 10, 0, 'shrimp', 'raw', 2.4);
	at(state, 5, 3).held = plate('bun:steamed');
	at(state, 6, 3).held = item('mango', 'chopped');
	at(state, 3, 3).held = item('noodles');
	at(state, 9, 6).held = item('mushroom', 'raw', 0.3);
	at(state, 7, 6).held = item('scallion', 'chopped');
	state.player.held = plate('noodles:boiled', 'shrimp:grilled', 'scallion:chopped');
	placeCook(state, 10, 2, 1, 0, 30);
	settle(state, 1.6);
	return { state, screen: 'play', ui: { time: 0 } };
}

function stageRecipeBook(seed) {
	const state = createShift(4, createRandom(seed));
	state.timeLeft = 131;
	state.coins = 96;
	setOrders(state, [
		['stirfry', 0.6],
		['bao', 0.8],
		['soup', 0.95],
	]);
	cook(state, 5, 0, 'mushroom', 'chopped', 0.4);
	cook(state, 1, 0, 'noodles', 'raw', 0.5);
	placeCook(state, 5, 2, 0, -1);
	settle(state, 1);
	return { state, screen: 'paused', ui: { time: 1.4 } };
}

function stageResults(seed) {
	const state = createShift(2, createRandom(seed));
	state.timeLeft = 0;
	state.over = true;
	state.banner = null;
	state.coins = 287;
	state.served = 9;
	state.missed = 1;
	state.tips = 74;
	state.bestCombo = 6;
	state.servedLog = ['soup', 'skewers', 'dumplings', 'friedrice', 'soup', 'bao', 'mango', 'dumplings', 'friedrice'];
	state.orders = [];
	cook(state, 4, 0, 'rice', 'raw', 0.5);
	cook(state, 1, 0, 'noodles', 'raw', 0.5);
	at(state, 5, 3).held = plate('rice:steamed', 'mango:chopped');
	placeCook(state, 6, 4, 0, -1);
	settle(state, 1.2);
	return { state, screen: 'results', ui: { time: 2, age: 5, stars: 2, canAdvance: true, newUnlock: true, bank: 412, perks: ['knife'] } };
}

export function stageShot(name, seed) {
	if (name === 'rush-hour') return stageRushHour(seed);
	if (name === 'recipes') return stageRecipeBook(seed);
	if (name === 'results') return stageResults(seed);
	return stageRush(seed);
}
