/* 3D 倾斜卡片 — 鼠标悬停时根据指针位置做微妙的透视旋转 */
import { useRef, useState, type ReactNode, type MouseEvent } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
}

export default function TiltCard({ children, className = '', maxTilt = 6, scale = 1.02 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ transform: '', transition: 'transform 0.5s ease' });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;   /* -0.5 ~ 0.5 */
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const tiltX = -y * maxTilt;  /* 上下倾斜 */
    const tiltY = x * maxTilt;   /* 左右倾斜 */
    setStyle({
      transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale},${scale},${scale})`,
      transition: 'transform 0.15s ease-out',
    });
  };

  const handleLeave = () => {
    setStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
      transition: 'transform 0.5s ease',
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={style}
      className={className}
    >
      {children}
    </div>
  );
}
