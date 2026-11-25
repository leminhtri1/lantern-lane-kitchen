// Progress kept between visits: the best stars earned on each night. Storage may be off (private
// windows), in which case progress lasts this visit only.
import { NIGHTS } from './recipes.js';
import { SAVE_KEY } from './config.js';

export function loadProgress() {
  try {
    const data = JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? '{}');
    const stars = Array.isArray(data.stars) ? data.stars.map((n) => Math.max(0, Math.min(3, n | 0))) : [];
    return { stars };
  } catch {
    return { stars: [] };
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  } catch {
    // Nothing to do: progress stays in memory.
  }
}

/** The last night that may be played: one past the furthest night with at least a star. */
export function unlockedNight(progress) {
  let n = 0;
  while (n < NIGHTS.length - 1 && (progress.stars[n] ?? 0) > 0) n += 1;
  return n;
}
