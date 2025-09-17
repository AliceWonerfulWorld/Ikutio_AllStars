'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface StarfieldProps {
  active: boolean;
}

export interface StarfieldRef {
  triggerShootingStars: () => void;
}

const Starfield = forwardRef<StarfieldRef, StarfieldProps>(({ active }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const shootingStarsRef = useRef<any[]>([]);
  const spawnShootingStarRef = useRef<(() => void) | null>(null);

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

    // 通常の星の定義
    type Star = { x: number; y: number; r: number; vx: number; vy: number; a: number };
    const stars: Star[] = [];

    // 流れ星の定義
    type ShootingStar = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      brightness: number;
      life: number;
      maxLife: number;
    };
    const shootingStars: ShootingStar[] = [];
    shootingStarsRef.current = shootingStars;

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

    // 流れ星を生成する関数
    const spawnShootingStar = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const speed = 6 + Math.random() * 8;
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.6;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      const startX = -100 + Math.random() * w * 0.8;
      const startY = -100 + Math.random() * h * 0.8;
      
      const shootingStar: ShootingStar = {
        x: startX,
        y: startY,
        vx,
        vy,
        length: 30 + Math.random() * 40,
        brightness: 1.0,
        life: 0,
        maxLife: 120 + Math.random() * 80,
      };
      
      shootingStars.push(shootingStar);
    };

    // refに関数を保存
    spawnShootingStarRef.current = spawnShootingStar;

    // 初期の星を生成
    for (let i = 0; i < makeStarsCount(); i++) spawnStar();

    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 通常の星を描画
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

      // 流れ星を描画
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life++;

        // 生存時間チェック
        if (ss.life > ss.maxLife || ss.x > canvas.clientWidth + 150 || ss.y > canvas.clientHeight + 150) {
          shootingStars.splice(i, 1);
          continue;
        }

        // 流れ星の透明度計算
        let alpha = ss.brightness;
        if (ss.life < 20) {
          alpha *= ss.life / 20;
        } else if (ss.life > ss.maxLife - 40) {
          alpha *= (ss.maxLife - ss.life) / 40;
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        // 流れ星の尻尾を描画
        const gradient = ctx.createLinearGradient(
          ss.x, ss.y,
          ss.x - ss.vx * ss.length / 2, ss.y - ss.vy * ss.length / 2
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#e0e7ff');
        gradient.addColorStop(0.7, '#a5b4fc');
        gradient.addColorStop(1, 'transparent');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx * ss.length / 2, ss.y - ss.vy * ss.length / 2);
        ctx.stroke();

        // 流れ星の頭部
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 通常の星を追加
      if (Math.random() < 0.02) spawnStar('left');

      // 流れ星をランダムに追加
      if (Math.random() < 0.001) {
        spawnShootingStar();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active]);

  // 外部から呼び出し可能なメソッドを公開
  useImperativeHandle(ref, () => ({
    triggerShootingStars: () => {
      if (spawnShootingStarRef.current) {
        const count = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            if (spawnShootingStarRef.current) {
              spawnShootingStarRef.current();
            }
          }, i * 100);
        }
      }
    }
  }));

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
});

Starfield.displayName = 'Starfield';

export default Starfield;