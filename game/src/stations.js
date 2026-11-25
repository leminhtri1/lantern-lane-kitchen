// What the cooking stations do on their own every step: each item in a pot, wok, steamer or grill
// cooks at its own pace, turns into its cooked state at 100%, starts to smoke a little later and
// burns if nobody takes it out. The shift hears about each change through its event list.
import { COOK, STATION_CAPACITY } from './config.js';
import { isCookStation } from './kitchen-layout.js';
import { resultOf } from './ingredients.js';

/** Progress at which an item on `type` is burnt; warnings start at 45% of the way there. */
export function burnPoint(type) {
  return 1 + COOK[type].burn / COOK[type].time;
}

export function warnPoint(type) {
  return 1 + (0.45 * COOK[type].burn) / COOK[type].time;
}

export function stationHasRoom(station) {
  return station.items.length < STATION_CAPACITY;
}

/** Whether the cooking station would take `item` now. */
export function cookAccepts(station, item) {
  return isCookStation(station) && item?.kind === 'item' && stationHasRoom(station) && resultOf(item, station.type) !== null;
}

export function addToCook(station, item) {
  item.cookTo = resultOf(item, station.type);
  item.progress = 0;
  station.items.push(item);
}

/**
 * A summary for drawing and sound: `cooking` is the least-done raw item's progress (0..1) or -1,
 * `ready` counts cooked items, `warn` is the share of the way to burning (0..1) of the worst one.
 */
export function cookStatus(station) {
  let cooking = -1;
  let ready = 0;
  let burnt = 0;
  let warn = 0;
  const burnAt = burnPoint(station.type);
  const warnAt = warnPoint(station.type);
  for (const item of station.items) {
    if (item.state === 'burnt') burnt += 1;
    else if (item.progress < 1) cooking = cooking < 0 ? item.progress : Math.min(cooking, item.progress);
    else {
      ready += 1;
      if (item.progress > warnAt) warn = Math.max(warn, (item.progress - warnAt) / (burnAt - warnAt));
    }
  }
  return { cooking, ready, burnt, warn };
}

export function updateStations(state, dt) {
  for (const station of state.kitchen.stations) {
    if (!isCookStation(station) || station.items.length === 0) continue;
    const { time } = COOK[station.type];
    const burnAt = burnPoint(station.type);
    const warnAt = warnPoint(station.type);
    for (const item of station.items) {
      if (item.state === 'burnt') continue;
      const before = item.progress;
      item.progress += dt / time;
      if (before < 1 && item.progress >= 1) {
        item.state = item.cookTo;
        state.events.push({ type: 'cooked', station });
      } else if (before < warnAt && item.progress >= warnAt) {
        state.events.push({ type: 'warn', station });
      } else if (item.progress >= burnAt) {
        item.state = 'burnt';
        state.events.push({ type: 'burnt', station });
      }
    }
  }
}
