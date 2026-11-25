// One night at the stall: its state and the fixed step that advances it.
import { SHIFT_SECONDS } from './config.js';
import { createKitchen } from './kitchen-layout.js';
import { NIGHTS } from './recipes.js';
import { createPlayer, facingStation, movePlayer, walkTo } from './player.js';
import { chopTick, useStation } from './interact.js';
import { canChop } from './ingredients.js';
import { updateStations } from './stations.js';
import { addOrder, isRushHour, updateOrders } from './orders.js';
import { createEffects, updateEffects } from './effects.js';
import { ambientEffects, applyFeedback } from './feedback.js';

export function createShift(nightIndex, random, perks = []) {
	const night = NIGHTS[nightIndex];
	const state = {
		nightIndex,
		perks: new Set(perks),
		night,
		menu: night.menu,
		random,
		clock: 0,
		duration: SHIFT_SECONDS,
		timeLeft: SHIFT_SECONDS,
		coins: 0,
		served: 0,
		servedLog: [],
		missed: 0,
		tips: 0,
		combo: 0,
		bestCombo: 0,
		orders: [],
		orderSeq: 0,
		nextOrderIn: 7,
		kitchen: createKitchen(),
		player: createPlayer(5, 2),
		fx: createEffects(),
		events: [],
		banner: { text: night.title, sub: `Night ${nightIndex + 1} · the stall is open!`, time: 2.6 },
		rushAnnounced: false,
		autoChop: false,
		over: false,
	};
	addOrder(state, night.menu[0], { extra: null });
	return state;
}

export const NO_CONTROLS = { dir: { x: 0, y: 0 }, usePressed: false, useHeld: false, clicks: [] };

function handleUse(state, station, byMouse) {
	if (!station) return;
	const wasChopping = state.player.chopping === station;
	if (wasChopping) {
		chopTick(state, station, 0.12);
		return;
	}
	useStation(state, station);
	if (!state.player.chopping && station.type === 'board' && canChop(station.held) && !state.player.held) {
		state.player.chopping = station;
		state.player.chopStroke = 0;
	}
	if (state.player.chopping) state.autoChop = byMouse;
}

export function stepShift(state, dt, controls) {
	state.events = [];
	state.clock += dt;
	const player = state.player;
	player.bump = Math.max(0, player.bump - dt);
	if (state.banner) {
		state.banner.time -= dt;
		if (state.banner.time <= 0) state.banner = null;
	}
	if (state.over) {
		updateEffects(state.fx, dt);
		return;
	}

	const before = Math.ceil(state.timeLeft);
	state.timeLeft = Math.max(0, state.timeLeft - dt);
	if (state.timeLeft <= 10 && Math.ceil(state.timeLeft) !== before) state.events.push({ type: 'tick' });

	for (const click of controls.clicks) {
		player.chopping = null;
		walkTo(player, state.kitchen, click.x, click.y);
	}
	const arrived = movePlayer(player, state.kitchen, controls.dir, dt);
	player.target = facingStation(player, state.kitchen);
	if (player.moving) player.chopping = null;
	if (arrived) handleUse(state, arrived, true);
	else if (controls.usePressed) handleUse(state, player.target, false);

	if (player.chopping) {
		const keep = state.autoChop || controls.useHeld;
		if (!keep || !chopTick(state, player.chopping, dt)) player.chopping = null;
	}

	updateStations(state, dt);
	updateOrders(state, dt);

	if (!state.rushAnnounced && isRushHour(state)) {
		state.rushAnnounced = true;
		state.banner = { text: 'Rush hour!', sub: 'The lanterns are lit and the street is full', time: 2.4 };
		state.events.push({ type: 'rush' });
	}
	if (state.timeLeft <= 0) {
		state.over = true;
		player.chopping = null;
		state.events.push({ type: 'shiftEnd' });
	}

	applyFeedback(state);
	ambientEffects(state, dt);
	updateEffects(state.fx, dt);
}

export function idleShift(state, dt) {
	state.events = [];
	state.clock += dt;
	ambientEffects(state, dt);
	updateEffects(state.fx, dt);
}
