// Particles (chop bits, sparks, steam, smoke, flames) and floating text.

export function createEffects() {
	return { particles: [], texts: [], flash: 0, flashColor: '#fff3c4', shake: 0, coinPop: 0 };
}

export function emit(fx, random, kind, x, y, count, opts = {}) {
	for (let i = 0; i < count; i += 1) {
		const angle = opts.angle ?? random() * Math.PI * 2;
		const spread = opts.spread ?? Math.PI * 2;
		const a = opts.angle !== undefined ? angle + (random() - 0.5) * spread : angle;
		const speed = (opts.speed ?? 80) * (0.5 + random());
		const life = (opts.life ?? 0.6) * (0.7 + random() * 0.6);
		fx.particles.push({
			kind,
			x: x + (random() - 0.5) * (opts.jitter ?? 10),
			y: y + (random() - 0.5) * (opts.jitter ?? 10),
			vx: Math.cos(a) * speed,
			vy: Math.sin(a) * speed,
			life,
			max: life,
			size: (opts.size ?? 5) * (0.7 + random() * 0.6),
			color: opts.colors ? opts.colors[Math.floor(random() * opts.colors.length)] : opts.color ?? '#fff',
			gravity: opts.gravity ?? 0,
			spin: random() * Math.PI,
		});
	}
}

export function floatText(fx, x, y, text, color = '#fff6d8', size = 22, life = 1.2) {
	fx.texts.push({ x, y, text, color, size, life, max: life });
}

export function updateEffects(fx, dt) {
	for (const p of fx.particles) {
		p.life -= dt;
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.vy += p.gravity * dt;
		if (p.kind === 'steam' || p.kind === 'smoke') {
			p.vx *= 1 - dt * 1.5;
			p.size += dt * 14;
		}
		p.spin += dt * 6;
	}
	fx.particles = fx.particles.filter((p) => p.life > 0);
	if (fx.particles.length > 500) fx.particles.splice(0, fx.particles.length - 500);
	for (const t of fx.texts) {
		t.life -= dt;
		t.y -= dt * 38;
	}
	fx.texts = fx.texts.filter((t) => t.life > 0);
	fx.flash = Math.max(0, fx.flash - dt * 2.5);
	fx.shake = Math.max(0, fx.shake - dt * 3);
	fx.coinPop = Math.max(0, fx.coinPop - dt * 2.5);
}

function star(ctx, x, y, r) {
	ctx.beginPath();
	for (let i = 0; i < 8; i += 1) {
		const rr = i % 2 === 0 ? r : r * 0.35;
		const a = (i / 8) * Math.PI * 2;
		ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
	}
	ctx.closePath();
	ctx.fill();
}

export function drawParticles(ctx, fx) {
	for (const p of fx.particles) {
		const k = p.life / p.max;
		ctx.globalAlpha = Math.min(1, k * 1.6);
		if (p.kind === 'steam') {
			ctx.globalAlpha = 0.32 * k;
			ctx.fillStyle = '#ffffff';
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx.fill();
		} else if (p.kind === 'smoke') {
			ctx.globalAlpha = 0.55 * k;
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx.fill();
		} else if (p.kind === 'spark') {
			ctx.fillStyle = p.color;
			star(ctx, p.x, p.y, p.size * (0.6 + 0.4 * Math.sin(p.spin)));
		} else if (p.kind === 'flame') {
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size * k, 0, Math.PI * 2);
			ctx.fill();
		} else {
			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate(p.spin);
			ctx.fillStyle = p.color;
			ctx.fillRect(-p.size / 2, -p.size / 3, p.size, (p.size * 2) / 3);
			ctx.restore();
		}
	}
	ctx.globalAlpha = 1;
}

export function drawTexts(ctx, fx, font) {
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	for (const t of fx.texts) {
		const k = t.life / t.max;
		const pop = k > 0.85 ? 1 + (k - 0.85) * 2.5 : 1;
		ctx.globalAlpha = Math.min(1, k * 2.2);
		ctx.font = `bold ${Math.round(t.size * pop)}px ${font}`;
		ctx.lineWidth = 5;
		ctx.strokeStyle = 'rgba(30,12,8,0.85)';
		ctx.strokeText(t.text, t.x, t.y);
		ctx.fillStyle = t.color;
		ctx.fillText(t.text, t.x, t.y);
	}
	ctx.globalAlpha = 1;
}
