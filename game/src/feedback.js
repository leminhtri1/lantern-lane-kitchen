// Turns what happened this step (the shift's events) into things you can see at once: chop bits
// flying off the board, steam and flames over busy stations, smoke before something burns, coins
// popping at the hatch, and a word from the cook when a move does not work.
import { TILE } from './config.js';
import { INGREDIENTS } from './ingredients.js';
import { isCookStation, tileCenter } from './kitchen-layout.js';
import { cookStatus } from './stations.js';
import { emit, floatText } from './effects.js';

function at(station) {
  return tileCenter(station.c, station.r);
}

export function applyFeedback(state) {
  const { fx, random } = state;
  for (const e of state.events) {
    const p = e.station ? at(e.station) : { x: state.player.x, y: state.player.y };
    switch (e.type) {
      case 'chop': {
        const color = INGREDIENTS[e.item.ing].color;
        emit(fx, random, 'bit', p.x, p.y - 8, 6, { colors: [color, color, '#fffbe8'], speed: 150, gravity: 520, angle: -Math.PI / 2, spread: 2.4, life: 0.5, size: 6 });
        fx.shake = Math.max(fx.shake, 0.12);
        break;
      }
      case 'chopped':
        emit(fx, random, 'spark', p.x, p.y - 10, 8, { color: '#fff4b0', speed: 90, life: 0.5, size: 7 });
        break;
      case 'pickup':
      case 'place':
        emit(fx, random, 'steam', p.x, p.y - 10, 3, { speed: 25, life: 0.35, size: 6 });
        break;
      case 'cooked':
        emit(fx, random, 'spark', p.x, p.y - 20, 10, { color: '#c8ff8a', speed: 100, life: 0.6, size: 7 });
        floatText(fx, p.x, p.y - 44, 'Ready!', '#c8ff8a', 20, 1);
        break;
      case 'warn':
        floatText(fx, p.x, p.y - 44, 'Smoking!', '#ffb347', 20, 1);
        break;
      case 'burnt':
        emit(fx, random, 'smoke', p.x, p.y - 10, 14, { color: '#3b3533', speed: 60, angle: -Math.PI / 2, spread: 1.6, life: 1.4, size: 10 });
        floatText(fx, p.x, p.y - 44, 'Burnt!', '#ff6a5a', 24, 1.3);
        fx.shake = Math.max(fx.shake, 0.4);
        break;
      case 'refuse':
        floatText(fx, state.player.x, state.player.y - 58, e.text, '#ffd0c4', 18, 1.1);
        state.player.bump = 0.25;
        break;
      case 'complete':
        emit(fx, random, 'spark', p.x, p.y - 16, 14, { colors: ['#fff4b0', '#ffd166', '#ffffff'], speed: 130, life: 0.7, size: 8 });
        floatText(fx, p.x, p.y - 50, 'Plated!', '#fff1a8', 20, 1);
        break;
      case 'served': {
        emit(fx, random, 'spark', p.x, p.y, 22, { colors: ['#ffd166', '#fff4b0', '#ff9f43'], speed: 200, life: 0.8, size: 9 });
        floatText(fx, p.x - 30, p.y - 50, `+${e.coins}`, '#ffd85e', 34, 1.5);
        if (e.combo > 1) floatText(fx, p.x - 30, p.y - 10, `Combo x${e.combo}`, '#ff9fd0', 22, 1.4);
        if (e.vip) floatText(fx, p.x - 30, p.y + 24, 'VIP pays double!', '#ffe066', 20, 1.6);
        fx.flash = 0.35;
        fx.flashColor = '#fff3c4';
        fx.coinPop = 1;
        break;
      }
      case 'missed':
        floatText(fx, 640, 160, `-${8} · a customer left`, '#ff7b6b', 22, 1.6);
        fx.shake = Math.max(fx.shake, 0.5);
        fx.flash = 0.25;
        fx.flashColor = '#ff5040';
        break;
      default:
        break;
    }
  }
}

/** Steam, flames and smoke that rise from busy stations every step. */
export function ambientEffects(state, dt) {
  const { fx, random } = state;
  for (const station of state.kitchen.stations) {
    if (!isCookStation(station) || station.items.length === 0) continue;
    const p = at(station);
    const status = cookStatus(station);
    const busy = Math.min(1, station.items.length / 2);
    if ((station.type === 'pot' || station.type === 'steamer') && random() < dt * 9 * busy) {
      emit(fx, random, 'steam', p.x + (random() - 0.5) * 30, p.y - 22, 1, { speed: 26, angle: -Math.PI / 2, spread: 0.6, life: 1.3, size: 7 });
    }
    if ((station.type === 'wok' || station.type === 'grill') && random() < dt * 14 * busy) {
      emit(fx, random, 'flame', p.x + (random() - 0.5) * TILE * 0.5, p.y + 6, 1, { colors: ['#ffb02e', '#ff7a1a', '#ffd25e'], speed: 50, angle: -Math.PI / 2, spread: 0.7, life: 0.45, size: 6 });
    }
    if (status.warn > 0 && random() < dt * (6 + 20 * status.warn)) {
      emit(fx, random, 'smoke', p.x, p.y - 18, 1, { color: '#4a4442', speed: 40, angle: -Math.PI / 2, spread: 0.8, life: 1.2, size: 8 });
    }
    if (status.burnt > 0 && random() < dt * 10) {
      emit(fx, random, 'smoke', p.x, p.y - 18, 1, { color: '#2a2422', speed: 45, angle: -Math.PI / 2, spread: 0.8, life: 1.5, size: 10 });
    }
  }
}
