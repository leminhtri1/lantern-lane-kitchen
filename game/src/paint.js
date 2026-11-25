// Canvas primitives shared by every art module.

export const TAU = Math.PI * 2;

export function circle(ctx, x, y, r, fill) {
	ctx.fillStyle = fill;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, TAU);
	ctx.fill();
}

export function oval(ctx, x, y, rx, ry, fill, rot = 0) {
	ctx.fillStyle = fill;
	ctx.beginPath();
	ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
	ctx.fill();
}

export function rrect(ctx, x, y, w, h, r, fill) {
	ctx.fillStyle = fill;
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, r);
	ctx.fill();
}

export function radial(ctx, x0, y0, r0, x1, y1, r1, stops) {
	const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
	stops.forEach((color, i) => g.addColorStop(i / (stops.length - 1), color));
	return g;
}

export function linear(ctx, x0, y0, x1, y1, stops) {
	const g = ctx.createLinearGradient(x0, y0, x1, y1);
	stops.forEach((color, i) => g.addColorStop(i / (stops.length - 1), color));
	return g;
}

export function text(ctx, str, x, y, style, fill, align = 'center', baseline = 'middle') {
	ctx.font = style;
	ctx.fillStyle = fill;
	ctx.textAlign = align;
	ctx.textBaseline = baseline;
	ctx.fillText(str, x, y);
}

/** A polyline through flat [x0, y0, x1, y1, …] points, stroked (or filled) with the current style. */
export function path(ctx, pts, fill) {
	ctx.beginPath();
	for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
	if (fill) ctx.fill();
	else ctx.stroke();
}
