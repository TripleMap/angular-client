export const MSQR = function(src, options) {

    "use strict";

    options = options || {};

    var ctx;

    if (src instanceof CanvasRenderingContext2D) {
        ctx = src;
    } else if (src instanceof HTMLCanvasElement) {
        ctx = src.getContext("2d");
    } else if (src instanceof HTMLImageElement || src instanceof HTMLVideoElement) {
        ctx = img2context(src);
    } else throw "Invalid source.";

    var w = ctx.canvas.width,
        h = ctx.canvas.height,
        cx = (options.x || 0) | 0,
        cy = (options.y || 0) | 0,
        cw = (options.width || w) | 0,
        ch = (options.height || h) | 0,
        bu, paths = [],
        path,
        insides = [],
        inside,
        lastPos = 3,
        i, pt, // for recursive calls
        bleed = Math.max(1, options.bleed || 5),
        max = Math.max(1, options.maxShapes || 1),
        alpha = Math.max(0, Math.min(254, options.alpha || 0)),
        padding = options.padding || 0,
        tolerance = Math.max(0, options.tolerance || 0),
        doAlign = !!options.align,
        alignWeight = options.alignWeight || 0.95,
        retPath = !!options.path2D,
        dop = options.dop,
        ctx2, inc;

    if (cx < 0 || cy < 0 || cx >= w || cy >= h ||
        cw < 1 || ch < 1 || cx + cw > w || cy + ch > h)
        return [];

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = ctx.strokeStyle = "#000";
    ctx.globalAlpha = 1;
    ctx.shadowColor = "rgba(0,0,0,0)";


    // loop to find each shape
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = bleed;
    ctx.miterLimit = 1;

    do {
        path = trace();
        if (path.length) {
            // add to list
            if (path.length > 3) {
                paths.push(path);
            }
            // remove traced shape
            ctx.beginPath();
            i = path.length - 1;
            while (pt = path[i--]) {
                ctx.lineTo(pt.x, pt.y);
            };

            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }
    while (path.length && --max);

    return paths;

    function trace() {

        var path = [],
            data, l,
            i, x, y, sx, sy,
            start = -1,
            step, pStep = 9,
            steps = [9, 0, 3, 3, 2, 0, 9, 3, 1, 9, 1, 1, 2, 0, 2, 9];

        data = new Uint32Array(ctx.getImageData(cx, cy, cw, ch).data.buffer);
        l = data.length;
        for (i = lastPos; i < l; i++) {
            if ((data[i] >>> 24) > alpha) {
                start = lastPos = i;
                break
            }
        }

        if (start >= 0) {

            x = sx = (start % cw) | 0;
            y = sy = (start / cw) | 0;

            do {
                step = getNextStep(x, y);
                if (step === 0) y--;
                else if (step === 1) y++;
                else if (step === 2) x--;
                else if (step === 3) x++;

                if (step !== pStep) {
                    path.push({
                        x: x + cx,
                        y: y + cy
                    });
                    pStep = step;
                }
            }
            while (x !== sx || y !== sy);
            if (tolerance)
                path = reduce(path, tolerance);

            if (doAlign && !padding)
                path = align(path, alignWeight);
        }

        function getState(x, y) {
            return (x >= 0 && y >= 0 && x < cw && y < ch) ? (data[y * cw + x] >>> 24) > alpha : false
        }

        function getNextStep(x, y) {

            var v = 0;
            if (getState(x - 1, y - 1)) v |= 1;
            if (getState(x, y - 1)) v |= 2;
            if (getState(x - 1, y)) v |= 4;
            if (getState(x, y)) v |= 8;

            if (v === 6)
                return pStep === 0 ? 2 : 3;
            else if (v === 9)
                return pStep === 3 ? 0 : 1;
            else
                return steps[v];
        }

        function reduce(points, epsilon) {

            var len1 = points.length - 1;
            if (len1 < 2) return points;

            var fPoint = points[0],
                lPoint = points[len1],
                epsilon2 = epsilon * epsilon,
                i, index = -1,
                cDist, dist = 0,
                l1, l2, r1, r2;

            for (i = 1; i < len1; i++) {
                cDist = distPointToLine(points[i], fPoint, lPoint);
                if (cDist > dist) {
                    dist = cDist;
                    index = i
                }
            }

            if (dist > epsilon2) {
                l1 = points.slice(0, index + 1);
                l2 = points.slice(index);
                r1 = reduce(l1, epsilon);
                r2 = reduce(l2, epsilon);
                return r1.slice(0, r1.length - 1).concat(r2)
            } else
                return [fPoint, lPoint]
        }

        function distPointToLine(p, l1, l2) {

            var lLen = dist(l1, l2),
                t;

            if (!lLen)
                return 0;

            t = ((p.x - l1.x) * (l2.x - l1.x) + (p.y - l1.y) * (l2.y - l1.y)) / lLen;

            if (t < 0)
                return dist(p, l1);
            else if (t > 1)
                return dist(p, l2);
            else
                return dist(p, {
                    x: l1.x + t * (l2.x - l1.x),
                    y: l1.y + t * (l2.y - l1.y)
                });
        }

        function dist(p1, p2) {
            var dx = p1.x - p2.x,
                dy = p1.y - p2.y;
            return dx * dx + dy * dy
        }

        function align(points, w) {

            var ox = [1, -1, -1, 1],
                oy = [1, 1, -1, -1],
                p, t = 0;

            while (p = points[t++]) {

                p.x = Math.round(p.x);
                p.y = Math.round(p.y);

                for (var i = 0, tx, ty, dx, dy; i < 4; i++) {
                    dx = ox[i];
                    dy = oy[i];
                    tx = p.x + (dx << 1);
                    ty = p.y + (dy << 1);
                    if (tx > cx && ty > cy && tx < cw - 1 && ty < ch - 1) {
                        if (!getState(tx, ty)) {
                            tx -= dx;
                            ty -= dy;
                            if (getState(tx, ty)) {
                                p.x += dx * w;
                                p.y += dy * w;
                            }
                        }
                    }
                }
            }

            return points
        }

        return path
    }

    function img2context(src) {
        var c = document.createElement("canvas"),
            ctx;
        c.width = src.naturalWidth || src.videoWidth || src.width;
        c.height = src.naturalHeight || src.videoHeight || src.height;
        ctx = c.getContext("2d");
        ctx.drawImage(src, 0, 0);
        return ctx
    }
}