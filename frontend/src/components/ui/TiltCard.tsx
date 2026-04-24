/* 3D 倾斜卡片 — 鼠标悬停时根据指针位置做微妙的透视旋转（ref + RAF 优化） */
import { useRef, useCallback, type ReactNode, type MouseEvent } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
}

export default function TiltCard({ children, className = '', maxTilt = 6, scale = 1.02 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);

  const handleMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    cancelAnimationFrame(rafId.current);
    const el = ref.current;
    rafId.current = requestAnimationFrame(() => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg) scale3d(${scale},${scale},${scale})`;
      el.style.transition = 'transform 0.15s ease-out';
    });
  }, [maxTilt, scale]);

  const handleLeave = useCallback(() => {
    if (!ref.current) return;
    cancelAnimationFrame(rafId.current);
    ref.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    ref.current.style.transition = 'transform 0.5s ease';
  }, []);

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} className={className}>
      {children}
    </div>
  );
}
