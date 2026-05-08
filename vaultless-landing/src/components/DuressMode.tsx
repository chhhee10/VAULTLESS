import { motion } from 'framer-motion';

const DuressMode = () => {
  
  return (
    <section className="relative w-full py-32 bg-white overflow-hidden">

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="inline-block px-3 py-1 mb-6 text-xs font-mono font-bold text-red-600 border border-red-600/30 rounded bg-red-600/10">CRITICAL FEATURE</div>
          <h2 className="text-5xl md:text-[6rem] leading-none font-display font-bold mb-6 text-black tracking-[-0.08em]">FORCED ACCESS IS<br/><span className="text-red-600">STILL SAFE</span></h2>
          <p className="mx-auto max-w-2xl font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest leading-loose text-black/75">
            Under stress, your typing pattern naturally changes. Vaultless detects this anxiety-induced variance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16" style={{ perspective: '1200px' }}>
          {/* Real User State */}
          <motion.div 
            className="group relative h-64 rounded-[2rem] bg-gradient-to-br from-white/10 via-transparent to-black/5 backdrop-blur-md backdrop-saturate-[1.5] backdrop-contrast-125 border border-white/20 shadow-[inset_2px_2px_3px_rgba(255,255,255,0.4),inset_-2px_-2px_3px_rgba(0,0,0,0.1),inset_10px_10px_20px_rgba(255,255,255,0.2),inset_-10px_-10px_20px_rgba(0,0,0,0.05),15px_15px_30px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
            initial={{ opacity: 0, rotateY: 15, rotateX: 5, z: -50 }}
            whileInView={{ opacity: 1, rotateY: 15, rotateX: 5, z: 0 }}
            whileHover={{ scale: 1.05, rotateY: 5, rotateX: 0, z: 30, boxShadow: "inset 2px 2px 3px rgba(255,255,255,0.6), inset -2px -2px 3px rgba(0,0,0,0.2), inset 15px 15px 30px rgba(255,255,255,0.3), inset -15px -15px 30px rgba(0,0,0,0.1), 25px 25px 50px rgba(0,0,0,0.15)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            viewport={{ once: true }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="flex justify-between items-center p-4 border-b border-black/5 bg-white/20">
              <h3 className="font-mono text-xs font-bold text-black/60 tracking-widest uppercase">Calm State</h3>
              <div className="w-2 h-2 rounded-full bg-[#00FF4D] shadow-[0_0_10px_#00FF4D]"></div>
            </div>
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
              <motion.div 
                className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00FF4D]/50 to-transparent shadow-[0_0_15px_#00FF4D]"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
              <span className="text-3xl md:text-4xl font-display font-bold text-black/80 tracking-widest z-10 relative">
                REAL VAULT
              </span>
            </div>
          </motion.div>

          {/* Under Stress State */}
          <motion.div 
            className="group relative h-64 rounded-[2rem] bg-gradient-to-br from-white/10 via-transparent to-red-500/5 backdrop-blur-md backdrop-saturate-[1.5] backdrop-contrast-125 border border-white/20 shadow-[inset_2px_2px_3px_rgba(255,255,255,0.4),inset_-2px_-2px_3px_rgba(220,38,38,0.2),inset_10px_10px_20px_rgba(255,255,255,0.2),inset_-10px_-10px_20px_rgba(220,38,38,0.1),-15px_15px_30px_rgba(220,38,38,0.1)] flex flex-col overflow-hidden"
            initial={{ opacity: 0, rotateY: -15, rotateX: 5, z: -50 }}
            whileInView={{ opacity: 1, rotateY: -15, rotateX: 5, z: 0 }}
            whileHover={{ scale: 1.05, rotateY: -5, rotateX: 0, z: 30, boxShadow: "inset 2px 2px 3px rgba(255,255,255,0.6), inset -2px -2px 3px rgba(220,38,38,0.3), inset 15px 15px 30px rgba(255,255,255,0.3), inset -15px -15px 30px rgba(220,38,38,0.15), -25px 25px 50px rgba(220,38,38,0.15)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            viewport={{ once: true }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="flex justify-between items-center p-4 border-b border-red-500/10 bg-white/20">
              <h3 className="font-mono text-xs font-bold text-red-600/80 tracking-widest uppercase">Duress Detected</h3>
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_#ff0000]"></div>
            </div>
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
               {/* Glitch Overlay effect */}
               <motion.div 
                 className="absolute inset-0 bg-red-600/[0.03] mix-blend-multiply"
                 animate={{ opacity: [0, 0.5, 0, 1, 0] }}
                 transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }}
               />
               <motion.div 
                 className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(255,0,0,0.03)_2px,rgba(255,0,0,0.03)_4px)]"
               />
               <motion.span 
                 className="text-3xl md:text-4xl font-display font-bold text-red-600/80 tracking-widest relative z-10"
                 animate={{ x: [-1, 1, -2, 2, 0], opacity: [1, 0.8, 1, 0.6, 1] }}
                 transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 2.5 }}
               >
                 GHOST VAULT
               </motion.span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DuressMode;
