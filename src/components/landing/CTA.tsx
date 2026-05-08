import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useVaultless } from '../../lib/VaultlessContext';

const CTA = () => {
  const navigate = useNavigate();
  const { setDemoMode } = useVaultless();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const footerY = useTransform(scrollYProgress, [0.48, 0.88], [160, 0]);
  const footerOpacity = useTransform(scrollYProgress, [0.48, 0.72], [0, 1]);

  return (
    <section ref={sectionRef} className="relative w-full min-h-[125vh] bg-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,255,157,0.05),_transparent_50%)]"></div>

      <div className="sticky top-0 z-10 flex h-[62vh] items-center justify-center">
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
                setDemoMode(false);
                navigate('/gmail');
              }}
            >
              SIGN UP
            </motion.button>
          </div>
        </motion.div>
      </div>

      <motion.footer
        className="absolute bottom-0 left-0 z-20 flex min-h-screen w-full flex-col justify-end overflow-hidden bg-[#f7f7f2] px-6 pb-[68vh] text-black md:px-12 md:pb-[66vh]"
        style={{ y: footerY, opacity: footerOpacity }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,255,77,0.18),_transparent_42%)]"></div>
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent"></div>

        <div className="relative z-10 grid gap-10 border-t border-black/10 pt-8 md:grid-cols-[1.2fr_1fr_1fr] md:gap-8">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-[#00FF4D]">
              Vaultless
            </p>
            <h2 className="mt-4 max-w-2xl font-display text-5xl font-bold leading-none tracking-[-0.08em] md:text-7xl">
              NO VAULT.<br />NO PASSWORD.<br />JUST YOU.
            </h2>
          </div>

          <div className="font-mono text-xs font-bold uppercase leading-loose tracking-widest text-black/60">
            <p className="text-black">Access</p>
            <p>Behavioral signature</p>
            <p>Zero stored secrets</p>
            <p>Keys vanish after use</p>
          </div>

          <div className="font-mono text-xs font-bold uppercase leading-loose tracking-widest text-black/60 md:text-right">
            <p>Demo sign up</p>
            <p>Security model</p>
            <p>Contact</p>
            <p className="pt-6 text-black/35">© 2026 VAULTLESS</p>
          </div>
        </div>
      </motion.footer>
    </section>
  );
};

export default CTA;
