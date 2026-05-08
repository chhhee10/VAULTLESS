import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useVaultless } from '../../lib/VaultlessContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { setDemoMode, clearEnrollment } = useVaultless();
  const { scrollYProgress } = useScroll();

  // We animate the center text when the scroll is in the last 15% of the page
  const y = useTransform(scrollYProgress, [0.94, 1], ["0vh", "90vh"]);
  
  // Scale the text up significantly (adjust this if it's too big on small screens, 
  // but using a large multiplier gives the 'very large text' effect)
  const scale = useTransform(scrollYProgress, [0.94, 1], [1, 14]);

  // Optionally change origin or opacity if needed, but the scale and y should do the trick
  
  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6 pointer-events-none">
        <div className="flex-1 pointer-events-auto flex items-center gap-6 text-xs font-mono font-bold tracking-widest text-black">
          <button 
            className="transition-colors cursor-pointer hover:opacity-70"
            onClick={() => {
              setDemoMode(true);
              navigate('/gmail');
            }}
          >
            DEMO
          </button>
          <button 
            className="transition-colors cursor-pointer hover:opacity-70"
            onClick={() => {
              clearEnrollment();
              setDemoMode(false);
              navigate('/enroll');
            }}
          >
            SIGN UP
          </button>
        </div>

        {/* Center Placeholder to keep flex-1 balance */}
        <div className="flex-1"></div>

        {/* Right */}
        <div className="flex-1 flex justify-end pointer-events-auto text-xs font-mono font-bold tracking-widest text-black transition-colors cursor-pointer hover:opacity-70">
          ABOUT
        </div>
      </nav>

      {/* Center Animated Logo */}
      <motion.div 
        className="fixed top-6 left-1/2 z-50 text-black font-bold tracking-[0.2em] pointer-events-auto cursor-pointer origin-bottom [text-shadow:0_0_3px_rgba(255,255,255,1),0_0_14px_rgba(255,255,255,1),0_0_26px_rgba(255,255,255,0.95),0_0_38px_rgba(255,255,255,0.8)]"
        style={{ 
          x: "-50%",
          y,
          scale,
        }}
      >
        VAULTLESS
      </motion.div>
    </>
  );
};

export default Navbar;
