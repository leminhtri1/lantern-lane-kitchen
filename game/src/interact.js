// The one verb the cook has: use the station in front (crate, board, heat, plates, bin, hatch).
import { CHOP_SECONDS, CHOP_STROKE } from './config.js';
import { INGREDIENTS, canChop, newItem } from './ingredients.js';
import { isCookStation } from './kitchen-layout.js';
import { dishSpecs, matchRecipe, plateAccepts } from './recipes.js';
import { addToCook, cookAccepts, stationHasRoom } from './stations.js';
import { serveDish } from './orders.js';
import { perk } from './upgrades.js';

function refuse(state, station, text) {
	state.events.push({ type: 'refuse', station, text });
	return false;
}

function took(state, station, what) {
	state.events.push({ type: 'pickup', station, what });
	return true;
}

function placed(state, station, what) {
	state.events.push({ type: 'place', station, what });
	return true;
}

function itemOntoPlate(state, plate, item) {
	const specs = dishSpecs(state);
	if (!plateAccepts(plate, item, specs)) return false;
	item.progress = 0;
	plate.items.push(item);
	if (matchRecipe(plate, specs)) state.events.push({ type: 'complete', plate });
	return true;
}

function whyNot(state, item) {
	if (item.state === 'burnt') return 'Burnt! Bin it';
	if (canChop(item)) return 'Chop it first';
	const steps = INGREDIENTS[item.ing].steps[item.state];
	if (steps) return `${Object.keys(steps).map((t) => (t === 'board' ? 'chop' : t)).join(' or ')} it first`;
	return 'Not on tonight\'s menu';
}

function useCrate(state, station, player) {
	if (!player.held) {
		player.held = newItem(station.ing);
		return took(state, station, player.held);
	}
	if (player.held.kind === 'item' && player.held.ing === station.ing && player.held.state === 'raw') {
		player.held = null;
		return placed(state, station, null);
	}
	return refuse(state, station, 'Hands full');
}

function usePlates(state, station, player) {
	if (!player.held) {
		player.held = { kind: 'plate', items: [] };
		return took(state, station, player.held);
	}
	if (player.held.kind === 'plate' && player.held.items.length === 0) {
		player.held = null;
		return placed(state, station, null);
	}
	return refuse(state, station, 'Hands full');
}

function useTrash(state, station, player) {
	const held = player.held;
	if (!held) return refuse(state, station, 'Nothing to bin');
	if (held.kind === 'plate') {
		if (held.items.length === 0) return refuse(state, station, 'Plate is empty');
		held.items = [];
	} else player.held = null;
	state.events.push({ type: 'trash', station });
	return true;
}

function useSurface(state, station, player) {
	const held = player.held;
	const there = station.held;
	if (!held && there) {
		player.held = there;
		station.held = null;
		return took(state, station, there);
	}
	if (held && !there) {
		if (station.type === 'board' && held.kind === 'plate') return refuse(state, station, 'Boards are for chopping');
		station.held = held;
		player.held = null;
		return placed(state, station, held);
	}
	if (held?.kind === 'plate' && there?.kind === 'item') {
		if (!itemOntoPlate(state, held, there)) return refuse(state, station, whyNot(state, there));
		station.held = null;
		return placed(state, station, held);
	}
	if (held?.kind === 'item' && there?.kind === 'plate') {
		if (!itemOntoPlate(state, there, held)) return refuse(state, station, whyNot(state, held));
		player.held = null;
		return placed(state, station, there);
	}
	if (held?.kind === 'plate' && there?.kind === 'plate') {
		const merged = { kind: 'plate', items: [...held.items] };
		for (const item of there.items) if (!itemOntoPlate(state, merged, item)) return refuse(state, station, 'Those don\'t go together');
		held.items = merged.items;
		there.items = [];
		return placed(state, station, held);
	}
	return refuse(state, station, held ? 'Spot taken' : 'Nothing here');
}

function useCook(state, station, player) {
	const held = player.held;
	if (held?.kind === 'item') {
		if (cookAccepts(station, held)) {
			addToCook(station, held);
			player.held = null;
			return placed(state, station, held);
		}
		if (!stationHasRoom(station)) return refuse(state, station, 'It\'s full');
		return refuse(state, station, held.state === 'burnt' ? 'Burnt! Bin it' : `Can't ${station.type === 'pot' ? 'boil' : station.type} that`);
	}
	if (held?.kind === 'plate') {
		let moved = 0;
		for (let i = 0; i < station.items.length; i += 1) {
			const item = station.items[i];
			if (item.progress < 1 || item.state === 'burnt') continue;
			if (itemOntoPlate(state, held, item)) {
				station.items.splice(i, 1);
				i -= 1;
				moved += 1;
			}
		}
		if (moved > 0) return placed(state, station, held);
		if (station.items.some((item) => item.state === 'burnt')) return refuse(state, station, 'Burnt! Bin it');
		if (station.items.some((item) => item.progress < 1)) return refuse(state, station, 'Still cooking');
		return refuse(state, station, station.items.length ? 'Doesn\'t fit that plate' : 'Nothing cooking');
	}
	if (station.items.length === 0) return refuse(state, station, 'Nothing cooking');
	let index = station.items.findIndex((item) => item.state === 'burnt');
	if (index === -1) index = station.items.findIndex((item) => item.progress >= 1);
	if (index === -1) index = station.items.length - 1;
	const [item] = station.items.splice(index, 1);
	if (item.progress < 1 && item.state !== 'burnt') item.progress = 0;
	player.held = item;
	return took(state, station, item);
}

function useServe(state, station, player) {
	const held = player.held;
	if (held?.kind !== 'plate') return refuse(state, station, held ? 'Plate it first' : 'Bring a finished plate');
	const result = serveDish(state, held, station);
	if (!result.ok) return refuse(state, station, result.reason);
	player.held = null;
	return true;
}

export function useStation(state, station) {
	const player = state.player;
	if (!station || station.type === 'decor') return false;
	if (station.type === 'board' && canChop(station.held)) return startChop(state, station);
	if (station.type === 'crate') return useCrate(state, station, player);
	if (station.type === 'plates') return usePlates(state, station, player);
	if (station.type === 'trash') return useTrash(state, station, player);
	if (station.type === 'serve') return useServe(state, station, player);
	if (isCookStation(station)) return useCook(state, station, player);
	return useSurface(state, station, player);
}

function startChop(state, station) {
	state.player.chopping = station;
	state.player.chopStroke = 0;
	chopStroke(state, station);
	if (station.held.progress > 0) station.held.progress = Math.min(0.95, station.held.progress + 0.12);
	return true;
}

function chopStroke(state, station) {
	state.events.push({ type: 'chop', station, item: station.held });
}

export function chopTick(state, station, dt) {
	const item = station.held;
	if (!canChop(item)) return false;
	item.progress += (dt * perk(state, 'knife', 1.4)) / CHOP_SECONDS;
	state.player.chopStroke += dt;
	if (state.player.chopStroke >= CHOP_STROKE) {
		state.player.chopStroke -= CHOP_STROKE;
		chopStroke(state, station);
	}
	if (item.progress >= 1) {
		item.state = 'chopped';
		item.progress = 0;
		state.events.push({ type: 'chopped', station, item });
		return false;
	}
	return true;
}
