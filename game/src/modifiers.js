// Ticket extras (no scallion, double egg, add shrimp) that change what goes on the plate.
const EXTRAS = {
	soup: [['No scallion', '-scallion:chopped'], ['Double egg', '+egg:boiled'], ['Add shrimp', '+shrimp:grilled']],
	friedrice: [['No scallion', '-scallion:chopped'], ['Double egg', '+egg:fried']],
	skewers: [['Extra shiitake', '+mushroom:grilled']],
	dumplings: [['Extra pork', '+pork:steamed']],
	bao: [['No scallion', '-scallion:chopped']],
	mango: [['Extra mango', '+mango:chopped']],
	shrimpsoup: [['Add egg', '+egg:boiled'], ['No scallion', '-scallion:chopped']],
	stirfry: [['No pork', '-pork:fried']],
};

export const EXTRA_PRICE = 6;

/** A random extra for `recipeId` on this night, or null (none on the first night). */
export function rollExtra(state, recipeId) {
	const chance = state.nightIndex === 0 ? 0 : 0.2 + 0.06 * state.nightIndex;
	if (state.random() >= chance) return null;
	const list = EXTRAS[recipeId];
	const [label, op] = list[Math.floor(state.random() * list.length)];
	return { label, add: op[0] === '+', key: op.slice(1) };
}

export function extraByLabel(recipeId, label) {
	const found = EXTRAS[recipeId].find((e) => e[0] === label);
	return found ? { label, add: found[1][0] === '+', key: found[1].slice(1) } : null;
}

/** The part keys a ticket wants once its extra is applied. */
export function applyExtra(parts, extra) {
	if (!extra) return [...parts];
	if (extra.add) return [...parts, extra.key];
	const left = [...parts];
	left.splice(left.indexOf(extra.key), 1);
	return left;
}

/** The rows a ticket prints: every part it wants, plus a struck-out row for a removed one. */
export function ticketRows(order, baseParts) {
	const rows = baseParts.map((key) => ({ key, mark: null }));
	const extra = order.extra;
	if (extra?.add) rows.push({ key: extra.key, mark: 'add' });
	else if (extra) rows.find((r) => r.key === extra.key).mark = 'drop';
	return rows;
}
