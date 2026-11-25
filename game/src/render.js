// Paints one frame: kitchen, route guide, cook, effects, HUD and screens.
import { FONT, GRID_Y, ROWS, TILE, VIEW_H, VIEW_W } from './config.js';
import { drawStaticKitchen, drawStationStatus, drawStationTop, drawTargetHighlight } from './kitchen-art.js';
import { drawCook, drawCustomers } from './people-art.js';
import { drawParticles, drawTexts } from './effects.js';
import { drawBanner, drawHud } from './hud.js';
import { drawPause, drawResults, drawTitle } from './screens.js';
import { drawNightSky } from './night-sky.js';
import { drawGhostSlots, drawRouteCard, drawRoutePath, drawRouteStops, focusOrder, planRoute } from './route-guide.js';
import { dishSpecs, matchRecipe } from './recipes.js';
import { tileCenter } from './kitchen-layout.js';
import { drawAwning, drawRushGlow, drawStallSign } from './stall-dressing.js';
import { isRushHour, rushLevel } from './orders.js';

export function createRenderer(canvas) {
	const ctx = canvas.getContext('2d');
	const view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
	let cache = null;

	function resize() {
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const w = window.innerWidth;
		const h = window.innerHeight;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		view.dpr = dpr;
		view.scale = Math.min(w / VIEW_W, h / VIEW_H);
		view.ox = (w - VIEW_W * view.scale) / 2;
		view.oy = (h - VIEW_H * view.scale) / 2;
	}
	resize();
	window.addEventListener('resize', resize);

	function staticLayer(kitchen) {
		if (cache) return cache;
		cache = document.createElement('canvas');
		cache.width = VIEW_W;
		cache.height = VIEW_H;
		drawStaticKitchen(cache.getContext('2d'), kitchen);
		return cache;
	}

	function drawKitchen(state, screen) {
		const t = state.clock;
		const { kitchen, player } = state;
		const specs = dishSpecs(state);
		const focus = screen === 'play' && !state.over ? focusOrder(state) : null;
		const plan = focus ? planRoute(state, focus) : null;
		ctx.drawImage(staticLayer(kitchen), 0, 0);
		if (plan) {
			drawRouteCard(ctx, state, plan, drawRoutePath(ctx, state, plan, t), t);
		}
		drawNightSky(ctx, state.nightIndex, t);
		drawCustomers(ctx, state.orders, t);
		const playerRow = Math.floor((player.y - GRID_Y) / TILE);
		for (let r = 0; r < ROWS; r += 1) {
			for (const station of kitchen.stations) {
				if (station.r !== r) continue;
				const swing = player.chopping === station ? Math.sin(t * 38) * 0.7 : 0;
				drawStationTop(ctx, station, t, specs, swing);
				if (player.target === station && !state.over) drawTargetHighlight(ctx, station, t);
			}
			if (r === playerRow) drawCook(ctx, player, t);
		}
		for (const station of kitchen.stations) {
			drawStationStatus(ctx, station, t);
			const p = station.held;
			if (p?.kind === 'plate' && p.items.length && !matchRecipe(p, specs)) {
				const c = tileCenter(station.c, station.r);
				drawGhostSlots(ctx, state, p, c.x, c.y - 4, t);
			}
		}
		drawRouteStops(ctx, plan);
		drawAwning(ctx, t);
		drawStallSign(ctx, t);
		if (screen === 'play' && !state.over && isRushHour(state)) drawRushGlow(ctx, Math.min(1, (rushLevel(state) - 0.7) * 4), t);
		drawParticles(ctx, state.fx);
		drawTexts(ctx, state.fx, FONT);
	}

	function draw(scene) {
		const { state, screen, ui } = scene;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = '#0c0812';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		const k = view.dpr * view.scale;
		ctx.setTransform(k, 0, 0, k, view.ox * view.dpr, view.oy * view.dpr);
		ctx.save();
		ctx.beginPath();
		ctx.rect(0, 0, VIEW_W, VIEW_H);
		ctx.clip();
		const shake = state.fx.shake;
		if (shake > 0 && screen === 'play') {
			const s = shake * 6;
			ctx.translate(Math.sin(state.clock * 91) * s, Math.cos(state.clock * 77) * s);
		}
		drawKitchen(state, screen);
		if (screen !== 'title') drawHud(ctx, state, state.clock);
		if (state.fx.flash > 0) {
			ctx.globalAlpha = state.fx.flash * 0.35;
			ctx.fillStyle = state.fx.flashColor;
			ctx.fillRect(0, 0, VIEW_W, VIEW_H);
			ctx.globalAlpha = 1;
		}
		if (screen === 'play') {
			drawBanner(ctx, state.banner);
		}
		if (screen === 'title') drawTitle(ctx, ui, ui.time);
		else if (screen === 'paused') drawPause(ctx, state, ui.time);
		else if (screen === 'results') drawResults(ctx, state, ui, ui.time);
		ctx.restore();
	}

	function toLogical(clientX, clientY) {
		return { x: (clientX - view.ox) / view.scale, y: (clientY - view.oy) / view.scale };
	}

	return { draw, toLogical };
}
