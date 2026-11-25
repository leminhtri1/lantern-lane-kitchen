// The heads-up display above the stall: the ticket rail (each order's dish, its parts and the
// tools they need, and a draining patience bar), the lantern clock counting the shift down, the
// coin purse with its star targets, the rush meter and the big banners.
import { FONT, TITLE_FONT, VIEW_W } from './config.js';
import { routeTo } from './ingredients.js';
import { RECIPES } from './recipes.js';
import { drawDish, drawIngredient } from './food-art.js';
import { isRushHour, rushLevel, starsFor } from './orders.js';
import { TAU, circle, linear, oval, radial, rrect, text } from './paint.js';

export const TICKET_W = 170;
export const TICKET_H = 114;
const RAIL_X = 12;
const RAIL_Y = 24;

export function ticketX(i) {
  return RAIL_X + 6 + i * (TICKET_W + 8);
}

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
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, 0);
    ctx.lineTo(s * 0.45, 0);
    ctx.stroke();
  } else if (tool === 'grill') {
    ctx.fillStyle = '#2a1c1a';
    ctx.fillRect(-s * 0.45, -s * 0.3, s * 0.9, s * 0.6);
    ctx.fillStyle = '#ff7a2a';
    ctx.fillRect(-s * 0.38, s * 0.05, s * 0.76, s * 0.18);
    ctx.strokeStyle = '#d4d8de';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.25, -s * 0.3);
      ctx.lineTo(i * s * 0.25, s * 0.3);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function patienceColor(share) {
  if (share > 0.55) return '#53c653';
  if (share > 0.28) return '#f2b632';
  return '#e8483a';
}

function drawTicket(ctx, order, x, y, t) {
  const recipe = RECIPES[order.recipe];
  const share = Math.max(0, order.patience / order.maxPatience);
  const urgent = !order.outcome && share < 0.28;
  let ox = 0;
  let oy = 0;
  let alpha = 1;
  if (urgent) ox = Math.sin(t * 40) * 1.6;
  const slide = Math.min(1, order.age / 0.35);
  oy -= (1 - slide) * 60;
  if (order.outcome) {
    oy += order.leaving * 50;
    alpha = Math.max(0, 1 - order.leaving * 1.3);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + ox, y + oy);
  // Clip and string.
  ctx.fillStyle = '#c8a050';
  ctx.fillRect(TICKET_W / 2 - 8, -8, 16, 12);
  rrect(ctx, 3, 4, TICKET_W, TICKET_H, 6, 'rgba(0,0,0,0.35)');
  rrect(ctx, 0, 0, TICKET_W, TICKET_H, 6, urgent && Math.sin(t * 10) > 0 ? '#ffe2d8' : order.vip ? '#fff0b8' : '#fff4dc');
  if (order.vip) {
    ctx.strokeStyle = '#d99a1e';
    ctx.lineWidth = 3;
    ctx.stroke();
    rrect(ctx, TICKET_W - 46, TICKET_H - 24, 40, 18, 9, '#c8302a');
    text(ctx, 'VIP x2', TICKET_W - 26, TICKET_H - 14.5, `bold 11px ${FONT}`, '#ffe9a0', 'center', 'middle');
  }
  // Patience bar.
  ctx.fillStyle = 'rgba(80,40,20,0.18)';
  ctx.fillRect(6, 6, TICKET_W - 12, 9);
  ctx.fillStyle = order.outcome === 'served' ? '#53c653' : patienceColor(share);
  ctx.fillRect(6, 6, (TICKET_W - 12) * (order.outcome === 'served' ? 1 : share), 9);
  drawDish(ctx, order.recipe, 46, 54, 34, t, false);
  // Parts with the tools that get them there.
  recipe.parts.forEach((part, i) => {
    const [ing, state] = part.split(':');
    const py = 32 + i * 26;
    drawIngredient(ctx, { kind: 'item', ing, state }, 104, py, 24);
    routeTo(ing, state).forEach((tool, k) => drawToolIcon(ctx, tool, 130 + k * 20, py, 15));
  });
  text(ctx, recipe.short, 46, TICKET_H - 12, `bold 13px ${FONT}`, '#5a2a14', 'center', 'middle');
  if (order.outcome === 'served' || order.outcome === 'missed') {
    ctx.save();
    ctx.translate(TICKET_W / 2, TICKET_H / 2 + 4);
    ctx.rotate(-0.25);
    ctx.strokeStyle = order.outcome === 'served' ? '#2f9e44' : '#d23a2c';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 3;
    ctx.strokeRect(-48, -16, 96, 32);
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(order.outcome === 'served' ? 'PAID' : 'LEFT', 0, 1);
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
  live.forEach((order, i) => drawTicket(ctx, order, ticketX(i), RAIL_Y, t));
}

function drawClock(ctx, state, t) {
  const cx = 1002;
  const cy = 74;
  const r = 58;
  const share = state.timeLeft / state.duration;
  const late = state.timeLeft < 30;
  const final = state.timeLeft < 10 && !state.over;
  const shake = final ? Math.sin(t * 50) * 2 : 0;
  ctx.save();
  ctx.translate(cx + shake, cy);
  const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, r + 26);
  glow.addColorStop(0, late ? 'rgba(255,90,60,0.5)' : 'rgba(255,170,70,0.45)');
  glow.addColorStop(1, 'rgba(255,150,60,0)');
  circle(ctx, 0, 0, r + 26, glow);
  // Paper lantern body with ribs.
  const body = radial(ctx, -18, -20, 6, 0, 0, r, ['#ff8a5c', '#d8392a', '#8a1a14']);
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
  // Time-left dial.
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
  text(ctx, clock, 0, 2, `bold ${Math.round(30 * pop)}px ${FONT}`, final ? '#ffe066' : '#fffaf0', 'center', 'middle');
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
  // Rush meter.
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
  text(ctx, banner.text, VIEW_W / 2, y - 10, `bold 52px ${TITLE_FONT}`, '#ffe9b0', 'center', 'middle');
  ctx.font = `18px ${FONT}`;
  ctx.fillStyle = '#ffcf8a';
  ctx.fillText(banner.sub, VIEW_W / 2, y + 30);
  ctx.restore();
}

/** The first night's coaching line, in a pill over the rug. */
export function drawHint(ctx, hint) {
  if (!hint) return;
  ctx.font = `bold 17px ${FONT}`;
  const w = ctx.measureText(hint).width + 56;
  const x = 528 - w / 2;
  const y = 588;
  rrect(ctx, x, y, w, 40, 20, 'rgba(25,12,6,0.82)');
  ctx.strokeStyle = '#e8b85a';
  ctx.lineWidth = 2;
  ctx.stroke();
  circle(ctx, x + 22, y + 20, 9, '#ffd34e');
  text(ctx, '?', x + 22, y + 21, `bold 14px ${FONT}`, '#3a1a0a', 'center', 'middle');
  ctx.fillStyle = '#fff2d8';
  ctx.font = `bold 17px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(hint, x + 40, y + 21);
}

export function drawHud(ctx, state, t) {
  drawRail(ctx, state, t);
  drawClock(ctx, state, t);
  drawPurse(ctx, state, t);
}
