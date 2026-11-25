// Progress kept between visits.
import { NIGHTS } from './recipes.js';
import { SAVE_KEY } from './config.js';

export function loadProgress() {
	try {
		const data = JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? '{}');
		const stars = Array.isArray(data.stars) ? data.stars.map((n) => Math.max(0, Math.min(3, n | 0))) : [];
		return { stars, bank: Math.max(0, data.bank | 0), perks: Array.isArray(data.perks) ? data.perks.filter((p) => typeof p === 'string') : [] };
	} catch {
		return { stars: [], bank: 0, perks: [] };
	}
}

export function saveProgress(progress) {
	try {
		window.localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
	} catch {
	}
}

export function unlockedNight(progress) {
	let n = 0;
	while (n < NIGHTS.length - 1 && (progress.stars[n] ?? 0) > 0) n += 1;
	return n;
}
