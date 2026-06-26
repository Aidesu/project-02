"use client";

import { useEffect, useRef } from "react";

/**
 * Realistic black-hole backdrop: a starfield lensed by a slowly drifting point
 * mass. Each background star is bent by the actual point-mass lens equation,
 * β = θ − θ_E²/θ, which yields two images per star — a bright primary just
 * outside the Einstein radius and a faint secondary inside it — each scaled by
 * its magnification, so the Einstein ring emerges from the physics rather than
 * being drawn. The hole's own light is fully captured: a plain black shadow,
 * no accretion disk or glow. Canvas 2D, no deps; ~30fps, paused when hidden,
 * one static frame under prefers-reduced-motion. Decorative, a11y-hidden.
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

    // Natural-ish stellar colours (blue-white through warm orange).
    const STAR_COLORS = [
      "#eaf1ff",
      "#ffffff",
      "#dfe7f5",
      "#cdddff",
      "#fff4e0",
      "#ffe7c2",
      "#ffd6a8",
    ];

    type Star = { x: number; y: number; r: number; b: number; c: string };

    let width = 0;
    let height = 0;
    let stars: Star[] = [];

    function seedStars() {
      const count = Math.round(Math.min(420, (width * height) / 6500));
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.0 + 0.35,
          b: Math.random() * 0.5 + 0.45,
          c: STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0],
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

    // Einstein radius — the lensing scale, in px.
    const einstein = () => Math.max(46, Math.min(width, height) * 0.08);

    function holePos(t: number) {
      const cx = width * 0.5;
      const cy = height * 0.46;
      const ax = width * 0.32;
      const ay = height * 0.3;
      return {
        x: cx + Math.sin(t * 0.05) * ax + Math.sin(t * 0.012) * ax * 0.22,
        y: cy + Math.cos(t * 0.04) * ay + Math.sin(t * 0.019) * ay * 0.2,
      };
    }

    // Draw one lensed image of a star at radius `rad` from the hole, along unit
    // (ux,uy), brightened and tangentially stretched by its magnification.
    function drawImage(
      hx: number,
      hy: number,
      ux: number,
      uy: number,
      rad: number,
      s: Star,
      mu: number,
    ) {
      const alpha = Math.min(1, s.b * mu);
      if (alpha < 0.02) return;
      const px = hx + ux * rad;
      const py = hy + uy * rad;
      ctx!.globalAlpha = alpha;
      ctx!.fillStyle = s.c;

      const tang = s.r * Math.min(4, 0.6 + mu * 0.5); // stretch along the arc
      if (tang > s.r * 1.4) {
        ctx!.save();
        ctx!.translate(px, py);
        ctx!.rotate(Math.atan2(uy, ux) + Math.PI / 2);
        ctx!.beginPath();
        ctx!.ellipse(0, 0, s.r, tang, 0, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      } else {
        ctx!.beginPath();
        ctx!.arc(px, py, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, width, height);

      const { x: hx, y: hy } = holePos(t);
      const E = einstein();
      const shadowR = E * 0.75;

      for (const s of stars) {
        const dx = s.x - hx;
        const dy = s.y - hy;
        const beta = Math.hypot(dx, dy);
        if (beta < 0.001) continue;
        const ux = dx / beta;
        const uy = dy / beta;

        const u = beta / E; // dimensionless source offset
        const root = Math.sqrt(u * u + 4);
        const A = (u * u + 2) / (2 * u * root);

        // Primary image: outside the Einstein radius, same side as the star.
        const rp = 0.5 * (u + root) * E;
        drawImage(hx, hy, ux, uy, rp, s, A + 0.5);

        // Secondary image: inside the ring, opposite side, hidden if it falls
        // behind the shadow.
        const rm = 0.5 * (root - u) * E;
        if (rm >= shadowR) drawImage(hx, hy, -ux, -uy, rm, s, A - 0.5);
      }
      ctx!.globalAlpha = 1;

      // The hole's shadow: captured light, plain black with a soft edge.
      const edge = ctx!.createRadialGradient(hx, hy, shadowR - 1.5, hx, hy, shadowR + 1);
      edge.addColorStop(0, "#000000");
      edge.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = edge;
      ctx!.beginPath();
      ctx!.arc(hx, hy, shadowR + 1, 0, Math.PI * 2);
      ctx!.fill();
    }

    resize();

    if (reduceMotion) {
      draw(6);
      const onResizeStatic = () => {
        resize();
        draw(6);
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
