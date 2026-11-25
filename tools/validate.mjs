// Pre-flight checks before handing in (Node 22, standard library only):
//  - main.ts run twice into two temp dirs writes identical bytes, including dossier.json;
//  - screenshots/: 3-4 PNG/JPEG files, each <= 256 KiB, long side <= 1280, short side >= 480;
//  - game/ names no http(s) or protocol-relative URL in its scripts and HTML;
//  - every relative import resolves to a file inside game/, and every .js parses as an ES module;
//  - vendor/makefun-game.ts is byte for byte the kit's copy.
// `node tools/validate.mjs`
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { ROOT, imageSize } from './cdp.mjs';

const KIT_VENDOR = process.env.KIT_VENDOR ?? 'D:/claude/makefun/kit-new/cook/best-cooking-game-20261125-0137-kit/starter/vendor/makefun-game.ts';
const GAME = join(ROOT, 'game');
let failures = 0;
const check = (ok, what) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures += 1;
};

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}

// 1. Deterministic hand-in.
const runs = [mkdtempSync(join(tmpdir(), 'llk-a-')), mkdtempSync(join(tmpdir(), 'llk-b-'))];
for (const out of runs) execFileSync(process.execPath, [join(ROOT, 'main.ts')], { env: { ...process.env, MAKEFUN_OUTPUT_DIR: out }, stdio: 'inherit' });
const filesA = walk(runs[0]).map((f) => relative(runs[0], f)).sort();
const filesB = walk(runs[1]).map((f) => relative(runs[1], f)).sort();
check(JSON.stringify(filesA) === JSON.stringify(filesB), `both runs wrote the same ${filesA.length} files`);
check(filesA.every((f) => readFileSync(join(runs[0], f)).equals(readFileSync(join(runs[1], f)))), 'both runs wrote identical bytes');
check(filesA.includes('dossier.json'), 'dossier.json written');
const dossierSize = statSync(join(runs[0], 'dossier.json')).size;
check(dossierSize <= 1.5 * 1024 * 1024, `dossier.json is ${(dossierSize / 1024).toFixed(0)} KiB (<= 1.5 MiB)`);
for (const out of runs) rmSync(out, { recursive: true, force: true });

// 2. Screenshots.
const shots = readdirSync(join(ROOT, 'screenshots')).filter((n) => !n.startsWith('.'));
check(shots.length >= 3 && shots.length <= 4, `${shots.length} screenshots (3-4)`);
for (const name of shots) {
  const buf = readFileSync(join(ROOT, 'screenshots', name));
  const size = imageSize(buf);
  const ok = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(name) && /\.(jpe?g|png)$/i.test(name) && size && buf.length <= 262144 && Math.max(size.width, size.height) <= 1280 && Math.min(size.width, size.height) >= 480;
  check(ok, `${name}: ${size?.width}x${size?.height}, ${(buf.length / 1024).toFixed(1)} KiB`);
}

// 3. No network references; 4. imports resolve; 5. modules parse.
const gameFiles = walk(GAME);
check(gameFiles.length <= 993, `${gameFiles.length} files in game/`);
const urlPattern = /(["'`(=]\s*)(https?:|\/\/[A-Za-z0-9])/;
const importPattern = /(?:^|[\s;])(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|(?:^|[\s;])import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/gm;
const tmp = mkdtempSync(join(tmpdir(), 'llk-parse-'));
for (const file of gameFiles) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (!/\.(html|js|mjs|css)$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n').filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line));
  const bad = lines.find((line) => urlPattern.test(line));
  check(!bad, `${rel}: no network URL${bad ? ` (${bad.trim().slice(0, 80)})` : ''}`);
  if (file.endsWith('.html')) {
    for (const m of text.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/g)) {
      const target = resolve(dirname(file), m[1]);
      check(existsSync(target) && target.startsWith(GAME + sep), `${rel}: script ${m[1]} resolves inside game/`);
    }
    continue;
  }
  if (!/\.m?js$/.test(file)) continue;
  for (const m of text.matchAll(importPattern)) {
    const spec = m[1] ?? m[2] ?? m[3];
    if (spec.startsWith('data:')) continue;
    const target = resolve(dirname(file), spec);
    check((spec.startsWith('./') || spec.startsWith('../')) && existsSync(target) && target.startsWith(GAME + sep), `${rel}: import ${spec}`);
  }
  const copy = join(tmp, rel.replace(/[\\/]/g, '_').replace(/\.js$/, '.mjs'));
  copyFileSync(file, copy);
  try {
    execFileSync(process.execPath, ['--check', copy], { stdio: 'pipe' });
    check(true, `${rel}: parses as an ES module`);
  } catch (error) {
    check(false, `${rel}: parses as an ES module\n${error.stderr}`);
  }
}
rmSync(tmp, { recursive: true, force: true });

// 6. Vendored library unchanged.
check(readFileSync(join(ROOT, 'vendor', 'makefun-game.ts')).equals(readFileSync(KIT_VENDOR)), 'vendor/makefun-game.ts matches the kit byte for byte');

// Source budget.
const sourceBytes = gameFiles.filter((f) => /\.(html|js|mjs|css|json)$/.test(f)).reduce((n, f) => n + statSync(f).size, 0);
check(sourceBytes <= 163840, `game source is ${(sourceBytes / 1024).toFixed(1)} KiB (<= 160 KiB, fits the dossier whole)`);

console.log(failures ? `VALIDATION FAILED (${failures})` : 'VALIDATION PASSED');
process.exit(failures ? 1 : 0);
