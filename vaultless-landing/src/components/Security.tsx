import { motion } from 'framer-motion';

const Security = () => {
  return (
    <section className="relative w-full h-[40vh] md:h-[50vh] bg-white overflow-hidden font-sans">
      


      {/* Left Content Container */}
      <div className="absolute top-1/2 left-4 md:left-12 w-full max-w-sm -translate-y-1/2 z-10">
        
        {/* Large Text sitting on top of the invisible line */}
        <motion.h2 
          className="text-6xl md:text-[8rem] leading-none font-display font-bold text-black tracking-[-0.08em] absolute bottom-full mb-3 md:mb-5 left-0 whitespace-nowrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          002
        </motion.h2>
        
        {/* Small text hanging below the invisible line */}
        <motion.div 
          className="absolute top-full mt-3 md:mt-5 left-0 text-[10px] md:text-xs font-bold text-black/80 max-w-[320px] uppercase tracking-widest leading-loose"
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
      <div className="absolute top-1/2 right-4 md:right-12 w-full max-w-sm -translate-y-1/2 z-10 text-right">
        
        {/* Large Text sitting on top of the invisible line */}
        <motion.h2 
          className="text-6xl md:text-[8rem] leading-none font-display font-bold text-[#00FF4D] tracking-[-0.08em] absolute bottom-full mb-3 md:mb-5 right-0 whitespace-nowrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          UNHACKABLE
        </motion.h2>
        
        {/* Small text hanging below the invisible line */}
        <motion.div 
          className="absolute top-full mt-3 md:mt-5 right-0 text-[10px] md:text-xs font-bold text-black/80 max-w-[320px] uppercase tracking-widest leading-loose text-right"
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
