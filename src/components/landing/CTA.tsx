import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useVaultless } from '../../lib/VaultlessContext';

const CTA = () => {
  const navigate = useNavigate();
  const { setDemoMode, clearEnrollment, isEnrolled } = useVaultless();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const footerY = useTransform(scrollYProgress, [0.48, 0.88], [160, 0]);
  const footerOpacity = useTransform(scrollYProgress, [0.48, 0.72], [0, 1]);
  const footerPointerEvents = useTransform(scrollYProgress, (v) => v < 0.48 ? "none" : "auto");

  return (
    <section ref={sectionRef} className="relative w-full min-h-[125vh] bg-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,255,157,0.05),_transparent_50%)]"></div>

      <div className="sticky top-0 z-10 flex h-[62vh] min-h-[350px] flex-col items-center justify-center pt-24">
        <motion.div
          className="relative text-center max-w-3xl px-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-display text-5xl md:text-[6rem] leading-none font-bold tracking-[-0.08em] mb-8">
            STOP USING <br /> PASSWORDS
          </h2>

          <p className="mx-auto mb-12 max-w-2xl font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest leading-loose text-black/75">
            Experience the future of identity. The key is in your hands—literally.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-black px-10 py-4 font-mono text-xs font-bold uppercase tracking-widest text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition-all duration-300 hover:shadow-[0_22px_55px_rgba(0,0,0,0.28)]"
              onClick={() => {
                setDemoMode(true);
                navigate('/gmail');
              }}
            >
              TRY DEMO
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-[#00FF4D] px-10 py-4 font-mono text-xs font-bold uppercase tracking-widest text-black shadow-[0_18px_45px_rgba(0,255,77,0.24)] transition-all duration-300 hover:shadow-[0_22px_55px_rgba(0,255,77,0.36)]"
              onClick={() => {
                if (isEnrolled) {
                  navigate('/gmail');
                } else {
                  clearEnrollment();
                  setDemoMode(false);
                  navigate('/enroll');
                }
              }}
            >
              {isEnrolled ? "SIGN IN" : "SIGN UP"}
            </motion.button>
          </div>
        </motion.div>
      </div>

      <motion.footer
        className="absolute bottom-0 left-0 z-20 flex min-h-screen w-full flex-col justify-start overflow-hidden bg-[#f7f7f2] px-6 pt-24 pb-8 text-black md:px-12 md:pt-32"
        style={{ y: footerY, opacity: footerOpacity, pointerEvents: footerPointerEvents }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,255,77,0.18),_transparent_42%)]"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 md:gap-8 border-t border-black/10 pt-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-[#00FF4D]">
              Vaultless
            </p>
            <h2 className="mt-2 md:mt-4 max-w-2xl font-display text-4xl sm:text-5xl font-bold leading-tight tracking-[-0.08em] md:text-7xl">
              NO VAULT.<br />NO PASSWORD.<br />JUST YOU.
            </h2>
          </div>

          <div className="font-mono text-[10px] sm:text-xs font-bold uppercase leading-loose tracking-widest text-black/60 md:text-right">
            <p className="text-black">Access</p>
            <p>Behavioral signature</p>
            <p>Zero stored secrets</p>
            <p>Keys vanish after use</p>
            <p className="pt-2 md:pt-6 text-black/35">© 2026 VAULTLESS</p>
          </div>
        </div>
      </motion.footer>
    </section>
  );
};

export default CTA;
