// The cook and the customers queuing on the street.
import { FONT, GRID_Y, STREET_X } from './config.js';
import { drawIngredient, drawPlated, drawDish } from './food-art.js';
import { plateKeys } from './recipes.js';
import { TAU, circle, oval, path, rrect } from './paint.js';

function drawHeld(ctx, held, x, y, t) {
	if (!held) return;
	if (held.kind === 'plate') drawPlated(ctx, plateKeys(held), x, y, 28, t);
	else drawIngredient(ctx, held, x, y, 40);
}

const COOK_SCALE = 1.18;

export function drawCook(ctx, player, t) {
	ctx.save();
	ctx.translate(player.x, player.y);
	ctx.scale(COOK_SCALE, COOK_SCALE);
	ctx.translate(-player.x, -player.y);
	drawCookBody(ctx, player, t);
	ctx.restore();
}

function drawCookBody(ctx, player, t) {
	const { x, y, fx, fy } = player;
	const bob = player.moving ? Math.abs(Math.sin(player.walk)) * 3 : 0;
	const chopping = !!player.chopping;
	const hx = x + fx * 26;
	const hy = y - 4 + fy * 16;
	const behind = fy < -0.4;
	oval(ctx, x, y + 22, 24, 10, 'rgba(10,4,2,0.4)');
	const step = player.moving ? Math.sin(player.walk) * 5 : 0;
	ctx.fillStyle = '#2a1a14';
	ctx.beginPath();
	ctx.ellipse(x - 9, y + 19 + step * 0.4, 7, 5, 0, 0, TAU);
	ctx.ellipse(x + 9, y + 19 - step * 0.4, 7, 5, 0, 0, TAU);
	ctx.fill();
	if (behind) drawHeld(ctx, player.held, x + fx * 20, y - 54, t);
	const by = y - bob;
	const g = ctx.createLinearGradient(x - 22, by - 16, x + 22, by + 20);
	g.addColorStop(0, '#2a9a9e');
	g.addColorStop(1, '#16585e');
	rrect(ctx, x - 21, by - 18, 42, 38, 14, g);
	ctx.fillStyle = '#ff9a3c';
	ctx.fillRect(x - 21, by + 10, 42, 4);
	if (!behind) {
		rrect(ctx, x - 12, by - 8, 24, 26, 6, '#fbf3e2');
	}
	const swing = chopping ? Math.sin(t * 38) * 8 : 0;
	ctx.strokeStyle = '#1f7c80';
	ctx.lineWidth = 9;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(x - 16, by - 6);
	ctx.lineTo(hx - 10 - fy * 4, hy + (chopping ? swing : 0));
	ctx.moveTo(x + 16, by - 6);
	ctx.lineTo(hx + 10 + fy * 4, hy - (chopping ? swing : 0));
	ctx.stroke();
	ctx.fillStyle = '#f1c08a';
	ctx.beginPath();
	ctx.arc(hx - 10 - fy * 4, hy + (chopping ? swing : 0), 5, 0, TAU);
	ctx.arc(hx + 10 + fy * 4, hy - (chopping ? swing : 0), 5, 0, TAU);
	ctx.fill();
	const hy0 = by - 28;
	circle(ctx, x, hy0, 17, '#f1c08a');
	ctx.fillStyle = '#2b1a12';
	ctx.beginPath();
	if (behind) ctx.arc(x, hy0, 17.5, 0, TAU);
	else ctx.arc(x, hy0 - 3, 17.5, Math.PI * 1.02, Math.PI * 1.98);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(x - fx * 12, hy0 - 13 - fy * 3, 7, 0, TAU);
	ctx.fill();
	ctx.fillStyle = '#d8342a';
	ctx.fillRect(x - 17, hy0 - 9, 34, 6);
	const flap = Math.sin(t * 9 + player.walk) * 4;
	path(ctx, [x - fx * 16, hy0 - 6, x - fx * 30 - 4, hy0 - 2 + flap, x - fx * 28 + 2, hy0 + 4 + flap], true);
	if (!behind) {
		ctx.fillStyle = '#2b1a12';
		ctx.beginPath();
		ctx.arc(x - 6 + fx * 5, hy0 + 1 + fy * 3, 2.2, 0, TAU);
		ctx.arc(x + 6 + fx * 5, hy0 + 1 + fy * 3, 2.2, 0, TAU);
		ctx.fill();
		ctx.fillStyle = 'rgba(255,120,110,0.5)';
		ctx.beginPath();
		ctx.arc(x - 10 + fx * 5, hy0 + 7, 3, 0, TAU);
		ctx.arc(x + 10 + fx * 5, hy0 + 7, 3, 0, TAU);
		ctx.fill();
	}
	if (!behind) drawHeld(ctx, player.held, hx, hy, t);
	if (player.bump > 0) {
		ctx.fillStyle = `rgba(255,120,100,${player.bump * 2})`;
		ctx.font = `bold 20px ${FONT}`;
		ctx.textAlign = 'center';
		ctx.fillText('?', x + 22, hy0 - 18);
	}
}

const COATS = ['#e85d75', '#5b8def', '#f2a541', '#8e6bd8', '#3fb68b', '#e06c3c', '#4fb0c6'];
const HATS = ['#2b2340', '#ffd166', '#c8382c', '#1f6f50', '#f4f1e6', '#3a2a20', '#7a3b8c'];

function drawCustomer(ctx, order, x, y, t) {
	const leave = order.outcome ? order.leaving : 0;
	const dx = leave * 140;
	const alpha = order.outcome ? Math.max(0, 1 - leave * 1.2) : 1;
	const cx = x + dx;
	const sway = Math.sin(t * 2 + order.id) * 2;
	ctx.globalAlpha = alpha;
	oval(ctx, cx, y + 26, 22, 8, 'rgba(0,0,0,0.35)');
	rrect(ctx, cx - 20, y - 6 + sway * 0.3, 40, 34, 14, COATS[order.customer % COATS.length]);
	ctx.fillStyle = '#f0c49a';
	if (order.customer % 3 === 1) ctx.fillStyle = '#c99068';
	if (order.customer % 3 === 2) ctx.fillStyle = '#8d5a3c';
	ctx.beginPath();
	ctx.arc(cx, y - 16, 15, 0, TAU);
	ctx.fill();
	ctx.fillStyle = order.vip ? '#f2c14e' : HATS[order.customer % HATS.length];
	ctx.beginPath();
	ctx.arc(cx, y - 20, 15.5, Math.PI, TAU);
	ctx.fill();
	if (order.vip) {
		path(ctx, [cx - 12, y - 30, cx - 8, y - 44, cx - 2, y - 34, cx + 4, y - 46, cx + 8, y - 34, cx + 13, y - 42, cx + 12, y - 30], true);
	}
	ctx.fillStyle = '#2b1a12';
	ctx.beginPath();
	ctx.arc(cx - 8, y - 14, 2, 0, TAU);
	ctx.arc(cx - 1, y - 14, 2, 0, TAU);
	ctx.fill();
	const share = order.outcome ? (order.outcome === 'served' ? 1 : 0) : order.patience / order.maxPatience;
	ctx.strokeStyle = '#2b1a12';
	ctx.lineWidth = 2;
	ctx.beginPath();
	if (share > 0.5) ctx.arc(cx - 4, y - 10, 4, 0.2, Math.PI - 0.2);
	else if (share > 0.25) {
		ctx.moveTo(cx - 8, y - 7);
		ctx.lineTo(cx, y - 7);
	} else ctx.arc(cx - 4, y - 4, 4, Math.PI + 0.3, TAU - 0.3);
	ctx.stroke();
	if (order.outcome === 'served' && order.plate) drawPlated(ctx, plateKeys(order.plate), cx - 4, y + 12, 18, t, false);
	if (!order.outcome) {
		const bx = cx + 6;
		const by = y - 54;
		ctx.fillStyle = share < 0.25 && Math.sin(t * 12) > 0 ? '#ffd6cf' : '#fff8e8';
		ctx.beginPath();
		ctx.arc(bx, by, 22, 0, TAU);
		ctx.moveTo(bx - 10, by + 18);
		ctx.lineTo(bx - 16, by + 30);
		ctx.lineTo(bx - 2, by + 20);
		ctx.fill();
		drawDish(ctx, order.recipe, bx, by + 2, 15, t, false);
	}
	if (order.outcome === 'missed') {
		ctx.fillStyle = '#ff5a4a';
		ctx.font = `bold 22px ${FONT}`;
		ctx.textAlign = 'center';
		ctx.fillText('!!', cx + 16, y - 36);
	}
	ctx.globalAlpha = 1;
}

export function drawCustomers(ctx, orders, t) {
	const x = STREET_X + 82;
	orders.forEach((order, i) => {
		drawCustomer(ctx, order, x, GRID_Y + 70 + i * 122, t);
	});
}
