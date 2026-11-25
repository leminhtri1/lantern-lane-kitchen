// The stall's floor plan as a grid of characters, and the station objects built from it. Crates
// line the left wall and the front counter, the cooking line runs along the back, the plating
// island splits the floor so every order is a route, and the serving hatch opens onto the street.
import { COLS, GRID_X, GRID_Y, ROWS, TILE } from './config.js';

const MAP = [
  'XPPCWWCSSGGX',
  'n..........C',
  'e..........O',
  's..CBCCCD..O',
  'c..........C',
  'p..........D',
  'XkmhrbgBCBTX',
];

const CRATES = { n: 'noodles', e: 'egg', s: 'scallion', c: 'cabbage', p: 'pork', k: 'chicken', m: 'mushroom', h: 'shrimp', r: 'rice', b: 'bun', g: 'mango' };
const TYPES = { X: 'decor', C: 'counter', B: 'board', P: 'pot', W: 'wok', S: 'steamer', G: 'grill', D: 'plates', T: 'trash', O: 'serve' };

export const COOK_TYPES = ['pot', 'wok', 'steamer', 'grill'];

export function isCookStation(station) {
  return COOK_TYPES.includes(station.type);
}

/** A fresh kitchen: every station empty, in grid order. */
export function createKitchen() {
  const stations = [];
  const grid = [];
  for (let r = 0; r < ROWS; r += 1) {
    const row = [];
    for (let c = 0; c < COLS; c += 1) {
      const ch = MAP[r][c];
      if (ch === '.') {
        row.push(null);
        continue;
      }
      const station = {
        id: stations.length,
        c,
        r,
        type: CRATES[ch] ? 'crate' : TYPES[ch],
        ing: CRATES[ch] ?? null,
        held: null,
        items: [],
        warned: false,
      };
      stations.push(station);
      row.push(station);
    }
    grid.push(row);
  }
  return { stations, grid };
}

export function tileCenter(c, r) {
  return { x: GRID_X + c * TILE + TILE / 2, y: GRID_Y + r * TILE + TILE / 2 };
}

export function tileAt(x, y) {
  return { c: Math.floor((x - GRID_X) / TILE), r: Math.floor((y - GRID_Y) / TILE) };
}

export function stationAt(kitchen, c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return null;
  return kitchen.grid[r][c];
}

export function isFloor(kitchen, c, r) {
  return c >= 0 && r >= 0 && c < COLS && r < ROWS && kitchen.grid[r][c] === null;
}

export function findStations(kitchen, type) {
  return kitchen.stations.filter((s) => s.type === type);
}
