// Title, recipe book (pause) and results with the stall upgrades.
import { FONT, TITLE_FONT, VIEW_H, VIEW_W } from './config.js';
import { INGREDIENTS, TOOL_VERBS, routeTo } from './ingredients.js';
import { NIGHTS, RECIPES } from './recipes.js';
import { drawDish, drawIngredient } from './food-art.js';
import { drawCoin, drawStar } from './hud.js';
import { drawToolIcon } from './tool-icons.js';
import { UPGRADES, upgradeState } from './upgrades.js';
import { circle, oval, path, radial, rrect, text } from './paint.js';

function veil(ctx, alpha) {
	ctx.fillStyle = `rgba(14,8,22,${alpha})`;
	ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function panel(ctx, x, y, w, h, fill = '#2a1710') {
	rrect(ctx, x + 6, y + 8, w, h, 16, 'rgba(0,0,0,0.4)');
	rrect(ctx, x, y, w, h, 16, fill);
	ctx.strokeStyle = '#e8b85a';
	ctx.lineWidth = 3;
	ctx.stroke();
}

function lantern(ctx, x, y, r, t, phase = 0) {
	const sway = Math.sin(t * 1.4 + phase) * 0.08;
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(sway);
	ctx.strokeStyle = '#1a0e08';
	ctx.lineWidth = 2;
	path(ctx, [0, -r * 2, 0, -r], false);
	const glow = radial(ctx, 0, 0, 2, 0, 0, r * 2.6, ['rgba(255,170,80,0.5)', 'rgba(255,170,80,0)']);
	circle(ctx, 0, 0, r * 2.6, glow);
	const body = radial(ctx, -r * 0.3, -r * 0.3, 2, 0, 0, r, ['#ffb07a', '#e0402c', '#8a1a14']);
	oval(ctx, 0, 0, r, r * 0.85, body);
	ctx.fillStyle = '#e8b85a';
	ctx.fillRect(-r * 0.4, -r * 0.95, r * 0.8, r * 0.2);
	ctx.fillRect(-r * 0.4, r * 0.75, r * 0.8, r * 0.2);
	ctx.strokeStyle = '#e8b85a';
	path(ctx, [0, r * 0.95, 0, r * 1.5], false);
	ctx.restore();
}

export function titleCardRects() {
	const w = 228;
	const gap = 16;
	const x0 = (VIEW_W - (5 * w + 4 * gap)) / 2;
	return NIGHTS.map((_, i) => ({ x: x0 + i * (w + gap), y: 300, w, h: 270, night: i }));
}

export function drawTitle(ctx, ui, t) {
	veil(ctx, 0.62);
	for (let i = 0; i < 9; i += 1) lantern(ctx, 70 + i * 142, 60 + (i % 2) * 22, 20, t, i);
	text(ctx, 'Kite Street Night Market', VIEW_W / 2 + 4, 176, `bold 76px ${TITLE_FONT}`, 'rgba(0,0,0,0.5)');
	const g = ctx.createLinearGradient(0, 140, 0, 210);
	g.addColorStop(0, '#fff2c0');
	g.addColorStop(1, '#ffb347');
	ctx.fillStyle = g;
	ctx.fillText('Kite Street Night Market', VIEW_W / 2, 172);
	ctx.font = `20px ${FONT}`;
	ctx.fillStyle = '#ffd9a8';
	ctx.fillText('Run a night-market food stall: read the tickets, chop, boil, fry, steam and grill, plate up and serve before the lanterns burn down.', VIEW_W / 2, 236);
	ctx.font = `bold 16px ${FONT}`;
	ctx.fillStyle = '#ffcf8a';
	ctx.fillText('Pick a night', VIEW_W / 2, 278);
	titleCardRects().forEach((rect) => {
		const night = NIGHTS[rect.night];
		const locked = rect.night > ui.unlocked;
		const selected = rect.night === ui.selected;
		ctx.save();
		if (selected) {
			ctx.shadowColor = 'rgba(255,190,90,0.8)';
			ctx.shadowBlur = 24;
		}
		panel(ctx, rect.x, rect.y - (selected ? 8 : 0), rect.w, rect.h, locked ? '#221a1e' : selected ? '#4a2416' : '#33190f');
		ctx.restore();
		const y = rect.y - (selected ? 8 : 0);
		const cx = rect.x + rect.w / 2;
		ctx.globalAlpha = locked ? 0.45 : 1;
		ctx.textAlign = 'center';
		ctx.fillStyle = '#ffcf8a';
		ctx.font = `bold 15px ${FONT}`;
		ctx.fillText(`NIGHT ${rect.night + 1}`, cx, y + 24);
		ctx.fillStyle = '#fff2d8';
		ctx.font = `bold 19px ${TITLE_FONT}`;
		ctx.fillText(night.title, cx, y + 50);
		const fresh = night.menu.filter((id) => rect.night === 0 || !NIGHTS[rect.night - 1].menu.includes(id));
		fresh.forEach((id, i) => {
			const n = fresh.length;
			const dx = cx + (i - (n - 1) / 2) * (n > 2 ? 72 : 90);
			drawDish(ctx, id, dx, y + 116, n > 2 ? 30 : 38, t, true);
			ctx.fillStyle = '#ffe9c4';
			ctx.font = `bold 12px ${FONT}`;
			ctx.fillText(RECIPES[id].short, dx, y + 166);
		});
		ctx.fillStyle = 'rgba(255,220,170,0.75)';
		ctx.font = `12px ${FONT}`;
		ctx.fillText(rect.night === 0 ? 'Three dishes to learn' : `New: ${fresh.length} dish${fresh.length > 1 ? 'es' : ''} · ${night.menu.length} on the menu`, cx, y + 196);
		const best = ui.stars[rect.night] ?? 0;
		for (let i = 0; i < 3; i += 1) drawStar(ctx, cx - 30 + i * 30, y + 228, 12, i < best);
		if (locked) {
			ctx.globalAlpha = 1;
			ctx.fillStyle = '#ffcf8a';
			ctx.font = `bold 13px ${FONT}`;
			ctx.fillText('Earn a star on the night before', cx, y + 254);
		}
		ctx.globalAlpha = 1;
	});
	ctx.textAlign = 'center';
	ctx.fillStyle = '#fff2d8';
	ctx.font = `bold 22px ${FONT}`;
	const blink = 0.6 + 0.4 * Math.sin(t * 4);
	ctx.globalAlpha = blink;
	ctx.fillText('Press Enter or click a night to open the stall', VIEW_W / 2, 624);
	ctx.globalAlpha = 1;
	drawControls(ctx, 676);
}

function drawControls(ctx, y) {
	const lines = [
		['WASD / Arrows', 'walk'],
		['Space / E', 'pick up · put down · hold to chop'],
		['Click', 'walk there and use it'],
		['P / Esc', 'pause and recipe book'],
		['M', 'music on/off'],
	];
	ctx.font = `14px ${FONT}`;
	let x = 70;
	for (const [key, what] of lines) {
		ctx.font = `bold 14px ${FONT}`;
		const kw = ctx.measureText(key).width + 16;
		rrect(ctx, x, y - 13, kw, 26, 6, '#5a3020');
		ctx.fillStyle = '#ffe9c4';
		ctx.textAlign = 'left';
		ctx.fillText(key, x + 8, y + 1);
		ctx.font = `14px ${FONT}`;
		ctx.fillStyle = '#ffcf8a';
		ctx.fillText(what, x + kw + 8, y + 1);
		x += kw + ctx.measureText(what).width + 34;
	}
	ctx.textAlign = 'center';
	ctx.fillStyle = 'rgba(255,220,170,0.7)';
	ctx.font = `14px ${FONT}`;
	ctx.fillText('Cook several things at once: a pot, wok, steamer or grill holds three. Serve fast for tips; serve in a row for a combo. Food left on the heat burns.', VIEW_W / 2, y + 44);
}

export function drawRecipeCard(ctx, id, x, y, w, h, t, menu) {
	const recipe = RECIPES[id];
	panel(ctx, x, y, w, h, '#fff4dc');
	drawDish(ctx, id, x + 70, y + h / 2 + 4, 50, t, true);
	text(ctx, recipe.name, x + 136, y + 22, `bold 17px ${TITLE_FONT}`, '#5a2a14', 'left', 'middle');
	recipe.parts.forEach((part, i) => {
		const [ing, state] = part.split(':');
		const py = y + 54 + i * 30;
		const route = routeTo(ing, state);
		drawIngredient(ctx, { kind: 'item', ing, state: 'raw' }, x + 154, py, 30);
		ctx.fillStyle = '#8a5a3a';
		ctx.font = `bold 16px ${FONT}`;
		ctx.textAlign = 'left';
		ctx.fillText('›', x + 174, py);
		let tx = x + 196;
		for (const tool of route) {
			drawToolIcon(ctx, tool, tx, py, 20);
			tx += 28;
		}
		ctx.fillText('›', tx - 8, py);
		const shared = menu.filter((m) => RECIPES[m].parts.includes(part)).length;
		if (shared > 1) {
			circle(ctx, tx + 18, py, 16, 'rgba(120,200,90,0.35)');
			ctx.strokeStyle = '#3f9a2c';
			ctx.lineWidth = 2;
			ctx.stroke();
			rrect(ctx, x + w - 84, py - 10, 70, 20, 10, '#3f9a2c');
			text(ctx, `in ${shared} dishes`, x + w - 49, py + 1, `bold 12px ${FONT}`, '#fff');
			ctx.fillStyle = '#6a3a1e';
			ctx.textAlign = 'left';
		}
		drawIngredient(ctx, { kind: 'item', ing, state }, tx + 18, py, 32);
		ctx.fillStyle = '#6a3a1e';
		ctx.font = `14px ${FONT}`;
		ctx.fillText(`${INGREDIENTS[ing].name}: ${route.map((tool) => TOOL_VERBS[tool]).join(' › ')}`, x + 338, py + 1);
	});
	ctx.fillStyle = '#a8701e';
	ctx.font = `bold 14px ${FONT}`;
	ctx.textAlign = 'right';
	ctx.fillText(`${recipe.price}`, x + w - 30, y + 22);
	drawCoin(ctx, x + w - 16, y + 22, 8);
}

export function drawPause(ctx, state, t) {
	veil(ctx, 0.72);
	text(ctx, 'Paused · Recipe Book', VIEW_W / 2, 70, `bold 46px ${TITLE_FONT}`, '#ffe9b0');
	ctx.fillStyle = '#ffcf8a';
	ctx.font = `16px ${FONT}`;
	ctx.fillText('Each part: raw ingredient › tools in order › plated. Green parts go in several dishes, so prep them in a batch.', VIEW_W / 2, 112);
	const menu = state.menu;
	const cols = menu.length > 4 ? 2 : 1;
	const w = cols === 2 ? 560 : 600;
	const h = 140;
	menu.forEach((id, i) => {
		const col = cols === 2 ? i % 2 : 0;
		const row = cols === 2 ? Math.floor(i / 2) : i;
		const x = cols === 2 ? VIEW_W / 2 - w - 12 + col * (w + 24) : VIEW_W / 2 - w / 2;
		drawRecipeCard(ctx, id, x, 138 + row * (h + 12), w, h, t, menu);
	});
	ctx.fillStyle = '#fff2d8';
	ctx.font = `bold 18px ${FONT}`;
	ctx.textAlign = 'center';
	ctx.fillText('Tickets may ask for extras: no scallion, double egg, add shrimp…  ·  P / Esc to cook on  ·  Q to leave', VIEW_W / 2, VIEW_H - 22);
}

export function upgradeRects() {
	return UPGRADES.map((u, i) => ({ x: VIEW_W / 2 - 340 + i * 172, y: 494, w: 164, h: 112 }));
}

function drawUpgrades(ctx, ui, t) {
	const progress = { bank: ui.bank ?? 0, perks: ui.perks ?? [] };
	text(ctx, 'STALL UPGRADES', VIEW_W / 2 - 336, 476, `bold 15px ${FONT}`, '#ffcf8a', 'left');
	text(ctx, `Savings ${progress.bank}`, VIEW_W / 2 + 310, 476, `bold 17px ${FONT}`, '#ffe08a', 'right');
	drawCoin(ctx, VIEW_W / 2 + 326, 476, 9);
	upgradeRects().forEach((r, i) => {
		const u = UPGRADES[i];
		const st = upgradeState(progress, i);
		rrect(ctx, r.x, r.y, r.w, r.h, 12, st === 'owned' ? '#1f4a2a' : st === 'buy' ? '#5a3020' : '#33221c');
		ctx.strokeStyle = st === 'owned' ? '#7ee06a' : st === 'buy' ? '#ffd34e' : '#6a4a3a';
		ctx.lineWidth = 2;
		ctx.stroke();
		circle(ctx, r.x + 30, r.y + 34, 22, '#fff4dc');
		if (u.icon === 'coin') drawCoin(ctx, r.x + 30, r.y + 34, 13);
		else drawToolIcon(ctx, u.icon, r.x + 30, r.y + 34, 30);
		text(ctx, `${i + 1}`, r.x + r.w - 14, r.y + 15, `bold 13px ${FONT}`, 'rgba(255,220,170,0.6)');
		text(ctx, u.name, r.x + 60, r.y + 26, `bold 14px ${FONT}`, '#fff2d8', 'left');
		text(ctx, u.what, r.x + r.w / 2, r.y + 68, `12px ${FONT}`, '#ffd9a8');
		const label = st === 'owned' ? 'OWNED ✓' : `${u.cost} coins`;
		text(ctx, label, r.x + r.w / 2, r.y + 94, `bold 15px ${FONT}`, st === 'owned' ? '#9fffb0' : st === 'buy' ? '#ffe066' : '#a08070');
	});
}

export function resultButtonRects(canAdvance) {
	const buttons = [];
	const y = 648;
	if (canAdvance) buttons.push({ id: 'next', label: 'Next night  ⏎', x: VIEW_W / 2 - 290, y, w: 180, h: 50 });
	buttons.push({ id: 'retry', label: 'Cook again  R', x: VIEW_W / 2 - 90, y, w: 180, h: 50 });
	buttons.push({ id: 'menu', label: 'Night select  Esc', x: VIEW_W / 2 + 110, y, w: 180, h: 50 });
	return buttons;
}

export function drawResults(ctx, state, ui, t) {
	veil(ctx, 0.66);
	const x = VIEW_W / 2 - 360;
	const y = 70;
	panel(ctx, x, y, 720, 650);
	text(ctx, `NIGHT ${state.nightIndex + 1} · ${state.night.title.toUpperCase()}`, VIEW_W / 2, y + 36, `bold 16px ${FONT}`, '#ffcf8a');
	ctx.fillStyle = '#ffe9b0';
	ctx.font = `bold 48px ${TITLE_FONT}`;
	ctx.fillText(ui.stars >= 3 ? 'A legendary night!' : ui.stars >= 2 ? 'The street is talking!' : ui.stars >= 1 ? 'Stall closed. Well done!' : 'A rough night…', VIEW_W / 2, y + 84);
	const shown = Math.min(ui.stars, Math.floor(ui.age * 2.2));
	for (let i = 0; i < 3; i += 1) {
		const pop = i < shown ? 1 + Math.max(0, 0.3 - (ui.age * 2.2 - i - 1) * 0.6) : 1;
		drawStar(ctx, VIEW_W / 2 - 100 + i * 100, y + 170 - (i === 1 ? 14 : 0), 40 * pop, i < shown);
	}
	drawCoin(ctx, VIEW_W / 2 - 70, y + 256, 20);
	ctx.fillStyle = '#ffe08a';
	ctx.font = `bold 46px ${FONT}`;
	ctx.textAlign = 'left';
	ctx.fillText(String(state.coins), VIEW_W / 2 - 40, y + 258);
	ctx.textAlign = 'center';
	ctx.fillStyle = 'rgba(255,220,170,0.75)';
	ctx.font = `14px ${FONT}`;
	ctx.fillText(`Stars at ${state.night.stars.join(' · ')} coins`, VIEW_W / 2, y + 296);
	const stats = [
		['Dishes served', state.served],
		['Customers lost', state.missed],
		['Tips', state.tips],
		['Best combo', `x${state.bestCombo}`],
	];
	stats.forEach(([label, value], i) => {
		const sx = x + 100 + i * 173;
		ctx.fillStyle = '#ffcf8a';
		ctx.font = `13px ${FONT}`;
		ctx.fillText(label, sx, y + 336);
		ctx.fillStyle = '#fff2d8';
		ctx.font = `bold 28px ${FONT}`;
		ctx.fillText(String(value), sx, y + 366);
	});
	drawUpgrades(ctx, ui, t);
	if (ui.newUnlock) {
		ctx.fillStyle = '#9fffb0';
		ctx.font = `bold 17px ${FONT}`;
		ctx.fillText(`Night ${state.nightIndex + 2} unlocked: ${NIGHTS[state.nightIndex + 1].title}`, VIEW_W / 2, y + 558);
	}
	for (const b of resultButtonRects(ui.canAdvance)) {
		rrect(ctx, b.x, b.y, b.w, b.h, 12, b.id === (ui.canAdvance ? 'next' : 'retry') ? '#d8392a' : '#5a3020');
		ctx.strokeStyle = '#e8b85a';
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.fillStyle = '#fff2d8';
		ctx.font = `bold 16px ${FONT}`;
		ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
	}
}
