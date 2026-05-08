import { motion } from 'framer-motion';

const DemoPreview = () => {
  return (
    <section className="relative w-full py-32 bg-white flex flex-col items-center overflow-hidden">
      
      {/* Split Layout Header (003) */}
      <div className="relative w-full h-[30vh] md:h-[40vh]">
        <div className="absolute top-1/2 left-4 md:left-12 w-full max-w-sm -translate-y-1/2 z-10">
          <motion.h2 
            className="text-6xl md:text-[8rem] leading-none font-display font-bold text-black tracking-[-0.08em] absolute bottom-full mb-3 md:mb-5 left-0 whitespace-nowrap"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            003
          </motion.h2>
          <motion.div 
            className="absolute top-full mt-3 md:mt-5 left-0 text-[10px] md:text-xs font-bold text-black/80 max-w-[320px] uppercase tracking-widest leading-loose"
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

        <div className="absolute top-1/2 right-4 md:right-12 w-full max-w-sm -translate-y-1/2 z-10 text-right">
          <motion.h2 
            className="text-6xl md:text-[8rem] leading-none font-display font-bold text-[#00FF4D] tracking-[-0.08em] absolute bottom-full mb-3 md:mb-5 right-0 whitespace-nowrap"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            SIGNATURE
          </motion.h2>
          <motion.div 
            className="absolute top-full mt-3 md:mt-5 right-0 text-[10px] md:text-xs font-bold text-black/80 max-w-[320px] uppercase tracking-widest leading-loose text-right"
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
