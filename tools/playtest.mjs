// Play the real game in headless Chrome: start night 1 from the title, cook and serve a Lantern
// Noodle Soup with mouse clicks only, try the keyboard (walk, use, pause), serve a ticket with an
// extra, run the clock out, buy an upgrade on the results screen and start the next night, failing
// on any page error. `node tools/playtest.mjs`.
import { writeFileSync } from 'node:fs';
import { launchChrome, serveGame, sleep, waitFor, watchErrors } from './cdp.mjs';

const shotPath = process.argv.includes('--shot') ? process.argv[process.argv.indexOf('--shot') + 1] : null;

const TILE = 92;
const tile = (c, r) => ({ x: 16 + c * TILE + TILE / 2, y: 150 + r * TILE + TILE / 2 });

const { server, port } = await serveGame();
const { client, close } = await launchChrome();
const errors = watchErrors(client);
await client.send('Runtime.enable');
await client.send('Log.enable');
await client.send('Page.enable');
await client.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

const value = async (expression) => (await client.send('Runtime.evaluate', { expression, returnByValue: true })).result.value;

async function click(c, r) {
  const { x, y } = tile(c, r);
  for (const type of ['mousePressed', 'mouseReleased']) await client.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, buttons: type === 'mousePressed' ? 1 : 0 });
  await sleep(50);
  await waitFor(client, '!window.__lantern.state.player.path', 8000);
  await sleep(80);
}

const KEYS = { Enter: 13, Space: 32, ArrowRight: 39, ArrowLeft: 37, ArrowUp: 38, ArrowDown: 40, KeyP: 80, Tab: 9, Digit2: 50 };
async function key(code, holdMs = 60) {
  const base = { code, key: code === 'Space' ? ' ' : code.replace(/Key|Digit/, ''), windowsVirtualKeyCode: KEYS[code] };
  await client.send('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
  await sleep(holdMs);
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
  await sleep(60);
}

const held = () => value('JSON.stringify(window.__lantern.state.player.held)');
let failed = false;
const check = (ok, what) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failed = true;
};

try {
  await client.send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html?seed=4` });
  await waitFor(client, 'window.__lantern && window.__lantern.screen === "title"');
  await sleep(300);
  await key('Enter');
  await waitFor(client, 'window.__lantern.screen === "play"');
  check(true, 'title -> play with Enter');
  check((await value('window.__lantern.state.orders[0].recipe')) === 'soup', 'first ticket is a noodle soup');

  await click(0, 1);
  check((await held())?.includes('noodles'), 'picked up noodles from the crate');
  await click(1, 0);
  await click(0, 2);
  await click(1, 0);
  check((await value('window.__lantern.state.kitchen.grid[0][1].items.length')) === 2, 'noodles and egg are boiling in the pot');
  await click(0, 3);
  await click(4, 3);
  await sleep(1300);
  check((await value('window.__lantern.state.kitchen.grid[3][4].held.state')) === 'chopped', 'scallion chopped on the island board');
  await click(8, 3);
  check((await held())?.includes('plate'), 'took a plate');
  if (shotPath) {
    const { data } = await client.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    writeFileSync(shotPath, Buffer.from(data, 'base64'));
  }
  await click(4, 3);
  check((await value('window.__lantern.state.player.held.items.length')) === 1, 'scallion went onto the plate');
  await waitFor(client, 'window.__lantern.state.kitchen.grid[0][1].items.every((i) => i.progress >= 1)', 12000);
  await click(1, 0);
  check((await value('window.__lantern.state.player.held.items.length')) === 3, 'noodles and egg plated from the pot');
  await click(11, 2);
  check((await value('window.__lantern.state.served')) === 1, 'soup served at the hatch');
  console.log(`     coins: ${await value('window.__lantern.state.coins')}`);

  // Keyboard only: take scallion from its crate, lay it on a board, hold Space to chop.
  const place = (c, r, fx, fy) => value(`(() => { const p = window.__lantern.state.player; p.x = ${16 + c * 92 + 46}; p.y = ${150 + r * 92 + 46}; p.fx = ${fx}; p.fy = ${fy}; p.path = null; return true; })()`);
  await place(1, 3, -1, 0);
  await sleep(100);
  await key('Space');
  check((await held())?.includes('scallion'), 'Space at a crate picks up scallion');
  await place(4, 2, 0, 1);
  await sleep(100);
  await key('Space', 1400);
  check((await value('window.__lantern.state.kitchen.grid[3][4].held?.state')) === 'chopped', 'holding Space at the board chops it');

  // Keyboard: walk around, use, pause and resume.
  await key('ArrowLeft', 300);
  await key('ArrowUp', 300);
  await key('Space');
  await key('ArrowDown', 400);
  await key('KeyP');
  check((await value('window.__lantern.screen')) === 'paused', 'P pauses (recipe book)');
  await key('KeyP');
  check((await value('window.__lantern.screen')) === 'play', 'P resumes');

  // Ticket extras: a "No scallion" soup takes noodles and egg only, and the route guide follows it after Tab.
  await value(`(() => { const s = window.__lantern.state; s.orders = s.orders.filter((o) => !o.outcome); s.orders.push({ id: 900, recipe: 'soup', extra: { label: 'No scallion', add: false, key: 'scallion:chopped' }, parts: ['noodles:boiled', 'egg:boiled'], patience: 60, maxPatience: 60, age: 1, customer: 2, leaving: 0, outcome: null, vip: false, critic: false, table: 0 }); s.player.held = { kind: 'plate', items: [{ kind: 'item', ing: 'noodles', state: 'boiled', progress: 0 }, { kind: 'item', ing: 'egg', state: 'boiled', progress: 0 }] }; return true; })()`);
  for (let i = 0; i < 6 && (await value('window.__lantern.state.focusId')) !== 900; i += 1) await key('Tab');
  check((await value('window.__lantern.state.focusId')) === 900, 'Tab moves the route guide to the extras ticket');
  const servedBefore = await value('window.__lantern.state.served');
  await click(11, 2);
  check((await value('window.__lantern.state.served')) === servedBefore + 1, 'a no-scallion soup is served to the ticket that asked for it');

  // Run the clock out with coins to bank, then buy the Sharp cleaver (key 2) on the results screen.
  await value('window.__lantern.state.coins = 200, window.__lantern.state.timeLeft = 1.5, true');
  await waitFor(client, 'window.__lantern.screen === "results"', 8000);
  check(true, 'shift ended on the results screen');
  await key('Digit2');
  check((await value('JSON.parse(localStorage.getItem("kite-street-night-market/v2")).perks.includes("knife")')) === true, 'bought the Sharp cleaver upgrade with banked coins');
  await key('Enter');
  await waitFor(client, 'window.__lantern.screen === "play"');
  check(true, 'next shift started from results');
  check((await value('window.__lantern.state.perks.has("knife")')) === true, 'the next night runs with the upgrade');
} catch (error) {
  console.error(error.message);
  failed = true;
} finally {
  await close();
  server.close();
}
if (errors.length) {
  console.error('page errors:\n' + errors.join('\n'));
  failed = true;
}
console.log(failed ? 'PLAYTEST FAILED' : 'PLAYTEST PASSED');
process.exit(failed ? 1 : 0);
