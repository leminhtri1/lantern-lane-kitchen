// Click-to-walk: a breadth-first search over floor tiles.
import { COLS, ROWS } from './config.js';
import { isFloor } from './kitchen-layout.js';

const DIRS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];

export function findPath(kitchen, start, isGoal) {
	const key = (c, r) => r * COLS + c;
	const came = new Map([[key(start.c, start.r), null]]);
	const queue = [start];
	while (queue.length) {
		const tile = queue.shift();
		if (isGoal(tile.c, tile.r)) {
			const path = [];
			let at = tile;
			while (at && !(at.c === start.c && at.r === start.r)) {
				path.unshift(at);
				at = came.get(key(at.c, at.r));
			}
			return path;
		}
		for (const [dc, dr] of DIRS) {
			const c = tile.c + dc;
			const r = tile.r + dr;
			if (c < 0 || r < 0 || c >= COLS || r >= ROWS || came.has(key(c, r)) || !isFloor(kitchen, c, r)) continue;
			came.set(key(c, r), tile);
			queue.push({ c, r });
		}
	}
	return null;
}

export function pathToStation(kitchen, start, c, r) {
	return findPath(kitchen, start, (fc, fr) => Math.abs(fc - c) + Math.abs(fr - r) === 1);
}
