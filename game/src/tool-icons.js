// Tool pictograms (cleaver, pot, wok, steamer, grill) for tickets, the plan and the book.
import { circle, oval, path, rrect } from './paint.js';

export function drawToolIcon(ctx, tool, x, y, s) {
	ctx.save();
	ctx.translate(x, y);
	circle(ctx, 0, 0, s * 0.62, 'rgba(60,30,15,0.12)');
	if (tool === 'board') {
		ctx.rotate(-0.6);
		ctx.fillStyle = '#6b3a1a';
		ctx.fillRect(-s * 0.08, s * 0.05, s * 0.16, s * 0.42);
		rrect(ctx, -s * 0.26, -s * 0.48, s * 0.46, s * 0.56, 2, '#9aa6b2');
	} else if (tool === 'pot') {
		rrect(ctx, -s * 0.42, -s * 0.22, s * 0.84, s * 0.56, 3, '#8b939e');
		ctx.fillRect(-s * 0.55, -s * 0.18, s * 1.1, s * 0.1);
		ctx.fillStyle = '#e8a33c';
		ctx.fillRect(-s * 0.36, -s * 0.18, s * 0.72, s * 0.12);
	} else if (tool === 'wok') {
		oval(ctx, 0, s * 0.32, s * 0.4, s * 0.12, '#ff9a1e');
		ctx.fillStyle = '#25262b';
		ctx.beginPath();
		ctx.arc(0, -s * 0.12, s * 0.42, 0.05, Math.PI - 0.05);
		ctx.fill();
		ctx.fillRect(s * 0.36, -s * 0.16, s * 0.3, s * 0.1);
	} else if (tool === 'steamer') {
		rrect(ctx, -s * 0.45, -s * 0.3, s * 0.9, s * 0.6, s * 0.15, '#c99a52');
		ctx.strokeStyle = '#7a5420';
		ctx.lineWidth = 1.5;
		path(ctx, [-s * 0.45, 0, s * 0.45, 0], false);
	} else if (tool === 'grill') {
		ctx.fillStyle = '#2a1c1a';
		ctx.fillRect(-s * 0.45, -s * 0.3, s * 0.9, s * 0.6);
		ctx.fillStyle = '#ff7a2a';
		ctx.fillRect(-s * 0.38, s * 0.05, s * 0.76, s * 0.18);
		ctx.strokeStyle = '#d4d8de';
		ctx.lineWidth = 1.5;
		for (let i = -1; i <= 1; i += 1) {
			path(ctx, [i * s * 0.25, -s * 0.3, i * s * 0.25, s * 0.3], false);
		}
	}
	ctx.restore();
}
