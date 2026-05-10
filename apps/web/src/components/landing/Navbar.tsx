import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useVaultless } from '../../lib/VaultlessContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { setDemoMode, clearEnrollment, isRealEnrolled } = useVaultless() as any;
  const { scrollYProgress } = useScroll();

  const [windowSize, setWindowSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1200, height: typeof window !== 'undefined' ? window.innerHeight : 800 });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On mobile, we reduce tracking so the text can scale up much larger vertically without overflowing horizontally
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  
  // Calculate max scale dynamically to fit the screen
  // If mobile, unscaled text width is ~80px (normal tracking). If desktop, ~130px (0.2em tracking).
  const maxScale = isMobile ? (windowSize.width / 95) : Math.min(windowSize.width / 140, 12);
  // We animate the center text when the scroll is in the last 15% of the page
  const targetY = isMobile ? "92dvh" : "96vh";
  const y = useTransform(scrollYProgress, [0.94, 1], ["0vh", targetY]);
  
  // Scale the text up significantly
  const scale = useTransform(scrollYProgress, [0.94, 1], [1, maxScale]);

  // Animate the text from the left edge (32px padding) to the exact center
  const startLeft = `${(32 / windowSize.width) * 100}%`;
  const left = useTransform(scrollYProgress, [0.94, 1], [startLeft, "50%"]);
  const x = useTransform(scrollYProgress, [0.94, 1], ["0%", "-50%"]);

  return (
    <>
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-end px-8 py-6 pointer-events-none">
        <div className="flex items-center gap-6 text-xs font-mono font-bold tracking-widest text-black pointer-events-auto">
          <button 
            className="transition-colors cursor-pointer hover:opacity-70"
            onClick={() => {
              setDemoMode(true);
              navigate('/access');
            }}
          >
            DEMO
          </button>
          <button 
            className="transition-colors cursor-pointer hover:opacity-70"
            onClick={() => {
              if (isRealEnrolled) {
                setDemoMode(false);
                navigate('/access');
              } else {
                setDemoMode(false);
                clearEnrollment();
                navigate('/enroll');
              }
            }}
          >
            {isRealEnrolled ? "SIGN IN" : "SIGN UP"}
          </button>
        </div>
      </nav>

      {/* Animated Logo: Starts left, slides to center */}
      <motion.div 
        className="fixed top-6 z-50 text-black font-bold tracking-normal md:tracking-[0.2em] pointer-events-auto cursor-pointer"
        style={{ 
          left,
          x,
          y,
          scale,
          transformOrigin: "bottom center"
        }}
      >
        VAULTLESS
      </motion.div>
    </>
  );
};

export default Navbar;
