import { motion } from 'framer-motion';

const DemoPreview = () => {
  return (
    <section className="relative w-full py-32 bg-white flex flex-col items-center overflow-hidden">
      
      {/* Split Layout Header (003) */}
      <div className="relative w-full py-16 md:py-0 min-h-[50vh] md:h-[40vh] md:min-h-0 flex flex-col justify-center md:block gap-12">
        <div className="relative md:absolute md:top-1/2 md:left-12 w-full max-w-sm md:-translate-y-1/2 z-10 px-6 md:px-0 self-start text-left">
          <motion.h2 
            className="text-[18vw] sm:text-6xl md:text-7xl lg:text-[8rem] leading-none font-display font-bold text-black tracking-[-0.08em] md:absolute md:bottom-full mb-4 md:mb-5 md:left-0 break-words md:whitespace-nowrap"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            003
          </motion.h2>
          <motion.div 
            className="md:absolute md:top-full mt-4 md:mt-5 md:left-0 text-[10px] lg:text-xs font-bold text-black/80 max-w-[320px] uppercase tracking-widest leading-loose"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            INTERACTIVE PREVIEW<br/>
            LIVE FUZZY EXTRACTION<br/>
            REAL-TIME FEEDBACK
          </motion.div>
        </div>

        <div className="relative md:absolute md:top-1/2 md:right-12 w-full max-w-sm md:-translate-y-1/2 z-10 text-right self-end px-6 md:px-0 mt-8 md:mt-0">
          <motion.h2 
            className="text-[13vw] sm:text-6xl md:text-7xl lg:text-[8rem] leading-none font-display font-bold text-[#00FF4D] tracking-[-0.08em] md:absolute md:bottom-full mb-4 md:mb-5 md:right-0 break-words md:whitespace-nowrap max-w-full md:max-w-none"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            SIGNATURE
          </motion.h2>
          <motion.div 
            className="md:absolute md:top-full mt-4 md:mt-5 md:right-0 text-[10px] lg:text-xs font-bold text-black/80 max-w-[320px] uppercase tracking-widest leading-loose md:text-right inline-block"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            GENERATE YOUR UNIQUE SIGNAL<br/>
            ANALYZE REAL-TIME TELEMETRY<br/>
            VALIDATE THE BEHAVIOR
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DemoPreview;
