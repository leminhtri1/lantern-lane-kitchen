// Stall upgrades, bought between nights with the coins banked from every shift.
export const UPGRADES = [
	{ id: 'burner', name: 'Hot burners', what: 'Wok & grill 30% faster', cost: 90, icon: 'wok' },
	{ id: 'knife', name: 'Sharp cleaver', what: 'Chop 40% faster', cost: 60, icon: 'board' },
	{ id: 'tea', name: 'Tea for queue', what: 'Queue waits 15% longer', cost: 110, icon: 'pot' },
	{ id: 'tipjar', name: 'Tip jar', what: 'Tips +50%', cost: 80, icon: 'coin' },
];

export function upgradeState(progress, i) {
	const u = UPGRADES[i];
	if (progress.perks.includes(u.id)) return 'owned';
	return progress.bank >= u.cost ? 'buy' : 'short';
}

/** Buy upgrade `i` when the bank covers it; true when bought. */
export function buyUpgrade(progress, i) {
	if (!UPGRADES[i] || upgradeState(progress, i) !== 'buy') return false;
	progress.bank -= UPGRADES[i].cost;
	progress.perks.push(UPGRADES[i].id);
	return true;
}

/** Speed factor a perk gives (1 without it). */
export const perk = (state, id, factor) => (state.perks?.has(id) ? factor : 1);
