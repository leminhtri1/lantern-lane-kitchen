// Route planning: the stops for the focused ticket, a dotted path, the plan card, ghost slots.
import { FONT, TILE } from './config.js';
import { INGREDIENTS, TOOL_VERBS, partKey, resultOf, routeTo } from './ingredients.js';
import { tileAt, tileCenter } from './kitchen-layout.js';
import { RECIPES, missingParts, ordersFitting, plateKeys } from './recipes.js';
import { pathToStation } from './pathfind.js';
import { drawDish, drawIngredient, drawPlated } from './food-art.js';
import { drawToolIcon } from './tool-icons.js';
import { TAU, circle, path, rrect, text } from './paint.js';

const GOLD = '#ffd66b';

/** The ticket the guide follows: the picked one while it is live, else the most urgent. */
export function focusOrder(state) {
	const live = state.orders.filter((o) => !o.outcome);
	return live.find((o) => o.id === state.focusId) ?? live.reduce((a, o) => (!a || o.patience / o.maxPatience < a.patience / a.maxPatience ? o : a), null);
}

export function cycleFocus(state, step = 1) {
	const live = state.orders.filter((o) => !o.outcome);
	if (!live.length) return;
	const at = live.indexOf(focusOrder(state));
	state.focusId = live[(at + step + live.length) % live.length].id;
}

const dist = (a, b) => Math.abs(a.c - b.c) + Math.abs(a.r - b.r);

/** The plate (in hand, or on a counter) that is on its way to `order`, and where it is. */
function plateFor(state, order) {
	const held = state.player.held;
	if (held?.kind === 'plate' && ordersFitting(held, [order]).length) return { plate: held, at: null };
	let best = null;
	for (const s of state.kitchen.stations) {
		const p = s.held;
		if (p?.kind === 'plate' && p.items.length && ordersFitting(p, [order]).length && (!best || p.items.length > best.plate.items.length)) best = { plate: p, at: s };
	}
	return best ?? { plate: null, at: null };
}

/** Every stop still to make for `order`, in a sensible walking order. */
export function planRoute(state, order) {
	const { kitchen, player } = state;
	const stations = kitchen.stations;
	const { plate, at: plateAt } = plateFor(state, order);
	const missing = plate ? missingParts(plateKeys(plate), order.parts) : [...order.parts];
	const stops = [];
	const collect = [];
	const used = new Set();
	let from = tileAt(player.x, player.y);
	const near = (type, free) => {
		let best = null;
		for (const s of stations) if (s.type === type && !(free && (used.has(s) || s.held)) && (!best || dist(s, from) < dist(best, from))) best = s;
		return best ?? near(type, false);
	};
	const visit = (station, verb, key) => {
		stops.push({ station, verb, key });
		from = { c: station.c, r: station.r };
	};
	let inHand = player.held?.kind === 'item' ? player.held : null;
	for (const key of missing) {
		const [ing, want] = key.split(':');
		const ready = stations.find((s) => !used.has(s) && ((s.held?.kind === 'item' && (partKey(s.held) === key || (s.type === 'board' && s.held.ing === ing && resultOf(s.held, 'board') === want))) || s.items.some((i) => i.ing === ing && (i.state === want || i.cookTo === want))));
		if (ready) {
			used.add(ready);
			collect.push({ station: ready, key });
			continue;
		}
		let tools = routeTo(ing, want);
		if (inHand && inHand.ing === ing) {
			tools = tools.slice(routeTo(ing, inHand.state).length);
			inHand = null;
		} else visit(stations.find((s) => s.type === 'crate' && s.ing === ing), 'grab', key);
		tools.forEach((tool, i) => {
			const station = near(tool, tool === 'board');
			used.add(station);
			visit(station, TOOL_VERBS[tool], key);
			if (i === tools.length - 1) collect.push({ station, key });
		});
	}
	if (!plate) visit(near('plates', false), 'plate');
	else if (plateAt) visit(plateAt, 'plate');
	while (collect.length) {
		collect.sort((a, b) => dist(a.station, from) - dist(b.station, from));
		const { station, key } = collect.shift();
		visit(station, 'take', key);
	}
	if (!missing.length || stops.length) visit(near('serve', false), 'serve');
	return { order, plate, missing, stops };
}

function pathPoints(state, stops) {
	const pts = [{ x: state.player.x, y: state.player.y }];
	let tile = tileAt(state.player.x, state.player.y);
	for (const { station } of stops) {
		const path = pathToStation(state.kitchen, tile, station.c, station.r) ?? [];
		for (const p of path) pts.push(tileCenter(p.c, p.r));
		if (path.length) tile = path[path.length - 1];
		const a = tileCenter(tile.c, tile.r);
		const b = tileCenter(station.c, station.r);
		pts.push({ x: a.x + (b.x - a.x) * 0.42, y: a.y + (b.y - a.y) * 0.42, stop: true });
		pts.push(a);
	}
	return pts;
}

/** The dotted, marching path from the cook through every stop. */
export function drawRoutePath(ctx, state, plan, t) {
	if (!plan?.stops.length) return;
	const pts = pathPoints(state, plan.stops);
	ctx.save();
	let carry = (t * 40) % 18;
	for (let i = 1; i < pts.length; i += 1) {
		const a = pts[i - 1];
		const b = pts[i];
		const len = Math.hypot(b.x - a.x, b.y - a.y);
		for (let d = carry; d < len; d += 18) {
			const x = a.x + ((b.x - a.x) * d) / len;
			const y = a.y + ((b.y - a.y) * d) / len;
			circle(ctx, x, y, 5.5, 'rgba(60,25,5,0.55)');
			circle(ctx, x, y, 3.6, GOLD);
		}
		carry = len ? (carry - len) % 18 : carry;
		if (carry < 0) carry += 18;
	}
	ctx.restore();
}

/** Step numbers on the stations the plan visits. */
export function drawRouteStops(ctx, plan) {
	if (!plan?.stops.length) return;
	const seen = new Map();
	plan.stops.forEach((s, i) => {
		const list = seen.get(s.station) ?? [];
		list.push(i + 1);
		seen.set(s.station, list);
	});
	for (const [station, nums] of seen) {
		const { x, y } = tileCenter(station.c, station.r);
		const label = nums.join('·');
		const w = Math.max(30, label.length * 11 + 14);
		const bx = x - TILE / 2 + 4;
		const by = y - TILE / 2 + 4;
		rrect(ctx, bx, by, w, 26, 13, '#2a1206');
		rrect(ctx, bx + 2, by + 2, w - 4, 22, 11, GOLD);
		text(ctx, label, bx + w / 2, by + 14, `bold 16px ${FONT}`, '#3a1806');
	}
}

const VERB_LABEL = { grab: 'Grab', chop: 'Chop', boil: 'Boil', fry: 'Fry', steam: 'Steam', grill: 'Grill', plate: 'Plate', take: 'Add', serve: 'Serve' };
const TOOL_OF = { chop: 'board', boil: 'pot', fry: 'wok', steam: 'steamer', grill: 'grill' };

function stepIcon(ctx, step, x, y, t) {
	if (step.verb === 'grab') drawIngredient(ctx, { kind: 'item', ing: step.key.split(':')[0], state: 'raw' }, x, y, 30);
	else if (TOOL_OF[step.verb]) drawToolIcon(ctx, TOOL_OF[step.verb], x, y, 30);
	else if (step.verb === 'take') drawIngredient(ctx, { kind: 'item', ing: step.key.split(':')[0], state: step.key.split(':')[1] }, x, y, 30);
	else if (step.verb === 'plate') drawPlated(ctx, [], x, y, 15, t);
	else {
		circle(ctx, x, y + 6, 13, '#c8902e');
		circle(ctx, x, y + 3, 11, '#ffd34e');
		circle(ctx, x, y - 9, 3, '#c8902e');
	}
}

/** Parts that more than one live ticket wants: worth prepping in a batch. */
export function sharedParts(orders) {
	const count = new Map();
	for (const o of orders) if (!o.outcome) for (const k of new Set(o.parts)) count.set(k, (count.get(k) ?? 0) + 1);
	return new Map([...count].filter(([, n]) => n > 1));
}

/** The plan card on the floor: which ticket, its stops in order, and what to batch. */
export function drawRouteCard(ctx, state, plan, x, y, w, h, t) {
	if (!plan) return;
	const { order } = plan;
	rrect(ctx, x + 3, y + 5, w, h, 14, 'rgba(0,0,0,0.35)');
	rrect(ctx, x, y, w, h, 14, 'rgba(36,16,8,0.9)');
	ctx.strokeStyle = order.vip || order.critic ? '#ffcf3e' : '#e0a84a';
	ctx.lineWidth = 2.5;
	ctx.stroke();
	text(ctx, 'ROUTE PLAN', x + 16, y + 18, `bold 13px ${FONT}`, '#e0a84a', 'left');
	drawDish(ctx, order.recipe, x + 132, y + 18, 12, t, false);
	const name = `${RECIPES[order.recipe].name}${order.extra ? ` · ${order.extra.label}` : ''}`;
	text(ctx, name, x + 150, y + 18, `bold 16px ${FONT}`, '#fff1d0', 'left');
	text(ctx, 'Tab / click a ticket to switch', x + w - 14, y + 18, `12px ${FONT}`, 'rgba(255,220,170,0.6)', 'right');
	const steps = plan.stops.slice(0, 7);
	const gap = Math.min(84, (w - 30) / Math.max(1, steps.length));
	steps.forEach((s, i) => {
		const cx = x + 20 + gap * i + gap / 2;
		const cy = y + 62;
		if (i) {
			ctx.fillStyle = 'rgba(255,214,107,0.6)';
			path(ctx, [cx - gap / 2 - 5, cy - 7, cx - gap / 2 + 4, cy, cx - gap / 2 - 5, cy + 7], true);
		}
		circle(ctx, cx, cy, 26, '#fff4dc');
		stepIcon(ctx, s, cx, cy, t);
		circle(ctx, cx - 20, cy - 20, 11, GOLD);
		text(ctx, String(i + 1), cx - 20, cy - 19, `bold 14px ${FONT}`, '#3a1806');
		text(ctx, VERB_LABEL[s.verb], cx, cy + 38, `bold 13px ${FONT}`, '#ffe7b8');
	});
	if (plan.stops.length > steps.length) text(ctx, `+${plan.stops.length - steps.length}`, x + w - 18, y + 62, `bold 16px ${FONT}`, GOLD, 'right');
	const shared = [...sharedParts(state.orders)].sort((a, b) => b[1] - a[1]).slice(0, 2);
	if (shared.length) {
		const words = shared.map(([k, n]) => `${INGREDIENTS[k.split(':')[0]].name.toLowerCase()} ×${n}`).join(', ');
		text(ctx, `Batch it — shared by several tickets: ${words}`, x + 16, y + h - 14, `bold 13px ${FONT}`, '#9fe08a', 'left');
	}
}

/** Missing parts of a half-built plate, as faded ghosts in dashed slots above it. */
export function drawGhostSlots(ctx, state, plate, x, y, t) {
	const fit = ordersFitting(plate, state.orders);
	const focus = focusOrder(state);
	const order = fit.includes(focus) ? focus : fit[0];
	if (!order) return;
	const miss = missingParts(plateKeys(plate), order.parts);
	if (!miss.length) return;
	const s = 36;
	const w = miss.length * (s + 6) + 6;
	const bx = x - w / 2;
	const by = y - 72;
	rrect(ctx, bx, by, w, s + 10, 10, 'rgba(30,12,4,0.78)');
	miss.forEach((key, i) => {
		const cx = bx + 6 + i * (s + 6) + s / 2;
		const cy = by + 5 + s / 2;
		circle(ctx, cx, cy, s / 2, 'rgba(255,244,220,0.92)');
		ctx.setLineDash([4, 3]);
		ctx.lineDashOffset = -t * 12;
		ctx.strokeStyle = '#c0802a';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(cx, cy, s / 2 - 1, 0, TAU);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.globalAlpha = 0.55 + 0.15 * Math.sin(t * 4 + i);
		const [ing, st] = key.split(':');
		drawIngredient(ctx, { kind: 'item', ing, state: st }, cx, cy, s * 0.8);
		ctx.globalAlpha = 1;
	});
	text(ctx, 'NEEDS', x, by - 7, `bold 11px ${FONT}`, '#ffe9b0');
}

