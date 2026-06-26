"use client";

import { useEffect, useRef } from "react";

/**
 * Drifting starfield backdrop: a few hundred stars that twinkle and slowly pan
 * across the deep ink, the brighter ones wearing a soft halo so they read as
 * "shining". Depth (`z`) drives size, brightness and parallax, so nearer stars
 * are larger and drift a touch faster. Pure Canvas 2D, no deps; ~30fps, paused
 * when hidden, one still frame under prefers-reduced-motion. Decorative,
 * a11y-hidden.
 */
export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Natural-ish stellar colours (blue-white through warm orange), plus a
    // couple of faint brand tints (turquoise / berry) to tie into the theme.
    const STAR_COLORS = [
      "#eaf1ff",
      "#ffffff",
      "#dfe7f5",
      "#cdddff",
      "#fff4e0",
      "#ffe7c2",
      "#bff4ec", // faint turquoise
      "#f7cfe0", // faint berry
    ];

    type Star = {
      x: number; // seed position (drift is added at draw time)
      y: number;
      z: number; // depth 0..1 → size, brightness, parallax speed
      r: number; // radius in px
      b: number; // base brightness 0..1
      c: string; // colour
      tw: number; // twinkle speed
      ph: number; // twinkle phase
      amp: number; // twinkle amplitude 0..1 (0 = steady star)
      glow: boolean; // soft halo for the brighter stars
    };

    let width = 0;
    let height = 0;
    let stars: Star[] = [];

    // Very slow global drift (px/sec): the whole sky pans gently. Per-star
    // parallax scales this by depth so the field has a sense of distance.
    const DRIFT_X = 5.5;
    const DRIFT_Y = -3;

    const wrap = (v: number, max: number) => ((v % max) + max) % max;

    function withAlpha(hex: string, a: number): string {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }

    function seedStars() {
      // Denser field (was /4500, cap 600): a fuller sky, but each star is finer
      // (see `r` below) so more points read as "more stars", not "heavier".
      const count = Math.round(Math.min(1000, (width * height) / 2800));
      stars = [];
      for (let i = 0; i < count; i++) {
        const z = Math.random();
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          r: 0.3 + z * z * 1.05, // finer cores — most are pinpricks, few near ones ~1.3px
          b: 0.35 + z * 0.6,
          c: STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0],
          tw: 0.5 + Math.random() * 2.2,
          ph: Math.random() * Math.PI * 2,
          amp: Math.random() < 0.75 ? 0.35 + Math.random() * 0.45 : 0,
          glow: z > 0.86 && Math.random() < 0.5, // fewer haloed stars, so they don't fatten
        });
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedStars();
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, width, height);
      // Additive blending so overlapping glows build up light, not opacity.
      ctx!.globalCompositeOperation = "lighter";

      for (const s of stars) {
        // Parallax drift, wrapped around the edges.
        const px = wrap(s.x + DRIFT_X * s.z * t, width);
        const py = wrap(s.y + DRIFT_Y * s.z * t, height);

        // Twinkle: brightness breathes around its base value.
        const flick = s.amp
          ? 1 - s.amp + s.amp * (0.5 + 0.5 * Math.sin(t * s.tw + s.ph))
          : 1;
        const alpha = Math.min(1, s.b * flick);
        if (alpha < 0.02) continue;

        // Soft halo on the brighter stars so they "shine" — tighter and dimmer
        // than before (was r*5 @ 0.5) so haloed stars read sharp, not blobby.
        if (s.glow) {
          const gr = s.r * 3.6;
          const g = ctx!.createRadialGradient(px, py, 0, px, py, gr);
          g.addColorStop(0, withAlpha(s.c, alpha * 0.38));
          g.addColorStop(1, withAlpha(s.c, 0));
          ctx!.globalAlpha = 1;
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(px, py, gr, 0, Math.PI * 2);
          ctx!.fill();
        }

        // The star core.
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = s.c;
        ctx!.beginPath();
        ctx!.arc(px, py, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";
    }

    resize();

    if (reduceMotion) {
      draw(0);
      const onResizeStatic = () => {
        resize();
        draw(0);
      };
      window.addEventListener("resize", onResizeStatic);
      return () => window.removeEventListener("resize", onResizeStatic);
    }

    let raf = 0;
    let last = 0;
    const start = performance.now();

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (now - last < 33) return; // ~30fps is plenty for slow motion
      last = now;
      draw((now - start) / 1000);
    }
    raf = requestAnimationFrame(frame);

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
