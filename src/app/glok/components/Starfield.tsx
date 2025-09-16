'use client';

import { useEffect, useRef } from 'react';

interface StarfieldProps {
  active: boolean;
}

export default function Starfield({ active }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const fit = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const { clientWidth, clientHeight } = canvas.parentElement!;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      canvas.style.width = clientWidth + 'px';
      canvas.style.height = clientHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas.parentElement!);

    type Star = { x: number; y: number; r: number; vx: number; vy: number; a: number };
    const stars: Star[] = [];
    const makeStarsCount = () => {
      const area = (canvas.width * canvas.height) / (window.devicePixelRatio || 1);
      return Math.min(220, Math.max(80, Math.floor(area / 35000)));
    };

    const spawnStar = (edge?: 'left' | 'bottom') => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const speed = 0.15 + Math.random() * 0.35;
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const r = 0.5 + Math.random() * 1.5;
      const a = 0.3 + Math.random() * 0.7;

      if (edge === 'left') {
        stars.push({ x: -r, y: h + r, r, vx, vy, a });
      } else if (edge === 'bottom') {
        stars.push({ x: -r, y: h + r, r, vx, vy, a });
      } else {
        stars.push({ x: Math.random() * w, y: Math.random() * h, r, vx, vy, a });
      }
    };

    for (let i = 0; i < makeStarsCount(); i++) spawnStar();

    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.a *= 0.998;

        if (s.x > canvas.clientWidth + s.r || s.y < -s.r || s.a < 0.01) {
          stars.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = s.a;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (Math.random() < 0.02) spawnStar('left');
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}