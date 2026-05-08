import { motion } from 'framer-motion';

const Security = () => {
  return (
    <section className="relative w-full py-16 md:py-0 min-h-[70vh] md:h-[50vh] md:min-h-0 bg-white overflow-hidden font-sans flex flex-col justify-center md:block gap-12">
      
      {/* Left Content Container */}
      <div className="relative md:absolute md:top-1/2 md:left-12 w-full max-w-sm md:-translate-y-1/2 z-10 px-6 md:px-0 self-start text-left">
        
        {/* Large Text sitting on top of the invisible line */}
        <motion.h2 
          className="text-[18vw] sm:text-6xl md:text-7xl lg:text-[8rem] leading-none font-display font-bold text-black tracking-[-0.08em] md:absolute md:bottom-full mb-4 md:mb-5 md:left-0 break-words md:whitespace-nowrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          002
        </motion.h2>
        
        {/* Small text hanging below the invisible line */}
        <motion.div 
          className="md:absolute md:top-full mt-4 md:mt-5 md:left-0 text-[10px] lg:text-xs font-bold text-black/80 max-w-[320px] uppercase tracking-widest leading-loose"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          ZERO KNOWLEDGE ARCHITECTURE<br/>
          NO STORED PASSWORDS<br/>
          NO CENTRAL DATABASE TO HACK<br/>
          CREDENTIALS DON'T EXIST UNTIL YOU TYPE
        </motion.div>
      </div>

      {/* Right Content Container */}
      <div className="relative md:absolute md:top-1/2 md:right-12 w-full max-w-sm md:-translate-y-1/2 z-10 text-right self-end px-6 md:px-0 mt-8 md:mt-0">
        
        {/* Large Text sitting on top of the invisible line */}
        <motion.h2 
          className="text-[13vw] sm:text-6xl md:text-7xl lg:text-[8rem] leading-none font-display font-bold text-[#00FF4D] tracking-[-0.08em] md:absolute md:bottom-full mb-4 md:mb-5 md:right-0 break-words md:whitespace-nowrap max-w-full md:max-w-none"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          SECURE
        </motion.h2>
        
        {/* Small text hanging below the invisible line */}
        <motion.div 
          className="md:absolute md:top-full mt-4 md:mt-5 md:right-0 text-[10px] lg:text-xs font-bold text-black/80 max-w-[320px] uppercase tracking-widest leading-loose md:text-right inline-block"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          REAL-TIME KEY GENERATION<br/>
          KEYS ARE CREATED ON THE FLY<br/>
          AND INSTANTLY DESTROYED AFTER<br/>
          FUZZY EXTRACTION REJECTS IMPERSONATORS
        </motion.div>
      </div>

    </section>
  );
};

export default Security;
