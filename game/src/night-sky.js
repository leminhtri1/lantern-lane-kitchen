// Each night has its own weather over the street.
import { GRID_Y, STREET_X, VIEW_H, VIEW_W } from './config.js';
import { TAU, circle, radial } from './paint.js';

const W = VIEW_W - STREET_X;

function rain(ctx, t) {
	ctx.strokeStyle = 'rgba(170,190,255,0.45)';
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	for (let i = 0; i < 46; i += 1) {
		const x = STREET_X + ((i * 53.7) % W);
		const y = GRID_Y + ((t * 520 + i * 97.3) % (VIEW_H - GRID_Y));
		ctx.moveTo(x, y);
		ctx.lineTo(x - 5, y + 16);
	}
	ctx.stroke();
	ctx.strokeStyle = 'rgba(170,190,255,0.35)';
	for (let i = 0; i < 6; i += 1) {
		const k = (t * 1.3 + i * 0.37) % 1;
		ctx.beginPath();
		ctx.ellipse(STREET_X + 20 + ((i * 41) % (W - 40)), 260 + ((i * 131) % 480), 4 + k * 16, (4 + k * 16) * 0.35, 0, 0, TAU);
		ctx.globalAlpha = 1 - k;
		ctx.stroke();
	}
	ctx.globalAlpha = 1;
}

function fireworks(ctx, t) {
	for (let i = 0; i < 3; i += 1) {
		const cycle = 2.2 + i * 0.5;
		const k = ((t + i * 0.8) % cycle) / cycle;
		const n = Math.floor((t + i * 0.8) / cycle);
		const x = STREET_X + 30 + ((n * 47 + i * 53) % (W - 60));
		const y = GRID_Y + 40 + ((n * 71 + i * 89) % 260);
		const colors = ['#ffd166', '#ff6b9a', '#7ee0ff', '#b4ff7a'];
		const color = colors[(n + i) % colors.length];
		if (k < 0.25) {
			circle(ctx, x, y + (0.25 - k) * 600, 2.5, '#fff4c0');
			continue;
		}
		const r = (k - 0.25) * 90;
		ctx.globalAlpha = Math.max(0, 1 - (k - 0.25) / 0.75);
		ctx.fillStyle = color;
		for (let s = 0; s < 14; s += 1) {
			const a = (s / 14) * TAU;
			ctx.beginPath();
			ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r + r * r * 0.004, 2.6, 0, TAU);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	}
}

function skyLanterns(ctx, t) {
	for (let i = 0; i < 6; i += 1) {
		const y = VIEW_H - ((t * 26 + i * 120) % (VIEW_H - GRID_Y + 40));
		const x = STREET_X + 20 + ((i * 37) % (W - 40)) + Math.sin(t + i) * 6;
		const glow = radial(ctx, x, y, 1, x, y, 22, ['rgba(255,190,90,0.6)', 'rgba(255,190,90,0)']);
		ctx.fillStyle = glow;
		ctx.fillRect(x - 22, y - 22, 44, 44);
		ctx.fillStyle = '#ffb75e';
		ctx.beginPath();
		ctx.moveTo(x - 6, y - 8);
		ctx.lineTo(x + 6, y - 8);
		ctx.lineTo(x + 8, y + 8);
		ctx.lineTo(x - 8, y + 8);
		ctx.closePath();
		ctx.fill();
	}
}

function moon(ctx, t) {
	const x = STREET_X + W / 2;
	const y = GRID_Y + 60;
	const glow = radial(ctx, x, y, 10, x, y, 90, ['rgba(255,245,210,0.5)', 'rgba(255,245,210,0)']);
	ctx.fillStyle = glow;
	ctx.fillRect(x - 90, y - 90, 180, 180);
	circle(ctx, x, y, 30, '#fff6d8');
	ctx.fillStyle = 'rgba(220,205,170,0.6)';
	ctx.beginPath();
	ctx.arc(x - 9, y - 6, 6, 0, TAU);
	ctx.arc(x + 10, y + 8, 4, 0, TAU);
	ctx.fill();
	ctx.fillStyle = 'rgba(255,190,210,0.8)';
	for (let i = 0; i < 10; i += 1) {
		const py = GRID_Y + ((t * 40 + i * 71) % (VIEW_H - GRID_Y));
		const px = STREET_X + ((i * 29 + Math.sin(t + i) * 20 + 400) % W);
		ctx.beginPath();
		ctx.ellipse(px, py, 4, 2.2, t + i, 0, TAU);
		ctx.fill();
	}
}

export function drawNightSky(ctx, nightIndex, t) {
	ctx.save();
	ctx.beginPath();
	ctx.rect(STREET_X, GRID_Y, W, VIEW_H - GRID_Y);
	ctx.clip();
	if (nightIndex === 1) skyLanterns(ctx, t);
	else if (nightIndex === 2) rain(ctx, t);
	else if (nightIndex === 3) fireworks(ctx, t);
	else if (nightIndex === 4) moon(ctx, t);
	ctx.restore();
}
