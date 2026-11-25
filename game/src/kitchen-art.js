// The stall's art: counters and stations, what sits on them, progress rings and burn alarms.
import { COLS, FONT, GRID_X, GRID_Y, ROWS, STREET_X, TILE, VIEW_H, VIEW_W } from './config.js';
import { INGREDIENTS, canChop, newItem } from './ingredients.js';
import { isCookStation, stationAt } from './kitchen-layout.js';
import { cookStatus } from './stations.js';
import { matchRecipe, plateKeys } from './recipes.js';
import { drawIngredient, drawPlated } from './food-art.js';
import { TAU, circle, oval, path, radial, rrect, text } from './paint.js';

const FRONT = 18;
const LABELS = { pot: 'BROTH POT', wok: 'WOK', steamer: 'STEAMER', grill: 'GRILL', board: 'CHOP', plates: 'PLATES', trash: 'BIN' };

function tileBox(c, r) {
	const x = GRID_X + c * TILE;
	const y = GRID_Y + r * TILE;
	return { x, y, cx: x + TILE / 2, cy: y + (TILE - FRONT) / 2 };
}

function drawStreet(ctx) {
	const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
	g.addColorStop(0, '#15122a');
	g.addColorStop(1, '#231a3a');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, VIEW_W, VIEW_H);
	for (let y = GRID_Y - 10; y < VIEW_H; y += 26) {
		for (let x = STREET_X + ((y / 26) % 2) * 14; x < VIEW_W + 20; x += 30) {
			rrect(ctx, x, y, 26, 21, 7, (x + y) % 3 === 0 ? '#2e2748' : '#272140');
		}
	}
	const pool = radial(ctx, STREET_X + 70, 430, 10, STREET_X + 70, 430, 220, ['rgba(255,170,80,0.32)', 'rgba(255,170,80,0)']);
	ctx.fillStyle = pool;
	ctx.fillRect(STREET_X, GRID_Y, VIEW_W - STREET_X, VIEW_H - GRID_Y);
	ctx.fillStyle = '#1a0e08';
	ctx.fillRect(VIEW_W - 12, GRID_Y, 5, VIEW_H - GRID_Y);
	for (const ly of [200, 440, 680]) streetLantern(ctx, VIEW_W - 22, ly);
}

function streetLantern(ctx, x, y) {
	const glow = radial(ctx, x, y, 4, x, y, 60, ['rgba(255,160,70,0.45)', 'rgba(255,160,70,0)']);
	ctx.fillStyle = glow;
	ctx.fillRect(x - 60, y - 60, 120, 120);
	ctx.strokeStyle = '#1a0e08';
	ctx.lineWidth = 2;
	path(ctx, [x + 12, y - 30, x, y - 16], false);
	const body = radial(ctx, x - 4, y - 5, 2, x, y, 16, ['#ffc08a', '#e0402c', '#8a1a14']);
	oval(ctx, x, y, 13, 16, body);
	ctx.fillStyle = '#e8b85a';
	ctx.fillRect(x - 6, y - 18, 12, 4);
	ctx.fillRect(x - 6, y + 14, 12, 4);
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
	for (const [lx, ly] of [
		[330, 320],
		[600, 600],
		[880, 330],
	]) {
		const g = radial(ctx, lx, ly, 10, lx, ly, 300, ['rgba(255,200,120,0.3)', 'rgba(255,200,120,0)']);
		ctx.fillStyle = g;
		ctx.fillRect(x0, y0, w, h);
	}
	const vignette = radial(ctx, 560, 470, 220, 560, 470, 720, ['rgba(0,0,0,0)', 'rgba(10,4,20,0.45)']);
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
	ctx.fillStyle = 'rgba(40,18,8,0.35)';
	ctx.fillRect(x, y, 1.5, topH);
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
			text(ctx, label, x + TILE / 2, y + topH + FRONT / 2 + 1.5, `bold 11px ${FONT}`, '#ffe2a0');
		}
	}
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
	const name = INGREDIENTS[station.ing].name;
	ctx.font = `bold 11px ${FONT}`;
	const tw = ctx.measureText(name).width + 10;
	rrect(ctx, cx - tw / 2, y + TILE - FRONT - 16, tw, 15, 4, '#fff2d2');
	ctx.fillStyle = '#5a2a14';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(name, cx, y + TILE - FRONT - 8.5);
}

function drawBoard(ctx, station) {
	const { cx, cy } = tileBox(station.c, station.r);
	rrect(ctx, cx - 33, cy - 23, 70, 52, 10, 'rgba(40,15,0,0.35)');
	const g = ctx.createLinearGradient(cx - 35, cy - 25, cx + 35, cy + 25);
	g.addColorStop(0, '#f5d7a1');
	g.addColorStop(1, '#d7a866');
	rrect(ctx, cx - 36, cy - 26, 70, 50, 10, g);
	ctx.strokeStyle = 'rgba(150,95,40,0.35)';
	ctx.lineWidth = 1.2;
	for (let i = 0; i < 4; i += 1) {
		path(ctx, [cx - 30, cy - 16 + i * 11, cx + 28, cy - 14 + i * 11], false);
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
	rrect(ctx, -11, -22, 22, 30, 3, g);
	ctx.fillStyle = 'rgba(255,255,255,0.8)';
	ctx.fillRect(-9, -20, 4, 26);
	ctx.restore();
}

function drawPlateStack(ctx, station) {
	const { cx, cy } = tileBox(station.c, station.r);
	for (let i = 0; i < 5; i += 1) {
		const y = cy + 12 - i * 5;
		oval(ctx, cx + 2, y + 4, 31, 19, 'rgba(40,20,10,0.25)');
		oval(ctx, cx, y, 31, 19, i === 4 ? '#ffffff' : '#e8e4da');
		ctx.strokeStyle = '#2f7f8f';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.ellipse(cx, y, 26, 15, 0, 0, TAU);
		ctx.stroke();
	}
}

function drawTrash(ctx, station) {
	const { cx, cy } = tileBox(station.c, station.r);
	oval(ctx, cx + 3, cy + 6, 30, 26, 'rgba(0,0,0,0.35)');
	const g = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 32);
	g.addColorStop(0, '#5d6b5a');
	g.addColorStop(1, '#2b3329');
	oval(ctx, cx, cy, 30, 26, g);
	oval(ctx, cx, cy, 22, 18, '#151a14');
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

function drawHatch(ctx, station, kitchen) {
	const { x, y } = tileBox(station.c, station.r);
	const first = stationAt(kitchen, station.c, station.r - 1)?.type !== 'serve';
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
		const bx = x + TILE / 2;
		const by = y + 40;
		const bg = radial(ctx, bx - 5, by - 6, 2, bx, by, 18, ['#fff3b0', '#e3b23c', '#8a6214']);
		oval(ctx, bx + 3, by + 14, 18, 7, 'rgba(0,0,0,0.3)');
		ctx.fillStyle = bg;
		ctx.beginPath();
		ctx.arc(bx, by, 16, Math.PI, 0);
		ctx.lineTo(bx + 19, by + 8);
		ctx.lineTo(bx - 19, by + 8);
		ctx.closePath();
		ctx.fill();
		circle(ctx, bx, by - 17, 4, '#5a3a0a');
	} else {
		ctx.save();
		ctx.translate(x + TILE / 2, y + TILE / 2 - 6);
		rrect(ctx, -28, -14, 56, 28, 6, '#fff2d2');
		text(ctx, 'SERVE', 0, 1, `bold 15px ${FONT}`, '#9b2a22');
		ctx.restore();
	}
}

function drawDecor(ctx, station) {
	const { cx, cy } = tileBox(station.c, station.r);
	if (station.r === 0) {
		rrect(ctx, cx - 26, cy - 10, 24, 30, 6, '#2f6f6a');
		ctx.strokeStyle = '#d8b07a';
		ctx.lineWidth = 3;
		for (let i = 0; i < 5; i += 1) {
			path(ctx, [cx - 22 + i * 4, cy - 8, cx - 26 + i * 6, cy - 32], false);
		}
		rrect(ctx, cx + 6, cy - 18, 18, 38, 6, '#5a1a10');
		ctx.fillStyle = '#f2d36b';
		ctx.fillRect(cx + 8, cy - 2, 14, 10);
	} else {
		rrect(ctx, cx - 18, cy - 2, 36, 26, 6, '#b4532e');
		for (let i = 0; i < 7; i += 1) {
			const a = -Math.PI / 2 + (i - 3) * 0.4;
			oval(ctx, cx + Math.cos(a) * 14, cy - 8 + Math.sin(a) * 12, 7, 15, i % 2 ? '#4cae3c' : '#6fd04e', a + Math.PI / 2);
		}
	}
}

const BASES = { crate: drawCrate, board: drawBoard, plates: drawPlateStack, trash: drawTrash, serve: drawHatch, decor: drawDecor };

export function drawStaticKitchen(ctx, kitchen) {
	drawStreet(ctx);
	drawFloor(ctx);
	for (const station of kitchen.stations) if (station.type !== 'serve') drawCounterBody(ctx, kitchen, station);
	for (const station of kitchen.stations) BASES[station.type]?.(ctx, station, kitchen);
	ctx.fillStyle = '#2a1610';
	ctx.fillRect(GRID_X, GRID_Y - 8, COLS * TILE, 8);
}

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
	oval(ctx, cx + 3, cy + 8, 38, 30, 'rgba(0,0,0,0.35)');
	ctx.fillStyle = '#3a3f48';
	ctx.fillRect(cx - 44, cy - 6, 10, 12);
	ctx.fillRect(cx + 34, cy - 6, 10, 12);
	const rim = radial(ctx, cx - 12, cy - 12, 4, cx, cy, 40, ['#ffffff', '#c4cad3', '#6d7480']);
	oval(ctx, cx, cy, 38, 31, rim);
	const broth = ctx.createRadialGradient(cx - 8, cy - 8, 2, cx, cy, 32);
	if (busy) {
		broth.addColorStop(0, '#ffd88a');
		broth.addColorStop(1, '#b8701e');
	} else {
		broth.addColorStop(0, '#f0c070');
		broth.addColorStop(1, '#9c6a2a');
	}
	oval(ctx, cx, cy, 31, 25, broth);
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
	oval(ctx, cx, cy + 6, 40, 32, '#1e1f24');
	const tongues = 14;
	for (let i = 0; i < tongues; i += 1) {
		const a = (i / tongues) * TAU;
		const flick = busy ? 9 + Math.sin(t * 22 + i * 1.7) * 4 : 3;
		oval(ctx, cx + Math.cos(a) * 36, cy + 6 + Math.sin(a) * 28, 5, flick, i % 2 ? '#ff8a1e' : '#ffcf3e', a + Math.PI / 2);
	}
	ctx.save();
	ctx.translate(cx + 30, cy - 4);
	ctx.rotate(-0.35);
	ctx.fillStyle = '#2c2c30';
	ctx.fillRect(0, -4, 14, 8);
	rrect(ctx, 12, -6, 26, 12, 5, '#8a5428');
	ctx.restore();
	const toss = busy ? Math.sin(t * 9) * 2 : 0;
	const g = radial(ctx, cx - 10, cy - 12 + toss, 4, cx, cy + toss, 38, ['#6c7078', '#2a2c31', '#0c0d10']);
	oval(ctx, cx, cy + toss, 36, 29, g);
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
	oval(ctx, cx + 3, cy + 8, 38, 31, 'rgba(0,0,0,0.35)');
	const g = ctx.createRadialGradient(cx - 10, cy - 10, 4, cx, cy, 40);
	g.addColorStop(0, '#f2d496');
	g.addColorStop(1, '#a87c3c');
	oval(ctx, cx, cy, 38, 31, g);
	ctx.strokeStyle = '#8a5f28';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.ellipse(cx, cy, 33, 26, 0, 0, TAU);
	ctx.stroke();
	oval(ctx, cx, cy, 30, 23, '#9fd36a');
	ctx.strokeStyle = 'rgba(60,110,30,0.6)';
	ctx.lineWidth = 1.5;
	for (let i = -2; i <= 2; i += 1) {
		path(ctx, [cx + i * 10, cy - 22, cx + i * 10, cy + 22], false);
	}
	itemSlots(station.items.length, cx, cy, 28).forEach(([x, y], i) => drawIngredient(ctx, station.items[i], x, y, 32));
	if (busy) {
		oval(ctx, cx + 26, cy - 22, 22, 9, 'rgba(214,170,98,0.92)', -0.5);
		ctx.strokeStyle = '#8a5f28';
		ctx.lineWidth = 1.5;
		ctx.stroke();
		ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3);
		oval(ctx, cx, cy - 4, 28, 18, '#ffffff');
		ctx.globalAlpha = 1;
	}
}

function drawGrill(ctx, station, t) {
	const { cx, cy } = tileBox(station.c, station.r);
	const busy = station.items.length > 0;
	ctx.fillStyle = 'rgba(0,0,0,0.4)';
	ctx.fillRect(cx - 38, cy - 24, 80, 56);
	rrect(ctx, cx - 40, cy - 28, 80, 56, 6, '#26191a');
	for (let i = 0; i < 18; i += 1) {
		const ex = cx - 32 + (i % 6) * 13;
		const ey = cy - 18 + Math.floor(i / 6) * 16;
		const glow = 0.55 + 0.45 * Math.sin(t * (busy ? 6 : 2) + i * 1.9);
		circle(ctx, ex, ey, 5, `rgba(255,${110 + Math.round(glow * 80)},40,${0.45 + glow * 0.5})`);
	}
	ctx.strokeStyle = '#c9ced6';
	ctx.lineWidth = 3;
	for (let i = 0; i < 7; i += 1) {
		path(ctx, [cx - 36 + i * 12, cy - 26, cx - 36 + i * 12, cy + 26], false);
	}
	itemSlots(station.items.length, cx, cy, 30).forEach(([x, y], i) => drawIngredient(ctx, station.items[i], x, y, 38));
}

function drawHeldThing(ctx, thing, x, y, t, specs) {
	if (thing.kind === 'plate') {
		const done = thing.items.length && matchRecipe(thing, specs);
		if (done) {
			ctx.save();
			ctx.shadowColor = 'rgba(255,230,120,0.95)';
			ctx.shadowBlur = 18 + 6 * Math.sin(t * 5);
			circle(ctx, x, y, 40, 'rgba(255,240,170,0.5)');
			ctx.restore();
		}
		drawPlated(ctx, plateKeys(thing), x, y, 40, t);
		if (done) drawReadyTag(ctx, x, y - 40, t);
	} else drawIngredient(ctx, thing, x, y, 54);
}

function drawReadyTag(ctx, x, y, t) {
	const bob = Math.sin(t * 5) * 2;
	rrect(ctx, x - 30, y - 10 + bob, 60, 20, 10, '#2f9e44');
	ctx.strokeStyle = '#d9ffd0';
	ctx.lineWidth = 2;
	ctx.stroke();
	text(ctx, 'READY ✓', x, y + 1 + bob, `bold 13px ${FONT}`, '#ffffff');
}

export function drawStationTop(ctx, station, t, specs, chopSwing) {
	const { cx, cy } = tileBox(station.c, station.r);
	if (station.type === 'pot') drawPot(ctx, station, t);
	else if (station.type === 'wok') drawWok(ctx, station, t);
	else if (station.type === 'steamer') drawSteamer(ctx, station, t);
	else if (station.type === 'grill') drawGrill(ctx, station, t);
	const thing = station.held;
	if (thing && station.type === 'board' && canChop(thing) && thing.progress > 0) {
		const p = Math.min(1, thing.progress);
		drawIngredient(ctx, thing, cx - 8 - p * 6, cy - 2, 52 * (1 - p * 0.45));
		ctx.globalAlpha = Math.min(1, p * 1.6);
		drawIngredient(ctx, { ...thing, state: 'chopped' }, cx + 10, cy + 4, 30 + p * 16);
		ctx.globalAlpha = 1;
	} else if (thing) drawHeldThing(ctx, thing, cx, cy - 2, t, specs);
	if (station.type === 'board') drawCleaver(ctx, cx, cy, chopSwing);
}

function ring(ctx, x, y, r, share, color, back = 'rgba(20,10,5,0.75)') {
	circle(ctx, x, y, r + 4, back);
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

function badge(ctx, x, y, r, fill, label) {
	circle(ctx, x, y, r, fill);
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 2.5;
	ctx.stroke();
	text(ctx, label, x, y + 1, `bold ${Math.round(r * 1.3)}px ${FONT}`, '#ffffff');
}

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
			text(ctx, '!', bx, by + 1, `bold 15px ${FONT}`, '#ffffff');
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
		rrect(ctx, cx - w / 2 - 3, cy + 24, w + 6, 14, 7, 'rgba(20,10,5,0.8)');
		rrect(ctx, cx - w / 2, cy + 27, w * Math.min(1, station.held.progress), 8, 4, '#ffd34e');
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
