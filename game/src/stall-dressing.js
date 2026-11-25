// The awning, string lights, Kite Street sign and rush-hour glow.
import { FONT, GRID_X, GRID_Y, STREET_X, TITLE_FONT, VIEW_H, VIEW_W } from './config.js';
import { circle, linear, radial, rrect, text } from './paint.js';

const BULBS = ['#ffd36b', '#ff8a5c', '#9fe08a', '#7fd0ff', '#ffb0e0'];

export function drawAwning(ctx, t) {
	const y = 142;
	const w = 46;
	for (let i = 0, x = 0; x < STREET_X; i += 1, x += w) {
		ctx.fillStyle = i % 2 ? '#f4e6c8' : '#c8302a';
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + w, y);
		ctx.lineTo(x + w, y + 6);
		ctx.ellipse(x + w / 2, y + 6, w / 2, 8, 0, 0, Math.PI);
		ctx.fill();
	}
	for (let i = 0, x = 0; x <= STREET_X; i += 1, x += w) {
		const on = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7);
		const c = BULBS[i % BULBS.length];
		ctx.globalAlpha = 0.4 * on;
		circle(ctx, x, y + 9, 12, c);
		ctx.globalAlpha = 1;
		circle(ctx, x, y + 9, 4.5, c);
		circle(ctx, x - 1.2, y + 7.8, 1.6, '#fffbe8');
	}
}

export function drawStallSign(ctx, t) {
	const x = STREET_X + 10;
	const y = VIEW_H - 58 + Math.sin(t * 1.3) * 1.5;
	const w = VIEW_W - STREET_X - 34;
	ctx.strokeStyle = '#1a0e08';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x + 14, y - 12);
	ctx.lineTo(x + 14, y);
	ctx.moveTo(x + w - 14, y - 12);
	ctx.lineTo(x + w - 14, y);
	ctx.stroke();
	rrect(ctx, x, y, w, 48, 8, linear(ctx, 0, y, 0, y + 48, ['#8a4a22', '#5a2c12']));
	ctx.strokeStyle = '#e8b85a';
	ctx.stroke();
	text(ctx, 'KITE STREET', x + w / 2, y + 17, `bold 15px ${TITLE_FONT}`, '#ffe9b0');
	text(ctx, 'NIGHT MARKET', x + w / 2, y + 35, `bold 11px ${FONT}`, '#ffb36b');
}

/** A warm pulsing edge around the kitchen while the rush is on (0..1). */
export function drawRushGlow(ctx, level, t) {
	if (level <= 0) return;
	const a = level * (0.22 + 0.1 * Math.sin(t * 6));
	const w = STREET_X - GRID_X;
	const h = VIEW_H - GRID_Y;
	ctx.fillStyle = radial(ctx, GRID_X + w / 2, GRID_Y + h / 2, h * 0.45, GRID_X + w / 2, GRID_Y + h / 2, w * 0.62, ['rgba(255,80,30,0)', `rgba(255,80,30,${a})`]);
	ctx.fillRect(GRID_X, GRID_Y, w, h);
}
