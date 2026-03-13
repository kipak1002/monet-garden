
import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';

const CustomCursor: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      const isClickable = 
        target.closest('button') || 
        target.closest('a') || 
        target.closest('.cursor-pointer') ||
        target.closest('[role="button"]') ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A';

      if (isClickable) {
        setIsHovering(true);
        // Show "VIEW" for gallery items or specific interactive areas
        const isGalleryItem = target.closest('.group') || target.closest('.cursor-pointer');
        if (isGalleryItem) {
            setCursorText('VIEW');
        } else {
            setCursorText('');
        }
      } else {
        setIsHovering(false);
        setCursorText('');
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [mouseX, mouseY, isVisible]);

  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center mix-blend-difference"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <motion.div
        animate={{
          width: isHovering ? 60 : 12,
          height: isHovering ? 60 : 12,
          backgroundColor: '#ffffff',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="rounded-full flex items-center justify-center overflow-hidden"
      >
        {isHovering && cursorText && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-bold text-black tracking-widest"
          >
            {cursorText}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CustomCursor;
