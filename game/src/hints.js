// Gentle coaching on the first night: one short line that reads the oldest ticket and what the
// cook is holding, and says the next step (grab, chop, cook, plate, serve).
import { INGREDIENTS, TOOL_VERBS, canChop, partKey, resultOf } from './ingredients.js';
import { RECIPES, candidateRecipes, matchRecipe, plateKeys } from './recipes.js';

const PLACE = { board: 'a CHOP board', pot: 'a broth pot', wok: 'a wok', steamer: 'a steamer', grill: 'a grill' };

function missingParts(plate, recipeId) {
  const left = [...RECIPES[recipeId].parts];
  for (const key of plateKeys(plate)) {
    const at = left.indexOf(key);
    if (at !== -1) left.splice(at, 1);
  }
  return left;
}

export function hintFor(state) {
  if (state.nightIndex !== 0 || state.served >= 3 || state.over) return null;
  const order = state.orders.find((o) => !o.outcome);
  if (!order) return 'Customers are coming. Get a pot going while you wait!';
  const recipe = RECIPES[order.recipe];
  const held = state.player.held;
  if (!held) {
    const names = recipe.parts.map((p) => INGREDIENTS[p.split(':')[0]].name).join(', ');
    return `${recipe.short} needs ${names}. Grab one from its crate (Space or click).`;
  }
  if (held.kind === 'plate') {
    if (matchRecipe(held, state.menu)) return 'Plated! Serve it at the SERVE hatch on the right.';
    const target = candidateRecipes(held, state.menu)[0] ?? order.recipe;
    const left = missingParts(held, target).map((p) => INGREDIENTS[p.split(':')[0]].name.toLowerCase());
    return held.items.length ? `Add the ${left.join(' and ')} to finish the ${RECIPES[target].short}.` : 'Now add cooked and chopped parts to the plate.';
  }
  if (held.state === 'burnt') return 'Burnt! Drop it in the BIN.';
  if (canChop(held)) return `Lay the ${INGREDIENTS[held.ing].name.toLowerCase()} on a CHOP board and hold Space (or click it).`;
  const tools = Object.keys(INGREDIENTS[held.ing].steps[held.state] ?? {}).filter((t) => t !== 'board');
  const wanted = recipe.parts.find((p) => p.startsWith(`${held.ing}:`));
  if (tools.length && wanted && wanted !== partKey(held)) {
    const tool = tools.find((t) => resultOf(held, t) === wanted.split(':')[1]) ?? tools[0];
    return `${TOOL_VERBS[tool][0].toUpperCase()}${TOOL_VERBS[tool].slice(1)} it: put it in ${PLACE[tool]}. A station cooks three things at once.`;
  }
  return 'Ready! Take a plate from a PLATES stack and put it on.';
}
