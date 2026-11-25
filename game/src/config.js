// Shared numbers: the logical canvas, the kitchen grid, the fixed step and the timings that set
// how a shift feels. Every other module reads these instead of hard-coding its own.

export const VIEW_W = 1280;
export const VIEW_H = 800;

/** The kitchen is a 12 x 7 grid of square tiles under the ticket rail; the street is to its right. */
export const TILE = 92;
export const GRID_X = 16;
export const GRID_Y = 150;
export const COLS = 12;
export const ROWS = 7;
export const STREET_X = GRID_X + COLS * TILE;

export const STEP = 1 / 60;

export const SHIFT_SECONDS = 180;
export const PLAYER_SPEED = 340;
export const PLAYER_RADIUS = 23;

/** Seconds of holding Space (or the mouse) to chop one ingredient. */
export const CHOP_SECONDS = 0.9;
export const CHOP_STROKE = 0.14;

export const MAX_TICKETS = 5;
export const STATION_CAPACITY = 3;

/** Per cooking station: seconds to cook, then seconds more before it burns. */
export const COOK = {
  pot: { time: 6.5, burn: 8 },
  wok: { time: 4.5, burn: 6 },
  steamer: { time: 7.5, burn: 9 },
  grill: { time: 5.5, burn: 7 },
};

export const MISS_PENALTY = 8;
export const SAVE_KEY = 'lantern-lane-kitchen/v1';

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
export const TITLE_FONT = 'Georgia, "Palatino Linotype", "Book Antiqua", serif';
