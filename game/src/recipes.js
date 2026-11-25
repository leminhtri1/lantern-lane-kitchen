// The menu: eight dishes built from shared parts, the five nights, and plate matching.
import { partKey } from './ingredients.js';

export const RECIPES = {
	soup: { name: 'Lantern Noodle Soup', short: 'Noodle Soup', parts: ['noodles:boiled', 'egg:boiled', 'scallion:chopped'], price: 32 },
	skewers: { name: 'Firefly Skewers', short: 'Skewers', parts: ['chicken:grilled', 'mushroom:grilled'], price: 26 },
	dumplings: { name: 'Moon Dumplings', short: 'Dumplings', parts: ['pork:steamed', 'cabbage:steamed'], price: 28 },
	friedrice: { name: 'Golden Fried Rice', short: 'Fried Rice', parts: ['rice:fried', 'egg:fried', 'scallion:chopped'], price: 34 },
	bao: { name: 'Pillow Pork Bao', short: 'Pork Bao', parts: ['bun:steamed', 'pork:steamed', 'scallion:chopped'], price: 36 },
	mango: { name: 'Mango Sticky Rice', short: 'Mango Rice', parts: ['rice:steamed', 'mango:chopped'], price: 24 },
	shrimpsoup: { name: 'Harbour Shrimp Noodles', short: 'Shrimp Noodles', parts: ['noodles:boiled', 'shrimp:grilled', 'scallion:chopped'], price: 36 },
	stirfry: { name: 'Sizzle Lane Stir-fry', short: 'Stir-fry', parts: ['mushroom:fried', 'cabbage:fried', 'pork:fried'], price: 40 },
};

export const NIGHTS = [
	{ title: 'Opening Night', menu: ['soup', 'skewers', 'dumplings'], stars: [100, 210, 320], spawn: [19, 10] },
	{ title: 'Paper Lantern Fair', menu: ['soup', 'skewers', 'dumplings', 'friedrice'], stars: [120, 240, 360], spawn: [18, 9.5] },
	{ title: 'Rain on the Awnings', menu: ['soup', 'skewers', 'dumplings', 'friedrice', 'bao', 'mango'], stars: [140, 270, 400], spawn: [17, 9] },
	{ title: 'Harbour Fireworks', menu: ['soup', 'dumplings', 'friedrice', 'bao', 'mango', 'shrimpsoup', 'skewers'], stars: [160, 300, 440], spawn: [16, 8.5] },
	{ title: 'Moonlight Market', menu: ['soup', 'skewers', 'dumplings', 'friedrice', 'bao', 'mango', 'shrimpsoup', 'stirfry'], stars: [180, 330, 480], spawn: [15, 8] },
];

function isSubset(keys, parts) {
	const left = [...parts];
	for (const key of keys) {
		const at = left.indexOf(key);
		if (at === -1) return false;
		left.splice(at, 1);
	}
	return true;
}

export function plateKeys(plate) {
	return plate.items.map(partKey);
}

/** What a plate may become tonight: every dish on the menu, plus each live ticket's own version. */
export function dishSpecs(state) {
	const specs = state.menu.map((id) => ({ id, parts: RECIPES[id].parts }));
	for (const o of state.orders) if (!o.outcome && o.extra) specs.push({ id: o.recipe, parts: o.parts, order: o });
	return specs;
}

export function missingParts(keys, parts) {
	const left = [...parts];
	for (const key of keys) {
		const at = left.indexOf(key);
		if (at !== -1) left.splice(at, 1);
	}
	return left;
}

export const sameParts = (a, b) => a.length === b.length && isSubset(a, b);

export function plateAccepts(plate, item, specs) {
	if (item.kind !== 'item' || item.state === 'burnt') return false;
	const keys = [...plateKeys(plate), partKey(item)];
	return specs.some((s) => isSubset(keys, s.parts));
}

export function matchRecipe(plate, specs) {
	const keys = plateKeys(plate);
	return specs.find((s) => sameParts(keys, s.parts))?.id ?? null;
}

/** Live tickets the plate is on its way to, the closest to done first. */
export function ordersFitting(plate, orders) {
	const keys = plateKeys(plate);
	return orders.filter((o) => !o.outcome && isSubset(keys, o.parts)).sort((a, b) => a.parts.length - b.parts.length);
}
