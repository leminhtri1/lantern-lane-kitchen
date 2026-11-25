// The stall itself: wet street and string lights, warm floor tiles, honey-wood counters with red
// lacquer fronts, and each station drawn so it reads at a glance (steel broth pots, a black wok
// over flame, bamboo steamers, a charcoal grill, crates of produce, the plate stack, the bin and
// the serving hatch). Station contents, progress rings and burn warnings are drawn here too.
import { COLS, FONT, GRID_X, GRID_Y, ROWS, STREET_X, TILE, VIEW_H, VIEW_W } from './config.js';
import { INGREDIENTS, canChop, newItem } from './ingredients.js';
import { isCookStation, stationAt } from './kitchen-layout.js';
import { cookStatus } from './stations.js';
import { matchRecipe, plateKeys } from './recipes.js';
import { drawIngredient, drawPlated } from './food-art.js';

const TAU = Math.PI * 2;
const FRONT = 18;
const LABELS = { pot: 'BROTH POT', wok: 'WOK', steamer: 'STEAMER', grill: 'GRILL', board: 'CHOP', plates: 'PLATES', trash: 'BIN' };

function tileBox(c, r) {
  const x = GRID_X + c * TILE;
  const y = GRID_Y + r * TILE;
  return { x, y, cx: x + TILE / 2, cy: y + (TILE - FRONT) / 2 };
}

// ---------------------------------------------------------------- static layer

function drawStreet(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#15122a');
  g.addColorStop(1, '#231a3a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Cobbles on the street strip, wet and catching the lantern light.
  for (let y = GRID_Y - 10; y < VIEW_H; y += 26) {
    for (let x = STREET_X + ((y / 26) % 2) * 14; x < VIEW_W + 20; x += 30) {
      ctx.fillStyle = (x + y) % 3 === 0 ? '#2e2748' : '#272140';
      ctx.beginPath();
      ctx.roundRect(x, y, 26, 21, 7);
      ctx.fill();
    }
  }
  const pool = ctx.createRadialGradient(STREET_X + 70, 430, 10, STREET_X + 70, 430, 220);
  pool.addColorStop(0, 'rgba(255,170,80,0.32)');
  pool.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = pool;
  ctx.fillRect(STREET_X, GRID_Y, VIEW_W - STREET_X, VIEW_H - GRID_Y);
  // A pole of paper lanterns along the far side of the street.
  ctx.fillStyle = '#1a0e08';
  ctx.fillRect(VIEW_W - 12, GRID_Y, 5, VIEW_H - GRID_Y);
  for (const ly of [200, 440, 680]) streetLantern(ctx, VIEW_W - 22, ly);
}

function streetLantern(ctx, x, y) {
  const glow = ctx.createRadialGradient(x, y, 4, x, y, 60);
  glow.addColorStop(0, 'rgba(255,160,70,0.45)');
  glow.addColorStop(1, 'rgba(255,160,70,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 60, y - 60, 120, 120);
  ctx.strokeStyle = '#1a0e08';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 12, y - 30);
  ctx.lineTo(x, y - 16);
  ctx.stroke();
  const body = ctx.createRadialGradient(x - 4, y - 5, 2, x, y, 16);
  body.addColorStop(0, '#ffc08a');
  body.addColorStop(0.6, '#e0402c');
  body.addColorStop(1, '#8a1a14');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x, y, 13, 16, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8b85a';
  ctx.fillRect(x - 6, y - 18, 12, 4);
  ctx.fillRect(x - 6, y + 14, 12, 4);
}

function drawRug(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 6, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#7a1f1c';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = '#e0a84a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 8, w - 16, h - 16, 6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(224,168,74,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 16, y + 16, w - 32, h - 32, 4);
  ctx.stroke();
  // Lucky-coin medallions joined by a woven gold cord.
  const my = y + h / 2;
  ctx.strokeStyle = 'rgba(224,168,74,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 30, my);
  ctx.lineTo(x + w - 30, my);
  ctx.stroke();
  for (let lx = x + 70; lx < x + w - 40; lx += 92) {
    ctx.fillStyle = '#e0a84a';
    ctx.beginPath();
    ctx.arc(lx, my, 17, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#a82c24';
    ctx.beginPath();
    ctx.arc(lx, my, 12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e0a84a';
    ctx.fillRect(lx - 5, my - 5, 10, 10);
    ctx.fillStyle = '#8c2420';
    ctx.fillRect(lx - 2.5, my - 2.5, 5, 5);
    ctx.save();
    ctx.translate(lx + 46, my);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(224,168,74,0.75)';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }
}

function drawFloor(ctx) {
  const x0 = GRID_X;
  const y0 = GRID_Y;
  const w = COLS * TILE;
  const h = ROWS * TILE;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();
  // Warm wooden planks, staggered, with grain.
  const plank = 30;
  const tones = ['#8d5a36', '#83512f', '#97643c', '#7c4a2b'];
  for (let row = 0; row * plank < h; row += 1) {
    const y = y0 + row * plank;
    let x = x0 - ((row * 67) % 160);
    let k = row;
    while (x < x0 + w) {
      const len = 150 + ((k * 37) % 70);
      ctx.fillStyle = tones[k % tones.length];
      ctx.fillRect(x, y, len - 2, plank - 2);
      ctx.strokeStyle = 'rgba(60,30,12,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 9 + (k % 3) * 4);
      ctx.bezierCurveTo(x + len * 0.3, y + 6, x + len * 0.6, y + 16, x + len - 8, y + 10 + (k % 2) * 6);
      ctx.stroke();
      ctx.fillStyle = 'rgba(40,18,6,0.5)';
      ctx.fillRect(x + len - 2, y, 2, plank - 2);
      x += len;
      k += 3;
    }
    ctx.fillStyle = 'rgba(40,18,6,0.55)';
    ctx.fillRect(x0, y + plank - 2, w, 2);
  }
  drawRug(ctx, GRID_X + TILE * 2 + 20, GRID_Y + TILE * 4 + 14, TILE * 7 - 40, TILE * 2 - 30);
  // Warm light pools under the hanging lanterns.
  for (const [lx, ly] of [
    [330, 320],
    [600, 600],
    [880, 330],
  ]) {
    const g = ctx.createRadialGradient(lx, ly, 10, lx, ly, 300);
    g.addColorStop(0, 'rgba(255,200,120,0.3)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, w, h);
  }
  const vignette = ctx.createRadialGradient(560, 470, 220, 560, 470, 720);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(10,4,20,0.45)');
  ctx.fillStyle = vignette;
  ctx.fillRect(x0, y0, w, h);
  ctx.restore();
}

function isHot(type) {
  return type === 'pot' || type === 'wok' || type === 'steamer' || type === 'grill';
}

function drawCounterBody(ctx, kitchen, station) {
  const { x, y } = tileBox(station.c, station.r);
  const hot = isHot(station.type);
  const below = station.r + 1 >= ROWS || !stationAt(kitchen, station.c, station.r + 1);
  const topH = below ? TILE - FRONT : TILE;
  // Top face.
  const g = ctx.createLinearGradient(x, y, x, y + topH);
  if (hot) {
    g.addColorStop(0, '#6a707c');
    g.addColorStop(1, '#4b505b');
  } else {
    g.addColorStop(0, '#d79a5c');
    g.addColorStop(1, '#b97a42');
  }
  ctx.fillStyle = g;
  ctx.fillRect(x, y, TILE, topH);
  if (!hot) {
    ctx.strokeStyle = 'rgba(120,70,30,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 2, y + (i * topH) / 5 + Math.sin(station.c + i) * 3);
      ctx.bezierCurveTo(x + TILE * 0.3, y + (i * topH) / 5 - 4, x + TILE * 0.7, y + (i * topH) / 5 + 4, x + TILE - 2, y + (i * topH) / 5);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 4; i += 1) ctx.fillRect(x + 6 + i * 22, y + 4, 10, topH - 8);
  }
  // Seams between neighbouring counters.
  ctx.fillStyle = 'rgba(40,18,8,0.35)';
  ctx.fillRect(x, y, 1.5, topH);
  // Front face: red lacquer with a gold trim.
  if (below) {
    const f = ctx.createLinearGradient(x, y + topH, x, y + TILE);
    f.addColorStop(0, '#a3322a');
    f.addColorStop(1, '#5e1712');
    ctx.fillStyle = f;
    ctx.fillRect(x, y + topH, TILE, FRONT);
    ctx.fillStyle = '#e8b85a';
    ctx.fillRect(x, y + topH, TILE, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, y + TILE, TILE, 6);
    const label = LABELS[station.type];
    if (label) {
      ctx.fillStyle = '#ffe2a0';
      ctx.font = `bold 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + TILE / 2, y + topH + FRONT / 2 + 1.5);
    }
  }
  // Edge light toward the floor.
  const right = stationAt(kitchen, station.c + 1, station.r);
  const left = stationAt(kitchen, station.c - 1, station.r);
  ctx.fillStyle = hot ? 'rgba(200,210,225,0.35)' : 'rgba(255,220,160,0.45)';
  if (!right && station.c + 1 < COLS) ctx.fillRect(x + TILE - 3, y, 3, topH);
  if (!left && station.c > 0) ctx.fillRect(x, y, 3, topH);
  if (station.r > 0 && !stationAt(kitchen, station.c, station.r - 1)) ctx.fillRect(x, y, TILE, 3);
}

function drawCrate(ctx, station) {
  const { x, y, cx, cy } = tileBox(station.c, station.r);
  const w = TILE - 14;
  const h = TILE - FRONT - 12;
  ctx.fillStyle = 'rgba(30,10,0,0.35)';
  ctx.fillRect(x + 9, y + 9, w, h);
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(x + 7, y + 6, w, h);
  ctx.fillStyle = '#5a3418';
  ctx.fillRect(x + 12, y + 11, w - 10, h - 10);
  ctx.strokeStyle = '#b07a44';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 9, y + 8, w - 4, h - 4);
  const item = newItem(station.ing);
  const s = 34;
  drawIngredient(ctx, item, cx - 16, cy + 4, s);
  drawIngredient(ctx, item, cx + 16, cy + 8, s);
  drawIngredient(ctx, item, cx, cy - 10, s);
  // A paper tag with the ingredient's name.
  const name = INGREDIENTS[station.ing].name;
  ctx.font = `bold 11px ${FONT}`;
  const tw = ctx.measureText(name).width + 10;
  ctx.fillStyle = '#fff2d2';
  ctx.beginPath();
  ctx.roundRect(cx - tw / 2, y + TILE - FRONT - 16, tw, 15, 4);
  ctx.fill();
  ctx.fillStyle = '#5a2a14';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, cx, y + TILE - FRONT - 8.5);
}

function drawBoard(ctx, station) {
  const { cx, cy } = tileBox(station.c, station.r);
  ctx.fillStyle = 'rgba(40,15,0,0.35)';
  ctx.beginPath();
  ctx.roundRect(cx - 33, cy - 23, 70, 52, 10);
  ctx.fill();
  const g = ctx.createLinearGradient(cx - 35, cy - 25, cx + 35, cy + 25);
  g.addColorStop(0, '#f5d7a1');
  g.addColorStop(1, '#d7a866');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(cx - 36, cy - 26, 70, 50, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,95,40,0.35)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy - 16 + i * 11);
    ctx.lineTo(cx + 28, cy - 14 + i * 11);
    ctx.stroke();
  }
}

function drawCleaver(ctx, cx, cy, swing) {
  ctx.save();
  ctx.translate(cx + 30, cy + 2);
  ctx.rotate(-0.5 + swing);
  ctx.fillStyle = '#5a2e14';
  ctx.fillRect(-3, 6, 7, 20);
  const g = ctx.createLinearGradient(-12, -22, 12, 8);
  g.addColorStop(0, '#f4f7fa');
  g.addColorStop(1, '#8e98a4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(-11, -22, 22, 30, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(-9, -20, 4, 26);
  ctx.restore();
}

function drawPlateStack(ctx, station) {
  const { cx, cy } = tileBox(station.c, station.r);
  for (let i = 0; i < 5; i += 1) {
    const y = cy + 12 - i * 5;
    ctx.fillStyle = 'rgba(40,20,10,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx + 2, y + 4, 31, 19, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = i === 4 ? '#ffffff' : '#e8e4da';
    ctx.beginPath();
    ctx.ellipse(cx, y, 31, 19, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2f7f8f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, y, 26, 15, 0, 0, TAU);
    ctx.stroke();
  }
}

function drawTrash(ctx, station) {
  const { cx, cy } = tileBox(station.c, station.r);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + 6, 30, 26, 0, 0, TAU);
  ctx.fill();
  const g = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 32);
  g.addColorStop(0, '#5d6b5a');
  g.addColorStop(1, '#2b3329');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 30, 26, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#151a14';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 22, 18, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c94a3a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 7);
  ctx.lineTo(cx + 8, cy + 7);
  ctx.moveTo(cx + 8, cy - 7);
  ctx.lineTo(cx - 8, cy + 7);
  ctx.stroke();
}

function drawHatch(ctx, kitchen, station) {
  const { x, y } = tileBox(station.c, station.r);
  const first = stationAt(kitchen, station.c, station.r - 1)?.type !== 'serve';
  // Polished sill opening onto the street.
  const g = ctx.createLinearGradient(x, y, x + TILE, y);
  g.addColorStop(0, '#e8b064');
  g.addColorStop(1, '#a86a30');
  ctx.fillStyle = g;
  ctx.fillRect(x + 8, y, TILE - 16, TILE);
  ctx.fillStyle = 'rgba(255,240,200,0.25)';
  ctx.fillRect(x + 12, y, 6, TILE);
  ctx.fillStyle = '#9b2a22';
  ctx.fillRect(x, y, 10, TILE);
  ctx.fillRect(x + TILE - 10, y, 10, TILE);
  if (first) {
    ctx.fillStyle = '#c33a2c';
    ctx.fillRect(x - 2, y - 4, TILE + 4, 12);
    ctx.fillStyle = '#e8b85a';
    ctx.fillRect(x - 2, y + 6, TILE + 4, 3);
    // Brass bell.
    const bx = x + TILE / 2;
    const by = y + 40;
    const bg = ctx.createRadialGradient(bx - 5, by - 6, 2, bx, by, 18);
    bg.addColorStop(0, '#fff3b0');
    bg.addColorStop(0.5, '#e3b23c');
    bg.addColorStop(1, '#8a6214');
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(bx + 3, by + 14, 18, 7, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(bx, by, 16, Math.PI, 0);
    ctx.lineTo(bx + 19, by + 8);
    ctx.lineTo(bx - 19, by + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a3a0a';
    ctx.beginPath();
    ctx.arc(bx, by - 17, 4, 0, TAU);
    ctx.fill();
  } else {
    ctx.save();
    ctx.translate(x + TILE / 2, y + TILE / 2 - 6);
    ctx.fillStyle = '#fff2d2';
    ctx.beginPath();
    ctx.roundRect(-28, -14, 56, 28, 6);
    ctx.fill();
    ctx.fillStyle = '#9b2a22';
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SERVE', 0, 1);
    ctx.restore();
  }
}

function drawDecor(ctx, station) {
  const { cx, cy } = tileBox(station.c, station.r);
  if (station.r === 0) {
    // A jar of chopsticks and a sauce bottle.
    ctx.fillStyle = '#2f6f6a';
    ctx.beginPath();
    ctx.roundRect(cx - 26, cy - 10, 24, 30, 6);
    ctx.fill();
    ctx.strokeStyle = '#d8b07a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cx - 22 + i * 4, cy - 8);
      ctx.lineTo(cx - 26 + i * 6, cy - 32);
      ctx.stroke();
    }
    ctx.fillStyle = '#5a1a10';
    ctx.beginPath();
    ctx.roundRect(cx + 6, cy - 18, 18, 38, 6);
    ctx.fill();
    ctx.fillStyle = '#f2d36b';
    ctx.fillRect(cx + 8, cy - 2, 14, 10);
  } else {
    // A potted herb.
    ctx.fillStyle = '#b4532e';
    ctx.beginPath();
    ctx.roundRect(cx - 18, cy - 2, 36, 26, 6);
    ctx.fill();
    for (let i = 0; i < 7; i += 1) {
      const a = -Math.PI / 2 + (i - 3) * 0.4;
      ctx.fillStyle = i % 2 ? '#4cae3c' : '#6fd04e';
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * 14, cy - 8 + Math.sin(a) * 12, 7, 15, a + Math.PI / 2, 0, TAU);
      ctx.fill();
    }
  }
}

function drawStationBase(ctx, kitchen, station) {
  switch (station.type) {
    case 'crate':
      return drawCrate(ctx, station);
    case 'board':
      return drawBoard(ctx, station);
    case 'plates':
      return drawPlateStack(ctx, station);
    case 'trash':
      return drawTrash(ctx, station);
    case 'serve':
      return drawHatch(ctx, kitchen, station);
    case 'decor':
      return drawDecor(ctx, station);
    default:
      return undefined;
  }
}

/** Everything that never changes during a shift, drawn once into a cache canvas. */
export function drawStaticKitchen(ctx, kitchen) {
  drawStreet(ctx);
  drawFloor(ctx);
  for (const station of kitchen.stations) if (station.type !== 'serve') drawCounterBody(ctx, kitchen, station);
  for (const station of kitchen.stations) drawStationBase(ctx, kitchen, station);
  // The back wall strip with hanging ladles between the rail and the cooking line.
  ctx.fillStyle = '#2a1610';
  ctx.fillRect(GRID_X, GRID_Y - 8, COLS * TILE, 8);
}

// ---------------------------------------------------------------- cooking equipment (animated)

function itemSlots(n, cx, cy, spread) {
  if (n === 0) return [];
  if (n === 1) return [[cx, cy]];
  if (n === 2) return [
    [cx - spread * 0.5, cy],
    [cx + spread * 0.5, cy],
  ];
  return [
    [cx - spread * 0.55, cy + spread * 0.2],
    [cx + spread * 0.55, cy + spread * 0.2],
    [cx, cy - spread * 0.35],
  ];
}

function drawPot(ctx, station, t) {
  const { cx, cy } = tileBox(station.c, station.r);
  const busy = station.items.length > 0;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + 8, 38, 30, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3a3f48';
  ctx.fillRect(cx - 44, cy - 6, 10, 12);
  ctx.fillRect(cx + 34, cy - 6, 10, 12);
  const rim = ctx.createRadialGradient(cx - 12, cy - 12, 4, cx, cy, 40);
  rim.addColorStop(0, '#ffffff');
  rim.addColorStop(0.5, '#c4cad3');
  rim.addColorStop(1, '#6d7480');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 38, 31, 0, 0, TAU);
  ctx.fill();
  const broth = ctx.createRadialGradient(cx - 8, cy - 8, 2, cx, cy, 32);
  if (busy) {
    broth.addColorStop(0, '#ffd88a');
    broth.addColorStop(1, '#b8701e');
  } else {
    broth.addColorStop(0, '#f0c070');
    broth.addColorStop(1, '#9c6a2a');
  }
  ctx.fillStyle = broth;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 31, 25, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,245,210,0.6)';
  for (let i = 0; i < (busy ? 7 : 3); i += 1) {
    const a = i * 2.4 + t * (busy ? 2.2 : 0.8);
    const rr = ((t * 0.7 + i * 0.37) % 1) * 4 + 1.5;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * 18, cy + Math.sin(a * 1.3) * 13, rr, 0, TAU);
    ctx.fill();
  }
  itemSlots(station.items.length, cx, cy, 30).forEach(([x, y], i) => drawIngredient(ctx, station.items[i], x, y + Math.sin(t * 4 + i) * 1.5, 32));
}

function drawWok(ctx, station, t) {
  const { cx, cy } = tileBox(station.c, station.r);
  const busy = station.items.length > 0;
  // Burner ring with flame tongues.
  ctx.fillStyle = '#1e1f24';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 40, 32, 0, 0, TAU);
  ctx.fill();
  const tongues = 14;
  for (let i = 0; i < tongues; i += 1) {
    const a = (i / tongues) * TAU;
    const flick = busy ? 9 + Math.sin(t * 22 + i * 1.7) * 4 : 3;
    ctx.fillStyle = i % 2 ? '#ff8a1e' : '#ffcf3e';
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * 36, cy + 6 + Math.sin(a) * 28, 5, flick, a + Math.PI / 2, 0, TAU);
    ctx.fill();
  }
  // Wooden handle.
  ctx.save();
  ctx.translate(cx + 30, cy - 4);
  ctx.rotate(-0.35);
  ctx.fillStyle = '#2c2c30';
  ctx.fillRect(0, -4, 14, 8);
  ctx.fillStyle = '#8a5428';
  ctx.beginPath();
  ctx.roundRect(12, -6, 26, 12, 5);
  ctx.fill();
  ctx.restore();
  const toss = busy ? Math.sin(t * 9) * 2 : 0;
  const g = ctx.createRadialGradient(cx - 10, cy - 12 + toss, 4, cx, cy + toss, 38);
  g.addColorStop(0, '#6c7078');
  g.addColorStop(0.6, '#2a2c31');
  g.addColorStop(1, '#0c0d10');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy + toss, 36, 29, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy + toss, 33, 26, 0, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();
  itemSlots(station.items.length, cx, cy + toss, 26).forEach(([x, y], i) => drawIngredient(ctx, station.items[i], x, y - Math.abs(Math.sin(t * 9 + i)) * 4, 32));
}

function drawSteamer(ctx, station, t) {
  const { cx, cy } = tileBox(station.c, station.r);
  const busy = station.items.length > 0;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + 8, 38, 31, 0, 0, TAU);
  ctx.fill();
  const g = ctx.createRadialGradient(cx - 10, cy - 10, 4, cx, cy, 40);
  g.addColorStop(0, '#f2d496');
  g.addColorStop(1, '#a87c3c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 38, 31, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#8a5f28';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 33, 26, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#9fd36a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 30, 23, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,110,30,0.6)';
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 10, cy - 22);
    ctx.lineTo(cx + i * 10, cy + 22);
    ctx.stroke();
  }
  itemSlots(station.items.length, cx, cy, 28).forEach(([x, y], i) => drawIngredient(ctx, station.items[i], x, y, 32));
  // Woven lid tipped against the rim while something steams.
  if (busy) {
    ctx.fillStyle = 'rgba(214,170,98,0.92)';
    ctx.beginPath();
    ctx.ellipse(cx + 26, cy - 22, 22, 9, -0.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#8a5f28';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, 28, 18, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawGrill(ctx, station, t) {
  const { cx, cy } = tileBox(station.c, station.r);
  const busy = station.items.length > 0;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(cx - 38, cy - 24, 80, 56);
  ctx.fillStyle = '#26191a';
  ctx.beginPath();
  ctx.roundRect(cx - 40, cy - 28, 80, 56, 6);
  ctx.fill();
  for (let i = 0; i < 18; i += 1) {
    const ex = cx - 32 + (i % 6) * 13;
    const ey = cy - 18 + Math.floor(i / 6) * 16;
    const glow = 0.55 + 0.45 * Math.sin(t * (busy ? 6 : 2) + i * 1.9);
    ctx.fillStyle = `rgba(255,${110 + Math.round(glow * 80)},40,${0.45 + glow * 0.5})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 5, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#c9ced6';
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    ctx.moveTo(cx - 36 + i * 12, cy - 26);
    ctx.lineTo(cx - 36 + i * 12, cy + 26);
    ctx.stroke();
  }
  itemSlots(station.items.length, cx, cy, 30).forEach(([x, y], i) => drawIngredient(ctx, station.items[i], x, y, 38));
}

/** A plate sitting on a counter, or the item lying there. */
function drawHeldThing(ctx, thing, x, y, t, menu) {
  if (thing.kind === 'plate') {
    drawPlated(ctx, plateKeys(thing), x, y, 37, t);
    if (thing.items.length && matchRecipe(thing, menu)) drawReadyTag(ctx, x, y - 38, t);
  } else drawIngredient(ctx, thing, x, y, 52);
}

function drawReadyTag(ctx, x, y, t) {
  const bob = Math.sin(t * 5) * 2;
  ctx.fillStyle = '#2f9e44';
  ctx.beginPath();
  ctx.roundRect(x - 30, y - 10 + bob, 60, 20, 10);
  ctx.fill();
  ctx.strokeStyle = '#d9ffd0';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('READY ✓', x, y + 1 + bob);
}

/** The moving parts of one station: equipment, food in it or on it. */
export function drawStationTop(ctx, station, t, menu, chopSwing) {
  const { cx, cy } = tileBox(station.c, station.r);
  if (station.type === 'pot') drawPot(ctx, station, t);
  else if (station.type === 'wok') drawWok(ctx, station, t);
  else if (station.type === 'steamer') drawSteamer(ctx, station, t);
  else if (station.type === 'grill') drawGrill(ctx, station, t);
  if (station.held) drawHeldThing(ctx, station.held, cx, cy - 2, t, menu);
  if (station.type === 'board') drawCleaver(ctx, cx, cy, chopSwing);
}

// ---------------------------------------------------------------- progress and warnings

function ring(ctx, x, y, r, share, color, back = 'rgba(20,10,5,0.75)') {
  ctx.fillStyle = back;
  ctx.beginPath();
  ctx.arc(x, y, r + 4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0.001, share));
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function badge(ctx, x, y, r, fill, text) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(r * 1.3)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
}

/** Rings, chop bars and alarms, drawn over everything else in the kitchen. */
export function drawStationStatus(ctx, station, t) {
  const { x, y, cx, cy } = tileBox(station.c, station.r);
  if (isCookStation(station) && station.items.length) {
    const st = cookStatus(station);
    const bx = x + TILE - 14;
    const by = y + 12;
    if (st.burnt) badge(ctx, bx, by, 13, '#3a1a14', '✕');
    else if (st.warn > 0) {
      const flash = Math.sin(t * (10 + st.warn * 14)) > 0;
      ring(ctx, bx, by, 11, 1 - st.warn, flash ? '#ff3b2f' : '#ffb02e');
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', bx, by + 1);
      if (flash) {
        ctx.strokeStyle = 'rgba(255,60,40,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - FRONT - 6);
      }
    } else if (st.cooking >= 0) ring(ctx, bx, by, 11, st.cooking, '#7ee06a');
    else if (st.ready) badge(ctx, bx, by, 13, '#2f9e44', '✓');
  }
  if (station.type === 'board' && canChop(station.held) && station.held.progress > 0) {
    const w = 64;
    ctx.fillStyle = 'rgba(20,10,5,0.8)';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 - 3, cy - 44, w + 6, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#ffd34e';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - 41, w * Math.min(1, station.held.progress), 8, 4);
    ctx.fill();
  }
}

export function drawTargetHighlight(ctx, station, t) {
  const { x, y } = tileBox(station.c, station.r);
  const pulse = 0.55 + 0.45 * Math.sin(t * 7);
  ctx.strokeStyle = `rgba(255,236,150,${0.5 + pulse * 0.5})`;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 3, TILE - 6, TILE - FRONT - 4, 8);
  ctx.stroke();
}

export { tileBox };
