/* 回到顶部浮动按钮 — 滚动一屏后出现，点击丝滑回顶 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-11 h-11 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-lg border border-white/60 shadow-lg hover:shadow-xl hover:bg-white/90 hover:-translate-y-0.5 transition-all duration-300 group"
          aria-label="回到顶部"
        >
          <ArrowUp size={18} className="text-sw-muted group-hover:text-sw-accent transition-colors" />
          {/* 外圈渐变光晕 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sw-accent/10 to-sw-accent-2/10 pointer-events-none" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
