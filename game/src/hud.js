// The heads-up display above the stall.
import { FONT, TITLE_FONT, VIEW_W } from './config.js';
import { routeTo } from './ingredients.js';
import { RECIPES } from './recipes.js';
import { ticketRows } from './modifiers.js';
import { focusOrder, sharedParts } from './route-guide.js';
import { drawDish, drawIngredient } from './food-art.js';
import { isRushHour, rushLevel, starsFor } from './orders.js';
import { TAU, circle, linear, oval, path, radial, rrect, text } from './paint.js';
import { drawToolIcon } from './tool-icons.js';

export const TICKET_W = 170;
export const TICKET_H = 114;
const RAIL_X = 12;
const RAIL_Y = 24;

export function ticketX(i) {
	return RAIL_X + 6 + i * (TICKET_W + 8);
}

function patienceColor(share) {
	if (share > 0.55) return '#53c653';
	if (share > 0.28) return '#f2b632';
	return '#e8483a';
}

const TABLE_COLORS = ['#4fb0c6', '#e85d75', '#8e6bd8', '#3fb68b'];

function drawTicket(ctx, order, x, y, t, shared, focused) {
	const recipe = RECIPES[order.recipe];
	const share = Math.max(0, order.patience / order.maxPatience);
	const urgent = !order.outcome && share < 0.28;
	let ox = urgent ? Math.sin(t * 40) * 1.6 : 0;
	let oy = -(1 - Math.min(1, order.age / 0.35)) * 60;
	let alpha = 1;
	if (order.outcome) {
		oy += order.leaving * 50;
		alpha = Math.max(0, 1 - order.leaving * 1.3);
	}
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.translate(x + ox, y + oy);
	if (focused) {
		rrect(ctx, -5, -5, TICKET_W + 10, TICKET_H + 10, 10, `rgba(255,214,107,${0.55 + 0.3 * Math.sin(t * 5)})`);
	}
	ctx.fillStyle = '#c8a050';
	ctx.fillRect(TICKET_W / 2 - 8, -8, 16, 12);
	rrect(ctx, 3, 4, TICKET_W, TICKET_H, 6, 'rgba(0,0,0,0.35)');
	const paper = urgent && Math.sin(t * 10) > 0 ? '#ffe2d8' : order.critic ? '#efe4ff' : order.vip ? '#fff0b8' : '#fff4dc';
	rrect(ctx, 0, 0, TICKET_W, TICKET_H, 6, paper);
	if (order.vip || order.critic) {
		ctx.strokeStyle = order.critic ? '#7a4fc0' : '#d99a1e';
		ctx.lineWidth = 3;
		ctx.stroke();
	}
	ctx.fillStyle = 'rgba(80,40,20,0.18)';
	ctx.fillRect(6, 6, TICKET_W - 12, 9);
	ctx.fillStyle = order.outcome === 'served' ? '#53c653' : patienceColor(share);
	ctx.fillRect(6, 6, (TICKET_W - 12) * (order.outcome === 'served' ? 1 : share), 9);
	drawDish(ctx, order.recipe, 46, 52, 34, t, false);
	const rows = ticketRows(order, recipe.parts);
	const gap = rows.length > 3 ? 20 : 26;
	rows.forEach((row, i) => {
		const [ing, state] = row.key.split(':');
		const py = (rows.length > 3 ? 29 : 32) + i * gap;
		if (shared.has(row.key) && row.mark !== 'drop') {
			circle(ctx, 104, py, 12.5, 'rgba(120,200,90,0.45)');
			ctx.strokeStyle = '#3f9a2c';
			ctx.lineWidth = 2;
			ctx.stroke();
		}
		drawIngredient(ctx, { kind: 'item', ing, state }, 104, py, rows.length > 3 ? 21 : 24);
		routeTo(ing, state).forEach((tool, k) => drawToolIcon(ctx, tool, 130 + k * 20, py, 15));
		if (row.mark === 'drop') {
			ctx.strokeStyle = '#d23a2c';
			ctx.lineWidth = 3;
			path(ctx, [90, py, 166, py], false);
		} else if (row.mark === 'add') {
			circle(ctx, 89, py - 7, 7, '#2f9e44');
			text(ctx, '+', 89, py - 7, `bold 13px ${FONT}`, '#fff');
		}
	});
	text(ctx, recipe.short, 46, TICKET_H - 12, `bold 13px ${FONT}`, '#5a2a14');
	if (order.extra) {
		const add = order.extra.add;
		ctx.font = `bold 11px ${FONT}`;
		const w = ctx.measureText(order.extra.label).width + 12;
		rrect(ctx, 46 - w / 2, 16, w, 17, 8, add ? '#2f9e44' : '#c8302a');
		text(ctx, order.extra.label.toUpperCase(), 46, 25, `bold 10px ${FONT}`, '#fff');
	}
	if (order.vip || order.critic) {
		rrect(ctx, TICKET_W - 50, TICKET_H - 22, 46, 18, 9, order.critic ? '#5a3a9a' : '#c8302a');
		text(ctx, order.critic ? 'CRITIC' : 'VIP x2', TICKET_W - 27, TICKET_H - 12.5, `bold 11px ${FONT}`, '#ffe9a0');
	}
	if (order.table) {
		const c = TABLE_COLORS[order.table % TABLE_COLORS.length];
		rrect(ctx, TICKET_W / 2 - 34, -14, 68, 18, 9, c);
		text(ctx, `TABLE ${order.table}`, TICKET_W / 2, -4.5, `bold 11px ${FONT}`, '#fff');
	}
	if (order.outcome === 'served' || order.outcome === 'missed') {
		ctx.save();
		ctx.translate(TICKET_W / 2, TICKET_H / 2 + 4);
		ctx.rotate(-0.25);
		ctx.strokeStyle = order.outcome === 'served' ? '#2f9e44' : '#d23a2c';
		ctx.fillStyle = ctx.strokeStyle;
		ctx.lineWidth = 3;
		ctx.strokeRect(-48, -16, 96, 32);
		text(ctx, order.outcome === 'served' ? 'PAID' : 'LEFT', 0, 1, `bold 20px ${FONT}`, ctx.strokeStyle);
		ctx.restore();
	}
	ctx.restore();
}

function drawLanternString(ctx, t) {
	ctx.strokeStyle = '#1a0e08';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(0, 6);
	for (let x = 0; x <= VIEW_W; x += 40) ctx.lineTo(x, 6 + Math.sin(x * 0.02) * 2);
	ctx.stroke();
}

function drawRail(ctx, state, t) {
	const g = ctx.createLinearGradient(0, 0, 0, 146);
	g.addColorStop(0, '#2e1a12');
	g.addColorStop(1, '#1c100b');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, VIEW_W, 146);
	ctx.fillStyle = '#4a2a1a';
	ctx.fillRect(0, 140, VIEW_W, 6);
	drawLanternString(ctx, t);
	ctx.fillStyle = '#c8a050';
	ctx.fillRect(RAIL_X, RAIL_Y - 6, 5 * (TICKET_W + 8) + 4, 5);
	ctx.fillStyle = 'rgba(255,240,200,0.4)';
	ctx.fillRect(RAIL_X, RAIL_Y - 6, 5 * (TICKET_W + 8) + 4, 1.5);
	const live = state.orders;
	if (live.length === 0 && !state.over) {
		ctx.fillStyle = 'rgba(255,230,190,0.5)';
		ctx.font = `italic 18px ${FONT}`;
		ctx.textAlign = 'left';
		ctx.fillText('Waiting for the first customer…', RAIL_X + 20, 80);
	}
	const shared = sharedParts(live);
	const focus = focusOrder(state);
	live.forEach((order, i) => {
		const next = live[i + 1];
		if (order.table && next?.table === order.table) {
			ctx.fillStyle = TABLE_COLORS[order.table % TABLE_COLORS.length];
			ctx.fillRect(ticketX(i) + TICKET_W / 2, RAIL_Y - 8, TICKET_W + 8, 4);
		}
	});
	live.forEach((order, i) => drawTicket(ctx, order, ticketX(i), RAIL_Y, t, shared, order === focus && !state.over));
}

function drawClock(ctx, state, t) {
	const cx = 1002;
	const cy = 74;
	const r = 58;
	const share = state.timeLeft / state.duration;
	const late = state.timeLeft < 30;
	const final = state.timeLeft < 10 && !state.over;
	const shake = final ? Math.sin(t * 50) * 2 : 0;
	const beat = late && !state.over ? 1 + 0.06 * Math.max(0, Math.sin(t * TAU * (final ? 2 : 1))) : 1;
	ctx.save();
	ctx.translate(cx + shake, cy);
	ctx.scale(beat, beat);
	const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, r + 26);
	glow.addColorStop(0, late ? 'rgba(255,90,60,0.5)' : 'rgba(255,170,70,0.45)');
	glow.addColorStop(1, 'rgba(255,150,60,0)');
	circle(ctx, 0, 0, r + 26, glow);
	const body = radial(ctx, -18, -20, 6, 0, 0, r, late ? ['#ff6a4a', '#e01e1e', '#6a0808'] : ['#ff8a5c', '#d8392a', '#8a1a14']);
	oval(ctx, 0, 0, r, r * 0.95, body);
	ctx.strokeStyle = 'rgba(90,15,10,0.45)';
	ctx.lineWidth = 2;
	for (let i = -2; i <= 2; i += 1) {
		ctx.beginPath();
		ctx.ellipse(0, 0, Math.abs(i) * r * 0.24 + 2, r * 0.95, 0, 0, TAU);
		ctx.stroke();
	}
	ctx.fillStyle = '#e8b85a';
	ctx.fillRect(-22, -r * 0.95 - 6, 44, 10);
	ctx.fillRect(-22, r * 0.95 - 4, 44, 10);
	circle(ctx, 0, 0, r * 0.7, 'rgba(40,8,4,0.55)');
	ctx.strokeStyle = late ? '#ffcf5a' : '#fff1c8';
	ctx.lineWidth = 7;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.arc(0, 0, r * 0.7, -Math.PI / 2, -Math.PI / 2 + TAU * share);
	ctx.stroke();
	ctx.lineCap = 'butt';
	const secs = Math.ceil(state.timeLeft);
	const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
	const pop = final ? 1 + 0.15 * Math.max(0, Math.sin(t * TAU)) : 1;
	text(ctx, clock, 0, 2, `bold ${Math.round(30 * pop)}px ${FONT}`, late ? '#ffe066' : '#fffaf0');
	if (late && !state.over) {
		rrect(ctx, -40, r - 4, 80, 18, 9, '#ffe066');
		text(ctx, 'LAST CALL', 0, r + 5.5, `bold 12px ${FONT}`, '#8a1a14');
	}
	ctx.restore();
}

export function drawCoin(ctx, x, y, r) {
	const g = radial(ctx, x - r * 0.3, y - r * 0.3, 1, x, y, r, ['#fff3b0', '#f2b632', '#a8700e']);
	circle(ctx, x, y, r, g);
	ctx.fillStyle = '#7a4e08';
	ctx.fillRect(x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.5);
	ctx.fillStyle = '#ffe48a';
	ctx.fillRect(x - r * 0.12, y - r * 0.12, r * 0.24, r * 0.24);
}

export function drawStar(ctx, x, y, r, filled) {
	ctx.beginPath();
	for (let i = 0; i < 10; i += 1) {
		const rr = i % 2 === 0 ? r : r * 0.45;
		const a = -Math.PI / 2 + (i / 10) * TAU;
		ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
	}
	ctx.closePath();
	ctx.fillStyle = filled ? '#ffd23e' : 'rgba(255,255,255,0.12)';
	ctx.fill();
	ctx.strokeStyle = filled ? '#fff3b0' : 'rgba(255,230,180,0.4)';
	ctx.lineWidth = 1.5;
	ctx.stroke();
}

function drawPurse(ctx, state, t) {
	const x = 1080;
	text(ctx, `NIGHT ${state.nightIndex + 1}`, x, 20, `bold 13px ${FONT}`, '#ffcf8a', 'left', 'middle');
	ctx.fillStyle = 'rgba(255,230,190,0.7)';
	ctx.font = `12px ${FONT}`;
	ctx.fillText(state.night.title, x + 62, 20);
	const pop = 1 + 0.35 * state.fx.coinPop;
	drawCoin(ctx, x + 14, 50, 14 * pop);
	ctx.fillStyle = state.fx.coinPop > 0.3 ? '#fff6c0' : '#ffe08a';
	ctx.font = `bold ${Math.round(30 * pop)}px ${FONT}`;
	ctx.fillText(String(state.coins), x + 34, 52);
	const stars = starsFor(state);
	for (let i = 0; i < 3; i += 1) drawStar(ctx, x + 132 + i * 22, 50, 10, i < stars);
	const rush = rushLevel(state);
	const hour = isRushHour(state);
	const bx = x;
	const by = 80;
	const bw = 180;
	rrect(ctx, bx, by, bw, 16, 8, 'rgba(0,0,0,0.45)');
	const rg = linear(ctx, bx, 0, bx + bw, 0, ['#ffd23e', '#ff8a1e', '#ff3b2f']);
	rrect(ctx, bx + 2, by + 2, (bw - 4) * rush, 12, 6, rg);
	if (hour) {
		for (let i = 0; i < 6; i += 1) {
			const fx = bx + 12 + i * 30;
			const h = 8 + Math.sin(t * 16 + i * 2) * 4;
			oval(ctx, fx, by - 2, 4, h / 2, i % 2 ? '#ffcf3e' : '#ff7a1a');
		}
	}
	ctx.font = `bold 13px ${FONT}`;
	ctx.fillStyle = hour ? '#ff9a6a' : '#ffcf8a';
	const label = hour ? 'RUSH HOUR!' : rush > 0.45 ? 'Busy street' : 'Calm evening';
	ctx.fillText(label, bx, by + 32);
	if (state.combo > 1) {
		ctx.fillStyle = '#ff9fd0';
		ctx.textAlign = 'right';
		ctx.fillText(`Combo x${state.combo}`, bx + bw, by + 32);
	}
}

export function drawBanner(ctx, banner) {
	if (!banner) return;
	const k = Math.min(1, banner.time * 2, (2.6 - banner.time + 0.3) * 3);
	ctx.save();
	ctx.globalAlpha = Math.max(0, Math.min(1, k));
	const y = 430;
	ctx.fillStyle = 'rgba(30,10,5,0.72)';
	ctx.fillRect(0, y - 52, VIEW_W, 104);
	ctx.fillStyle = '#e8b85a';
	ctx.fillRect(0, y - 52, VIEW_W, 3);
	ctx.fillRect(0, y + 49, VIEW_W, 3);
	text(ctx, banner.text, VIEW_W / 2, y - 10, `bold 52px ${TITLE_FONT}`, '#ffe9b0');
	ctx.font = `18px ${FONT}`;
	ctx.fillStyle = '#ffcf8a';
	ctx.fillText(banner.sub, VIEW_W / 2, y + 30);
	ctx.restore();
}

export function drawHud(ctx, state, t) {
	drawRail(ctx, state, t);
	drawClock(ctx, state, t);
	drawPurse(ctx, state, t);
}
