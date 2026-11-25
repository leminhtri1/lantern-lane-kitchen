// The eleven ingredients and what each tool turns them into. An item is { kind: 'item', ing,
// state, progress }: `state` starts 'raw' and changes when a tool finishes with it ('chopped' on a
// board, 'boiled' in the pot, 'fried' in the wok, 'steamed' in the steamer, 'grilled' on the
// grill), or turns 'burnt' when left cooking too long.

export const INGREDIENTS = {
  noodles: { name: 'Noodles', color: '#f2cf6b', steps: { raw: { pot: 'boiled' } } },
  egg: { name: 'Egg', color: '#ffd166', steps: { raw: { pot: 'boiled', wok: 'fried' } } },
  scallion: { name: 'Scallion', color: '#5fbf4a', steps: { raw: { board: 'chopped' } } },
  cabbage: { name: 'Bok choy', color: '#8fd16a', steps: { raw: { board: 'chopped' }, chopped: { steamer: 'steamed', wok: 'fried' } } },
  pork: { name: 'Pork', color: '#e9867f', steps: { raw: { board: 'chopped' }, chopped: { steamer: 'steamed', wok: 'fried' } } },
  chicken: { name: 'Chicken', color: '#f3b49a', steps: { raw: { board: 'chopped' }, chopped: { grill: 'grilled' } } },
  mushroom: { name: 'Shiitake', color: '#9a6a45', steps: { raw: { grill: 'grilled', board: 'chopped' }, chopped: { wok: 'fried' } } },
  shrimp: { name: 'Shrimp', color: '#f08a6c', steps: { raw: { grill: 'grilled' } } },
  rice: { name: 'Rice', color: '#f4f1e6', steps: { raw: { steamer: 'steamed', wok: 'fried' } } },
  bun: { name: 'Bun dough', color: '#f6ead4', steps: { raw: { steamer: 'steamed' } } },
  mango: { name: 'Mango', color: '#ffb52e', steps: { raw: { board: 'chopped' } } },
};

/** The word a ticket uses for each tool. */
export const TOOL_VERBS = { board: 'chop', pot: 'boil', wok: 'fry', steamer: 'steam', grill: 'grill' };

/**
 * The tools an item passes through on its way to `state`, in order (raw pork to steamed is
 * board then steamer). Used by tickets and the recipe book to show the route.
 */
export function routeTo(ing, state) {
  const search = (from, path) => {
    if (from === state) return path;
    const steps = INGREDIENTS[ing].steps[from];
    if (!steps) return null;
    for (const tool of Object.keys(steps)) {
      const found = search(steps[tool], [...path, tool]);
      if (found) return found;
    }
    return null;
  };
  return search('raw', []) ?? [];
}

export function newItem(ing) {
  return { kind: 'item', ing, state: 'raw', progress: 0, cookTo: null };
}

/** What `tool` makes of the item, or null when it cannot take it. */
export function resultOf(item, tool) {
  if (item.kind !== 'item' || item.state === 'burnt') return null;
  const steps = INGREDIENTS[item.ing].steps[item.state];
  return steps?.[tool] ?? null;
}

export function canChop(item) {
  return item?.kind === 'item' && resultOf(item, 'board') !== null;
}

export function partKey(item) {
  return `${item.ing}:${item.state}`;
}
