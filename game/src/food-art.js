// Every ingredient and dish drawn with canvas paths.
import { RECIPES } from './recipes.js';
import { TAU, circle, linear, oval, path, radial, rrect } from './paint.js';

function glossy(ctx, x, y, rx, ry, light, base, dark, rot = 0) {
	const g = radial(ctx, x - rx * 0.35, y - ry * 0.45, Math.max(1, Math.min(rx, ry) * 0.1), x, y, Math.max(rx, ry) * 1.1, [light, base, dark]);
	oval(ctx, x, y, rx, ry, g, rot);
}

function shine(ctx, x, y, rx, ry, alpha = 0.55, rot = -0.5) {
	oval(ctx, x, y, rx, ry, `rgba(255,255,255,${alpha})`, rot);
}

function shadow(ctx, x, y, rx, ry, alpha = 0.28) {
	oval(ctx, x, y, rx, ry, `rgba(20,8,4,${alpha})`);
}

function scatter(n, seed) {
	const out = [];
	let a = seed * 9301 + 49297;
	for (let i = 0; i < n; i += 1) {
		a = (a * 9301 + 49297) % 233280;
		const u = a / 233280;
		a = (a * 9301 + 49297) % 233280;
		const v = a / 233280;
		out.push([u, v]);
	}
	return out;
}

function noodleNest(ctx, x, y, s, cooked) {
	const r = s * 0.42;
	shadow(ctx, x, y + r * 0.55, r, r * 0.4);
	ctx.lineCap = 'round';
	const colors = cooked ? ['#f7d46a', '#ffe9a0', '#e6b445'] : ['#e9d8a6', '#f7ecc9', '#cdb67c'];
	for (let i = 0; i < 9; i += 1) {
		ctx.strokeStyle = colors[i % 3];
		ctx.lineWidth = s * 0.07;
		ctx.beginPath();
		const yy = y - r * 0.5 + (i / 8) * r;
		for (let k = 0; k <= 10; k += 1) {
			const xx = x - r + (k / 10) * 2 * r;
			const wob = Math.sin(k * 1.7 + i * 1.3) * s * 0.06;
			const squeeze = Math.sqrt(Math.max(0, 1 - ((xx - x) / r) ** 2));
			if (k === 0) ctx.moveTo(xx, yy * squeeze + y * (1 - squeeze) + wob);
			else ctx.lineTo(xx, yy * squeeze + y * (1 - squeeze) + wob);
		}
		ctx.stroke();
	}
	if (!cooked) {
		ctx.fillStyle = '#c8332b';
		ctx.fillRect(x - s * 0.06, y - r * 0.55, s * 0.12, r * 1.1);
	} else shine(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.1, 0.35);
}

function egg(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.3, s * 0.3, s * 0.1);
	glossy(ctx, x, y, s * 0.28, s * 0.36, '#fffaf0', '#f3e2c4', '#cfae84');
	shine(ctx, x - s * 0.09, y - s * 0.14, s * 0.07, s * 0.11, 0.7);
}

function boiledEgg(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.25, s * 0.34, s * 0.1);
	glossy(ctx, x, y, s * 0.34, s * 0.28, '#ffffff', '#f8f3ea', '#ddd2c0');
	glossy(ctx, x, y + s * 0.02, s * 0.17, s * 0.15, '#ffd27a', '#ff9f1c', '#e07a10');
	shine(ctx, x - s * 0.05, y - s * 0.04, s * 0.05, s * 0.03, 0.6);
}

function friedEgg(ctx, x, y, s) {
	const pts = scatter(7, 3);
	for (const [u, v] of pts) glossy(ctx, x + (u - 0.5) * s * 0.6, y + (v - 0.5) * s * 0.4, s * 0.15, s * 0.11, '#fff6b8', '#ffd84a', '#e8a71e');
}

function scallion(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.2, s * 0.42, s * 0.1);
	ctx.lineCap = 'round';
	for (let i = 0; i < 3; i += 1) {
		const oy = (i - 1) * s * 0.1;
		ctx.strokeStyle = '#f4f7e6';
		ctx.lineWidth = s * 0.1;
		path(ctx, [x - s * 0.4, y + oy + s * 0.05, x - s * 0.1, y + oy], false);
		ctx.strokeStyle = i === 1 ? '#3f9e36' : '#5cc24a';
		path(ctx, [x - s * 0.1, y + oy, x + s * 0.42, y + oy - s * 0.08 + i * s * 0.03], false);
	}
}

function scallionRings(ctx, x, y, s, n = 10, seed = 5, spread = 0.5) {
	for (const [u, v] of scatter(n, seed)) {
		const px = x + (u - 0.5) * s * spread * 2;
		const py = y + (v - 0.5) * s * spread * 1.3;
		circle(ctx, px, py, s * 0.065, v > 0.5 ? '#4cb43c' : '#7ad85e');
		circle(ctx, px, py, s * 0.03, '#d9f5c4');
	}
}

function cabbageHead(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.3, s * 0.36, s * 0.1);
	for (let i = 0; i < 5; i += 1) {
		const a = -Math.PI / 2 + (i - 2) * 0.42;
		glossy(ctx, x + Math.cos(a) * s * 0.08, y + Math.sin(a) * s * 0.06, s * 0.15, s * 0.36, '#d8ffb8', '#7ccf55', '#3f8f2f', a + Math.PI / 2);
	}
	oval(ctx, x, y + s * 0.2, s * 0.14, s * 0.12, '#f2f8e4');
}

function cabbageLeaves(ctx, x, y, s, cooked) {
	const base = cooked === 'fried' ? ['#a6e07a', '#4f9a33', '#2e6b1e'] : cooked === 'steamed' ? ['#d6ffb0', '#6fd24a', '#3d9a2c'] : ['#dcffc4', '#8fd16a', '#4f9a3a'];
	for (const [u, v] of scatter(6, 11)) {
		glossy(ctx, x + (u - 0.5) * s * 0.6, y + (v - 0.5) * s * 0.4, s * 0.17, s * 0.09, base[0], base[1], base[2], u * 3);
	}
	if (cooked === 'fried') {
		ctx.fillStyle = 'rgba(70,40,10,0.6)';
		for (const [u, v] of scatter(5, 2)) ctx.fillRect(x + (u - 0.5) * s * 0.5, y + (v - 0.5) * s * 0.3, s * 0.05, s * 0.03);
	}
}

function porkSlab(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.26, s * 0.4, s * 0.1);
	rrect(ctx, x - s * 0.38, y - s * 0.2, s * 0.76, s * 0.42, s * 0.12, '#c95b56');
	glossy(ctx, x, y - s * 0.02, s * 0.36, s * 0.17, '#ffb3a6', '#ef7f76', '#c95b56');
	rrect(ctx, x - s * 0.38, y - s * 0.22, s * 0.76, s * 0.09, s * 0.05, '#fff1e6');
	ctx.strokeStyle = 'rgba(255,240,230,0.7)';
	ctx.lineWidth = s * 0.03;
	ctx.beginPath();
	ctx.moveTo(x - s * 0.25, y + s * 0.05);
	ctx.quadraticCurveTo(x, y - s * 0.05, x + s * 0.25, y + s * 0.08);
	ctx.stroke();
}

function mince(ctx, x, y, s, state) {
	const tone = state === 'fried' ? ['#d79a5c', '#a5602b', '#6e3a14'] : state === 'steamed' ? ['#f2c2a6', '#d98e74', '#a7604b'] : ['#ffb0a6', '#e9776f', '#b94c46'];
	shadow(ctx, x, y + s * 0.22, s * 0.36, s * 0.1);
	for (const [u, v] of scatter(11, 7)) {
		glossy(ctx, x + (u - 0.5) * s * 0.55, y + (v - 0.5) * s * 0.35 - s * 0.04, s * 0.1, s * 0.08, tone[0], tone[1], tone[2]);
	}
	if (state === 'fried') shine(ctx, x - s * 0.1, y - s * 0.1, s * 0.12, s * 0.04, 0.4);
}

function chickenRaw(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.28, s * 0.38, s * 0.1);
	glossy(ctx, x, y, s * 0.38, s * 0.24, '#ffe3d6', '#f6b9a3', '#d98d76', -0.2);
	shine(ctx, x - s * 0.12, y - s * 0.08, s * 0.14, s * 0.05, 0.5);
}

function chickenCubes(ctx, x, y, s) {
	for (const [u, v] of scatter(6, 13)) {
		const px = x + (u - 0.5) * s * 0.55;
		const py = y + (v - 0.5) * s * 0.35;
		rrect(ctx, px - s * 0.1, py - s * 0.08, s * 0.2, s * 0.17, s * 0.04, '#e8a48f');
		ctx.fillStyle = '#ffd9c9';
		ctx.fillRect(px - s * 0.08, py - s * 0.07, s * 0.14, s * 0.06);
	}
}

function skewer(ctx, x, y, s, kind, angle = -0.35) {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle);
	ctx.strokeStyle = '#d8b07a';
	ctx.lineWidth = s * 0.05;
	ctx.lineCap = 'round';
	path(ctx, [-s * 0.55, 0, s * 0.55, 0], false);
	for (let i = 0; i < 3; i += 1) {
		const px = -s * 0.28 + i * s * 0.25;
		if (kind === 'chicken') {
			glossy(ctx, px, 0, s * 0.13, s * 0.12, '#ffd08a', '#d98a3a', '#8c4a17');
			ctx.strokeStyle = 'rgba(60,25,8,0.75)';
			ctx.lineWidth = s * 0.025;
			ctx.beginPath();
			ctx.moveTo(px - s * 0.08, -s * 0.06);
			ctx.lineTo(px + s * 0.03, s * 0.09);
			ctx.moveTo(px - s * 0.01, -s * 0.09);
			ctx.lineTo(px + s * 0.09, s * 0.05);
			ctx.stroke();
			shine(ctx, px - s * 0.04, -s * 0.05, s * 0.04, s * 0.02, 0.6);
		} else {
			glossy(ctx, px, 0, s * 0.13, s * 0.11, '#c99368', '#7a4a2a', '#3d2210');
			ctx.strokeStyle = 'rgba(255,230,200,0.5)';
			ctx.lineWidth = s * 0.02;
			ctx.beginPath();
			ctx.moveTo(px - s * 0.06, 0);
			ctx.lineTo(px + s * 0.06, 0);
			ctx.moveTo(px, -s * 0.06);
			ctx.lineTo(px, s * 0.06);
			ctx.stroke();
		}
	}
	ctx.restore();
}

function mushroomCap(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.28, s * 0.32, s * 0.09);
	rrect(ctx, x - s * 0.08, y - s * 0.02, s * 0.16, s * 0.3, s * 0.05, '#efe2c8');
	glossy(ctx, x, y - s * 0.06, s * 0.34, s * 0.2, '#c9946a', '#8a5532', '#4f2c15');
	ctx.fillStyle = 'rgba(255,235,210,0.55)';
	for (const [u, v] of scatter(4, 9)) {
		ctx.beginPath();
		ctx.arc(x + (u - 0.5) * s * 0.4, y - s * 0.1 + (v - 0.5) * s * 0.15, s * 0.03, 0, TAU);
		ctx.fill();
	}
}

function mushroomSlices(ctx, x, y, s, fried) {
	for (const [u, v] of scatter(6, 17)) {
		const px = x + (u - 0.5) * s * 0.55;
		const py = y + (v - 0.5) * s * 0.35;
		ctx.save();
		ctx.translate(px, py);
		ctx.rotate(u * 4);
		ctx.fillStyle = fried ? '#5a3418' : '#7d4f2e';
		ctx.beginPath();
		ctx.arc(0, 0, s * 0.11, Math.PI, 0);
		ctx.fill();
		ctx.fillStyle = fried ? '#b88a5c' : '#e8d4b4';
		ctx.fillRect(-s * 0.03, 0, s * 0.06, s * 0.09);
		if (fried) shine(ctx, -s * 0.03, -s * 0.05, s * 0.04, s * 0.015, 0.5, 0);
		ctx.restore();
	}
}

function shrimp(ctx, x, y, s, cooked, flip = 1) {
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(flip, 1);
	shadow(ctx, 0, s * 0.22, s * 0.3, s * 0.08);
	const segs = 6;
	for (let i = 0; i < segs; i += 1) {
		const a = Math.PI * 0.95 - (i / segs) * Math.PI * 1.25;
		const rr = s * 0.2;
		const px = Math.cos(a) * rr;
		const py = Math.sin(a) * rr * 0.9;
		const size = s * (0.14 - i * 0.012);
		if (cooked) glossy(ctx, px, py, size, size * 0.9, '#ffd2a8', '#ff7a4a', '#c8401e');
		else glossy(ctx, px, py, size, size * 0.9, '#e6eef2', '#9fb3be', '#5d7480');
	}
	ctx.fillStyle = cooked ? '#ff6a3a' : '#7f97a3';
	path(ctx, [s * 0.12, -s * 0.12, s * 0.32, -s * 0.22, s * 0.28, -s * 0.05], true);
	if (cooked) {
		ctx.strokeStyle = 'rgba(80,25,5,0.55)';
		ctx.lineWidth = s * 0.025;
		path(ctx, [-s * 0.12, -s * 0.06, 0, s * 0.08], false);
	}
	ctx.restore();
}

function riceSack(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.32, s * 0.34, s * 0.1);
	glossy(ctx, x, y + s * 0.06, s * 0.32, s * 0.28, '#f2dfb8', '#d6b77f', '#a8854d');
	ctx.fillStyle = '#b4413a';
	ctx.fillRect(x - s * 0.2, y - s * 0.16, s * 0.4, s * 0.06);
	glossy(ctx, x, y - s * 0.2, s * 0.22, s * 0.09, '#ffffff', '#f4f1e6', '#d8d2c0');
	ctx.fillStyle = '#c8bfa8';
	for (const [u, v] of scatter(6, 21)) ctx.fillRect(x + (u - 0.5) * s * 0.3, y - s * 0.22 + (v - 0.5) * s * 0.08, s * 0.04, s * 0.02);
}

function riceMound(ctx, x, y, s, fried) {
	shadow(ctx, x, y + s * 0.22, s * 0.42, s * 0.12);
	if (fried) glossy(ctx, x, y, s * 0.42, s * 0.28, '#fff0b0', '#f2c45a', '#c88a2a');
	else glossy(ctx, x, y, s * 0.4, s * 0.28, '#ffffff', '#f6f3ea', '#d4cdbd');
	ctx.fillStyle = fried ? 'rgba(160,100,30,0.6)' : 'rgba(200,192,170,0.8)';
	for (const [u, v] of scatter(16, fried ? 31 : 23)) {
		ctx.save();
		ctx.translate(x + (u - 0.5) * s * 0.62, y + (v - 0.5) * s * 0.36);
		ctx.rotate(u * 7);
		ctx.fillRect(-s * 0.025, -s * 0.01, s * 0.05, s * 0.02);
		ctx.restore();
	}
	shine(ctx, x - s * 0.12, y - s * 0.12, s * 0.12, s * 0.05, 0.45);
}

function doughBall(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.26, s * 0.34, s * 0.1);
	glossy(ctx, x, y, s * 0.34, s * 0.28, '#fffaf0', '#f2e3c6', '#cdb48a');
	ctx.fillStyle = 'rgba(255,255,255,0.6)';
	ctx.fillRect(x - s * 0.15, y - s * 0.12, s * 0.06, s * 0.03);
	ctx.fillRect(x + s * 0.06, y - s * 0.02, s * 0.05, s * 0.03);
}

function bao(ctx, x, y, s, filled) {
	shadow(ctx, x, y + s * 0.24, s * 0.36, s * 0.1);
	if (filled) {
		glossy(ctx, x, y + s * 0.06, s * 0.38, s * 0.2, '#ffffff', '#fbf3e4', '#dccbb0');
		glossy(ctx, x, y - s * 0.02, s * 0.3, s * 0.1, '#e9a46a', '#a85a28', '#6a3410');
		shine(ctx, x - s * 0.1, y - s * 0.05, s * 0.08, s * 0.025, 0.55, 0);
		glossy(ctx, x, y - s * 0.1, s * 0.36, s * 0.13, '#ffffff', '#fbf5ea', '#e0d2bc');
	} else {
		glossy(ctx, x, y, s * 0.36, s * 0.3, '#ffffff', '#fbf6ec', '#dcccb2');
		ctx.strokeStyle = 'rgba(190,165,130,0.8)';
		ctx.lineWidth = s * 0.025;
		for (let i = 0; i < 6; i += 1) {
			const a = (i / 6) * TAU;
			ctx.beginPath();
			ctx.moveTo(x, y - s * 0.08);
			ctx.quadraticCurveTo(x + Math.cos(a) * s * 0.12, y - s * 0.08 + Math.sin(a) * s * 0.06, x + Math.cos(a + 0.6) * s * 0.18, y - s * 0.08 + Math.sin(a + 0.6) * s * 0.1);
			ctx.stroke();
		}
		shine(ctx, x - s * 0.14, y - s * 0.12, s * 0.08, s * 0.04, 0.8);
	}
}

function mango(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.28, s * 0.34, s * 0.1);
	const g = ctx.createLinearGradient(x - s * 0.3, y - s * 0.2, x + s * 0.3, y + s * 0.25);
	g.addColorStop(0, '#9bd25a');
	g.addColorStop(0.35, '#ffd23e');
	g.addColorStop(0.75, '#ff9a2a');
	g.addColorStop(1, '#e8562a');
	oval(ctx, x, y, s * 0.36, s * 0.26, g, -0.4);
	shine(ctx, x - s * 0.12, y - s * 0.1, s * 0.1, s * 0.04, 0.6);
	oval(ctx, x + s * 0.28, y - s * 0.2, s * 0.12, s * 0.05, '#3f9e36', -0.8);
}

function mangoSlices(ctx, x, y, s, fan = false) {
	const n = fan ? 5 : 6;
	for (let i = 0; i < n; i += 1) {
		if (fan) {
			const a = -0.9 + (i / (n - 1)) * 1.8;
			ctx.save();
			ctx.translate(x, y + s * 0.15);
			ctx.rotate(a);
			glossy(ctx, 0, -s * 0.22, s * 0.07, s * 0.22, '#ffe58a', '#ffb52e', '#e8821a');
			ctx.restore();
		} else {
			const [u, v] = scatter(n, 41)[i];
			const px = x + (u - 0.5) * s * 0.5;
			const py = y + (v - 0.5) * s * 0.35;
			rrect(ctx, px - s * 0.09, py - s * 0.08, s * 0.18, s * 0.16, s * 0.04, '#ffa726');
			ctx.fillStyle = '#ffe08a';
			ctx.fillRect(px - s * 0.07, py - s * 0.07, s * 0.1, s * 0.05);
		}
	}
}

function burnt(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.22, s * 0.36, s * 0.1);
	glossy(ctx, x, y, s * 0.36, s * 0.24, '#5a4a40', '#2a201b', '#0d0a08');
	ctx.fillStyle = '#ff6a2a';
	for (const [u, v] of scatter(3, 51)) {
		ctx.beginPath();
		ctx.arc(x + (u - 0.5) * s * 0.4, y + (v - 0.5) * s * 0.2, s * 0.03, 0, TAU);
		ctx.fill();
	}
}

export function drawIngredient(ctx, item, x, y, s) {
	const { ing, state } = item;
	if (state === 'burnt') return burnt(ctx, x, y, s);
	switch (ing) {
		case 'noodles':
			return noodleNest(ctx, x, y, s, state === 'boiled');
		case 'egg':
			if (state === 'boiled') return boiledEgg(ctx, x, y, s);
			if (state === 'fried') return friedEgg(ctx, x, y, s);
			return egg(ctx, x, y, s);
		case 'scallion':
			return state === 'chopped' ? scallionRings(ctx, x, y, s, 12, 5, 0.32) : scallion(ctx, x, y, s);
		case 'cabbage':
			return state === 'raw' ? cabbageHead(ctx, x, y, s) : cabbageLeaves(ctx, x, y, s, state);
		case 'pork':
			return state === 'raw' ? porkSlab(ctx, x, y, s) : mince(ctx, x, y, s, state);
		case 'chicken':
			if (state === 'grilled') return skewer(ctx, x, y, s * 0.9, 'chicken');
			return state === 'chopped' ? chickenCubes(ctx, x, y, s) : chickenRaw(ctx, x, y, s);
		case 'mushroom':
			if (state === 'grilled') return skewer(ctx, x, y, s * 0.9, 'mushroom');
			if (state === 'chopped' || state === 'fried') return mushroomSlices(ctx, x, y, s, state === 'fried');
			return mushroomCap(ctx, x, y, s);
		case 'shrimp':
			return shrimp(ctx, x, y, s, state === 'grilled');
		case 'rice':
			return state === 'raw' ? riceSack(ctx, x, y, s) : riceMound(ctx, x, y, s * 0.85, state === 'fried');
		case 'bun':
			return state === 'steamed' ? bao(ctx, x, y, s, false) : doughBall(ctx, x, y, s);
		case 'mango':
			return state === 'chopped' ? mangoSlices(ctx, x, y, s) : mango(ctx, x, y, s);
		default:
			return undefined;
	}
}

function plateBase(ctx, x, y, r) {
	shadow(ctx, x + r * 0.06, y + r * 0.18, r * 1.02, r * 0.62, 0.35);
	const g = radial(ctx, x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r, ['#ffffff', '#f1efe8', '#cfcac0']);
	oval(ctx, x, y, r, r * 0.7, g);
	ctx.strokeStyle = '#2f7f8f';
	ctx.lineWidth = r * 0.06;
	ctx.beginPath();
	ctx.ellipse(x, y, r * 0.86, r * 0.6, 0, 0, TAU);
	ctx.stroke();
	ctx.fillStyle = 'rgba(47,127,143,0.9)';
	for (let i = 0; i < 12; i += 1) {
		const a = (i / 12) * TAU;
		ctx.beginPath();
		ctx.arc(x + Math.cos(a) * r * 0.93, y + Math.sin(a) * r * 0.65, r * 0.03, 0, TAU);
		ctx.fill();
	}
	oval(ctx, x, y, r * 0.78, r * 0.53, '#faf8f2');
}

function bowlBase(ctx, x, y, r, broth) {
	shadow(ctx, x + r * 0.05, y + r * 0.42, r * 1.0, r * 0.5, 0.35);
	const g = linear(ctx, x - r, y, x + r, y, ['#7d1d1a', '#c8382c', '#6a1614']);
	ctx.fillStyle = g;
	ctx.beginPath();
	ctx.ellipse(x, y + r * 0.12, r, r * 0.78, 0, 0, Math.PI);
	ctx.lineTo(x - r, y);
	ctx.ellipse(x, y, r, r * 0.62, 0, Math.PI, TAU);
	ctx.fill();
	ctx.strokeStyle = '#f2c14e';
	ctx.lineWidth = r * 0.05;
	ctx.beginPath();
	ctx.ellipse(x, y + r * 0.2, r * 0.94, r * 0.62, 0, 0.15, Math.PI - 0.15);
	ctx.stroke();
	oval(ctx, x, y, r, r * 0.62, '#f7efe0');
	if (broth) {
		const b = radial(ctx, x - r * 0.2, y - r * 0.2, r * 0.05, x, y, r * 0.9, ['#ffd98a', '#e8a33c', '#b8701e']);
		ctx.fillStyle = b;
	} else ctx.fillStyle = '#e9dcc6';
	ctx.beginPath();
	ctx.ellipse(x, y + r * 0.02, r * 0.86, r * 0.52, 0, 0, TAU);
	ctx.fill();
	if (broth) {
		ctx.fillStyle = 'rgba(255,240,190,0.55)';
		for (const [u, v] of scatter(7, 61)) {
			ctx.beginPath();
			ctx.arc(x + (u - 0.5) * r * 1.3, y + (v - 0.5) * r * 0.7, r * 0.035 + u * r * 0.03, 0, TAU);
			ctx.fill();
		}
	}
}

function brothNoodles(ctx, x, y, r) {
	ctx.lineCap = 'round';
	for (let i = 0; i < 7; i += 1) {
		ctx.strokeStyle = i % 2 ? '#ffe69a' : '#f6cf62';
		ctx.lineWidth = r * 0.08;
		ctx.beginPath();
		for (let k = 0; k <= 14; k += 1) {
			const t = k / 14;
			const px = x - r * 0.62 + t * r * 1.24;
			const py = y - r * 0.2 + i * r * 0.07 + Math.sin(t * 9 + i) * r * 0.06;
			if (k === 0) ctx.moveTo(px, py);
			else ctx.lineTo(px, py);
		}
		ctx.stroke();
	}
	shine(ctx, x - r * 0.25, y - r * 0.18, r * 0.25, r * 0.05, 0.35, 0);
}

function dumpling(ctx, x, y, s) {
	shadow(ctx, x, y + s * 0.18, s * 0.3, s * 0.08);
	ctx.fillStyle = '#f3ead6';
	ctx.beginPath();
	ctx.moveTo(x - s * 0.32, y + s * 0.1);
	ctx.quadraticCurveTo(x - s * 0.3, y - s * 0.26, x, y - s * 0.28);
	ctx.quadraticCurveTo(x + s * 0.3, y - s * 0.26, x + s * 0.32, y + s * 0.1);
	ctx.quadraticCurveTo(x, y + s * 0.22, x - s * 0.32, y + s * 0.1);
	ctx.fill();
	const g = radial(ctx, x - s * 0.1, y - s * 0.12, s * 0.02, x, y, s * 0.34, ['rgba(255,255,255,0.9)', 'rgba(220,200,165,0.2)']);
	ctx.fillStyle = g;
	ctx.fill();
	ctx.strokeStyle = 'rgba(180,150,110,0.9)';
	ctx.lineWidth = s * 0.03;
	for (let i = -2; i <= 2; i += 1) {
		ctx.beginPath();
		ctx.moveTo(x + i * s * 0.08, y - s * 0.26);
		ctx.quadraticCurveTo(x + i * s * 0.1, y - s * 0.14, x + i * s * 0.07, y - s * 0.06);
		ctx.stroke();
	}
	oval(ctx, x, y + s * 0.02, s * 0.12, s * 0.05, 'rgba(120,190,90,0.45)');
}

function sesame(ctx, x, y, r, seed) {
	ctx.fillStyle = '#fff6dc';
	for (const [u, v] of scatter(10, seed)) {
		ctx.beginPath();
		ctx.ellipse(x + (u - 0.5) * r * 1.2, y + (v - 0.5) * r * 0.7, r * 0.025, r * 0.014, u * 3, 0, TAU);
		ctx.fill();
	}
}

function steamWisps(ctx, x, y, r, t) {
	ctx.strokeStyle = 'rgba(255,255,255,0.5)';
	ctx.lineWidth = r * 0.07;
	ctx.lineCap = 'round';
	for (let i = -1; i <= 1; i += 1) {
		ctx.beginPath();
		const bx = x + i * r * 0.35;
		for (let k = 0; k <= 8; k += 1) {
			const py = y - r * 0.5 - k * r * 0.12;
			const px = bx + Math.sin(k * 0.9 + t * 3 + i * 2) * r * 0.08;
			if (k === 0) ctx.moveTo(px, py);
			else ctx.lineTo(px, py);
		}
		ctx.stroke();
	}
}

function containerFor(keys) {
	return keys.some((k) => k.startsWith('noodles')) ? 'bowl' : 'plate';
}

export function drawPlated(ctx, keys, x, y, r, t = 0, steam = true) {
	const has = (k) => keys.includes(k);
	const container = containerFor(keys);
	if (container === 'bowl') {
		bowlBase(ctx, x, y, r, has('noodles:boiled'));
		if (has('noodles:boiled')) brothNoodles(ctx, x, y, r);
		if (has('egg:boiled')) {
			boiledEgg(ctx, x + r * 0.32, y - r * 0.1, r * 0.55);
			boiledEgg(ctx, x + r * 0.5, y + r * 0.14, r * 0.5);
		}
		if (has('shrimp:grilled')) {
			shrimp(ctx, x - r * 0.35, y - r * 0.08, r * 0.62, true, 1);
			shrimp(ctx, x + r * 0.35, y + r * 0.02, r * 0.62, true, -1);
		}
		if (has('scallion:chopped')) scallionRings(ctx, x - r * 0.05, y + r * 0.05, r, 12, 9, 0.5);
		if (steam && has('noodles:boiled')) steamWisps(ctx, x, y, r, t);
		return;
	}
	plateBase(ctx, x, y, r);
	const s = r * 1.15;
	if (has('pork:steamed') && has('cabbage:steamed')) {
		dumpling(ctx, x - r * 0.4, y - r * 0.12, s * 0.7);
		dumpling(ctx, x + r * 0.05, y - r * 0.2, s * 0.7);
		dumpling(ctx, x + r * 0.45, y - r * 0.05, s * 0.7);
		dumpling(ctx, x - r * 0.18, y + r * 0.18, s * 0.7);
		dumpling(ctx, x + r * 0.26, y + r * 0.22, s * 0.7);
		if (steam) steamWisps(ctx, x, y, r * 0.8, t);
		return;
	}
	if (has('cabbage:steamed')) cabbageLeaves(ctx, x, y, s * 1.1, 'steamed');
	if (has('rice:steamed')) riceMound(ctx, x - r * 0.18, y, s * 0.85, false);
	if (has('rice:fried')) riceMound(ctx, x, y, s * 1.05, true);
	if (has('mushroom:fried') || has('cabbage:fried') || has('pork:fried')) {
		if (has('cabbage:fried')) cabbageLeaves(ctx, x - r * 0.12, y + r * 0.02, s, 'fried');
		if (has('pork:fried')) mince(ctx, x + r * 0.15, y - r * 0.02, s * 0.85, 'fried');
		if (has('mushroom:fried')) mushroomSlices(ctx, x, y + r * 0.06, s * 0.9, true);
		if (keys.length === 3) {
			shine(ctx, x - r * 0.2, y - r * 0.15, r * 0.25, r * 0.06, 0.3, 0);
			sesame(ctx, x, y, r, 71);
		}
	}
	if (has('bun:steamed')) {
		const filled = has('pork:steamed');
		bao(ctx, x - r * 0.3, y, s * 0.72, filled);
		bao(ctx, x + r * 0.32, y + r * 0.04, s * 0.72, filled);
	} else if (has('pork:steamed')) {
		mince(ctx, x, y, s * 0.8, 'steamed');
	}
	if (has('chicken:grilled')) skewer(ctx, x, y - r * 0.08, s * 1.2, 'chicken', -0.28);
	if (has('mushroom:grilled')) skewer(ctx, x, y + r * 0.16, s * 1.2, 'mushroom', -0.18);
	if (has('chicken:grilled') && has('mushroom:grilled')) sesame(ctx, x, y, r, 81);
	if (has('egg:fried')) friedEgg(ctx, x + r * 0.05, y - r * 0.04, s * 0.9);
	if (has('mango:chopped')) mangoSlices(ctx, x + r * 0.32, y - r * 0.05, s * 0.9, true);
	if (has('rice:steamed') && has('mango:chopped')) {
		ctx.strokeStyle = 'rgba(255,252,240,0.9)';
		ctx.lineWidth = r * 0.06;
		ctx.beginPath();
		ctx.moveTo(x - r * 0.45, y - r * 0.05);
		ctx.quadraticCurveTo(x - r * 0.18, y - r * 0.25, x + r * 0.05, y + r * 0.02);
		ctx.stroke();
	}
	if (has('scallion:chopped')) scallionRings(ctx, x, y - r * 0.02, r, 10, 13, 0.42);
}

export function drawDish(ctx, recipeId, x, y, r, t = 0, steam = true) {
	drawPlated(ctx, RECIPES[recipeId].parts, x, y, r, t, steam);
}
