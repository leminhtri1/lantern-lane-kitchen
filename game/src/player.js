// The cook's movement, collisions and the station they face.
import { PLAYER_RADIUS, PLAYER_SPEED, TILE } from './config.js';
import { isFloor, stationAt, tileAt, tileCenter } from './kitchen-layout.js';
import { pathToStation, findPath } from './pathfind.js';

export function createPlayer(c, r) {
	const { x, y } = tileCenter(c, r);
	return { x, y, fx: 0, fy: -1, held: null, walk: 0, moving: false, path: null, goal: null, chopping: null, chopStroke: 0, bump: 0 };
}

function blocked(kitchen, x, y) {
	const r = PLAYER_RADIUS;
	const corners = [
		[x - r, y - r * 0.6],
		[x + r, y - r * 0.6],
		[x - r, y + r],
		[x + r, y + r],
	];
	for (const [px, py] of corners) {
		const t = tileAt(px, py);
		if (!isFloor(kitchen, t.c, t.r)) return true;
	}
	return false;
}

function step(player, kitchen, dx, dy, dt) {
	const len = Math.hypot(dx, dy);
	if (len === 0) {
		player.moving = false;
		return;
	}
	const vx = (dx / len) * PLAYER_SPEED * dt;
	const vy = (dy / len) * PLAYER_SPEED * dt;
	if (!blocked(kitchen, player.x + vx, player.y)) player.x += vx;
	if (!blocked(kitchen, player.x, player.y + vy)) player.y += vy;
	player.fx = dx / len;
	player.fy = dy / len;
	player.moving = true;
	player.walk += dt * 10;
}

export function movePlayer(player, kitchen, dir, dt) {
	if (dir.x !== 0 || dir.y !== 0) {
		player.path = null;
		player.goal = null;
		step(player, kitchen, dir.x, dir.y, dt);
		return null;
	}
	if (!player.path) {
		player.moving = false;
		return null;
	}
	const next = player.path[0];
	if (next) {
		const target = tileCenter(next.c, next.r);
		const dx = target.x - player.x;
		const dy = target.y - player.y;
		const dist = Math.hypot(dx, dy);
		if (dist < PLAYER_SPEED * dt + 1) {
			player.x = target.x;
			player.y = target.y;
			player.path.shift();
			player.moving = true;
		} else step(player, kitchen, dx, dy, dt);
		return null;
	}
	const goal = player.goal;
	player.path = null;
	player.goal = null;
	player.moving = false;
	if (goal?.station) {
		const centre = tileCenter(goal.station.c, goal.station.r);
		const dx = centre.x - player.x;
		const dy = centre.y - player.y;
		const len = Math.hypot(dx, dy) || 1;
		player.fx = dx / len;
		player.fy = dy / len;
		return goal.station;
	}
	return null;
}

export function walkTo(player, kitchen, x, y) {
	const t = tileAt(x, y);
	const here = tileAt(player.x, player.y);
	const station = stationAt(kitchen, t.c, t.r);
	if (station && station.type !== 'decor') {
		const path = pathToStation(kitchen, here, t.c, t.r);
		if (!path) return null;
		player.path = [here, ...path];
		player.goal = { station };
		return null;
	}
	if (isFloor(kitchen, t.c, t.r)) {
		const path = findPath(kitchen, here, (c, r) => c === t.c && r === t.r);
		player.path = path ? [here, ...path] : null;
		player.goal = null;
	}
	return null;
}

export function facingStation(player, kitchen) {
	const probe = TILE * 0.62;
	const ahead = tileAt(player.x + player.fx * probe, player.y + player.fy * probe);
	const front = stationAt(kitchen, ahead.c, ahead.r);
	if (front && front.type !== 'decor') return front;
	const here = tileAt(player.x, player.y);
	const [dc, dr] = Math.abs(player.fx) >= Math.abs(player.fy) ? [Math.sign(player.fx), 0] : [0, Math.sign(player.fy)];
	const side = stationAt(kitchen, here.c + dc, here.r + dr);
	return side && side.type !== 'decor' ? side : null;
}

