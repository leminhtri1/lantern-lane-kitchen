// Capture the screenshots listed in shots.json with headless Chrome: serve game/, open each
// ?shot= scene, wait for window.__shotReady, save a JPEG at most 200 KB into screenshots/ (or the
// --out directory). `node tools/shoot.mjs [--only name] [--out dir]`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, imageSize, launchChrome, serveGame, waitFor, watchErrors } from './cdp.mjs';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(ROOT, 'screenshots');
const LIMIT = 200 * 1024;

const shots = JSON.parse(readFileSync(join(ROOT, 'shots.json'), 'utf8')).filter((s) => !only || s.name.includes(only));
mkdirSync(outDir, { recursive: true });
const { server, port } = await serveGame();
const { client, close } = await launchChrome();
const errors = watchErrors(client);
await client.send('Runtime.enable');
await client.send('Log.enable');
await client.send('Page.enable');
await client.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
let failed = false;
try {
  for (const shot of shots) {
    await client.send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html${shot.query}` });
    await waitFor(client, 'window.__shotReady === true', 15000);
    let quality = 88;
    let buf;
    for (;;) {
      const { data } = await client.send('Page.captureScreenshot', { format: 'jpeg', quality });
      buf = Buffer.from(data, 'base64');
      if (buf.length <= LIMIT || quality <= 40) break;
      quality -= 4;
    }
    const size = imageSize(buf);
    writeFileSync(join(outDir, shot.name), buf);
    console.log(`${shot.name}: ${size.width}x${size.height}, ${(buf.length / 1024).toFixed(1)} KiB, quality ${quality}`);
    if (buf.length > LIMIT) failed = true;
  }
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
process.exit(failed ? 1 : 0);
