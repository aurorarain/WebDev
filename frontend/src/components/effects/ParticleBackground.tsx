/* 粒子背景效果组件 — 使用 tsParticles 绘制科技感连线粒子 */
import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

export default function ParticleBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) return null;

  return (
    <Particles
      id="tsparticles"
      className="absolute inset-0"
      options={{
        fullScreen: false,
        background: { color: { value: 'transparent' } },
        fpsLimit: 60,
        particles: {
          color: { value: '#6366f1' },
          move: { enable: true, speed: 0.5, direction: 'none' as const, outModes: 'out' as const },
          number: { value: 50, density: { enable: true } },
          opacity: { value: { min: 0.12, max: 0.45 } },
          shape: { type: 'circle' as const },
          size: { value: { min: 1.5, max: 3 } },
          links: {
            enable: true,
            distance: 150,
            color: '#6366f1',
            opacity: 0.18,
            width: 1,
          },
        },
        detectRetina: true,
      }}
    />
  );
}
