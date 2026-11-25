// The menu: eight dishes built from shared parts (steamed pork goes in dumplings and bao, chopped
// scallion tops four dishes, rice is steamed for one and fried for another), and the five nights
// that unlock them. A plate accepts an item only while its parts still fit some dish on tonight's
// menu, so a plate always grows toward something a customer can order.
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
  { title: 'Opening Night', menu: ['soup', 'skewers', 'dumplings'], stars: [90, 180, 270], spawn: [19, 10] },
  { title: 'Paper Lantern Fair', menu: ['soup', 'skewers', 'dumplings', 'friedrice'], stars: [110, 210, 310], spawn: [18, 9.5] },
  { title: 'Rain on the Awnings', menu: ['soup', 'skewers', 'dumplings', 'friedrice', 'bao', 'mango'], stars: [130, 240, 350], spawn: [17, 9] },
  { title: 'Harbour Fireworks', menu: ['soup', 'dumplings', 'friedrice', 'bao', 'mango', 'shrimpsoup', 'skewers'], stars: [150, 270, 390], spawn: [16, 8.5] },
  { title: 'Moonlight Market', menu: ['soup', 'skewers', 'dumplings', 'friedrice', 'bao', 'mango', 'shrimpsoup', 'stirfry'], stars: [170, 300, 430], spawn: [15, 8] },
];

/** True when every key in `keys` can be taken (once each) from `parts`. */
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

/** Whether `item` can join `plate` and still be on the way to a dish on `menu`. */
export function plateAccepts(plate, item, menu) {
  if (item.kind !== 'item' || item.state === 'burnt') return false;
  const keys = [...plateKeys(plate), partKey(item)];
  return menu.some((id) => isSubset(keys, RECIPES[id].parts));
}

/** The dish on `menu` the plate's parts make exactly, or null. */
export function matchRecipe(plate, menu) {
  const keys = plateKeys(plate);
  for (const id of menu) {
    const parts = RECIPES[id].parts;
    if (parts.length === keys.length && isSubset(keys, parts)) return id;
  }
  return null;
}

/** The dishes on `menu` the plate could still become, best match first. */
export function candidateRecipes(plate, menu) {
  const keys = plateKeys(plate);
  return menu.filter((id) => isSubset(keys, RECIPES[id].parts)).sort((a, b) => RECIPES[a].parts.length - RECIPES[b].parts.length);
}
