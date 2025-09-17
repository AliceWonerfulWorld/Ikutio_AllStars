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
      const speed = 4 + Math.random() * 6; // より速く、見えやすく
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.5; // より広い角度範囲
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // より広い範囲から開始して見えやすく
      const startX = -50 + Math.random() * w * 0.6; // 左から広範囲
      const startY = -50 + Math.random() * h * 0.6; // 上から広範囲
      
      const shootingStar: ShootingStar = {
        x: startX,
        y: startY,
        vx,
        vy,
        length: 20 + Math.random() * 30, // より長い尻尾
        brightness: 0.9 + Math.random() * 0.1, // より明るく
        life: 0,
        maxLife: 80 + Math.random() * 60, // より長い生存時間
      };
      
      shootingStars.push(shootingStar);
      console.log(`✨ 流れ星を生成しました! 位置: (${Math.round(startX)}, ${Math.round(startY)}), 速度: (${Math.round(vx)}, ${Math.round(vy)})`);
    };

    // 手動で複数の流れ星を生成する関数（Sキー用）
    const spawnMultipleShootingStars = () => {
      console.log('🌠 Sキーが押されました！複数の流れ星を生成します...');
      const count = 4 + Math.floor(Math.random() * 3); // 4-6個の流れ星
      for (let i = 0; i < count; i++) {
        // 少し時間差を付けて生成
        setTimeout(() => {
          spawnShootingStar();
        }, i * 150); // 150ms間隔でより早く
      }
    };

    // キーボードイベントリスナー
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('キーが押されました:', event.key);
      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        spawnMultipleShootingStars();
      }
    };

    // キーイベントリスナー（複数の方法で追加）
    document.addEventListener('keydown', handleKeyDown, true); // capture phase
    window.addEventListener('keydown', handleKeyDown, true);

    console.log('🎮 キーボードイベントリスナーが設定されました。Sキーを押してください！');

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
        if (ss.life > ss.maxLife || ss.x > canvas.clientWidth + 100 || ss.y > canvas.clientHeight + 100) {
          shootingStars.splice(i, 1);
          continue;
        }

        // 流れ星の透明度計算（フェードイン・フェードアウト）
        let alpha = ss.brightness;
        if (ss.life < 15) {
          alpha *= ss.life / 15; // フェードイン
        } else if (ss.life > ss.maxLife - 30) {
          alpha *= (ss.maxLife - ss.life) / 30; // フェードアウト
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        // 流れ星の尻尾を描画（グラデーション）
        const gradient = ctx.createLinearGradient(
          ss.x, ss.y,
          ss.x - ss.vx * ss.length / 3, ss.y - ss.vy * ss.length / 3
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.2, '#e0e7ff');
        gradient.addColorStop(0.6, '#a5b4fc');
        gradient.addColorStop(1, 'transparent');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3; // より太く
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx * ss.length / 3, ss.y - ss.vy * ss.length / 3);
        ctx.stroke();

        // 流れ星の頭部（明るい点）
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 12; // より大きな光
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2); // より大きく
        ctx.fill();

        ctx.restore();
      }

      // 通常の星を追加
      if (Math.random() < 0.02) spawnStar('left');

      // 流れ星をランダムに追加（低確率）
      if (Math.random() < 0.002) { // 少し確率を下げる
        spawnShootingStar();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // キーボードイベントリスナーを削除
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      ro.disconnect();
      console.log('🎮 キーボードイベントリスナーが削除されました');
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