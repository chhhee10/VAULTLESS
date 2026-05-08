import { motion } from 'framer-motion';

const Concept = () => {
  return (
    <section className="relative w-full h-[40vh] md:h-[50vh] bg-white overflow-hidden font-sans">
      






      {/* Left Content Container */}
      <div className="absolute top-1/2 left-4 md:left-12 w-full max-w-sm -translate-y-1/2 z-10">
        
        {/* Large Text sitting on top of the line */}
        <motion.h2 
          className="text-6xl md:text-[8rem] leading-none font-display font-bold text-black tracking-[-0.08em] absolute bottom-full mb-3 md:mb-5 left-0 whitespace-nowrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          001
        </motion.h2>
        
        {/* Small text hanging below the line */}
        <motion.div 
          className="absolute top-full mt-3 md:mt-5 left-0 text-[10px] md:text-xs font-bold text-black/80 max-w-[280px] uppercase tracking-widest leading-loose"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          WE<br/>
          REIMAGINE SECURITY<br/>
          YOUR PASSWORDS CAN BE STOLEN<br/>
          BUT YOUR BEHAVIOR IS ENTIRELY UNIQUE TO YOU
        </motion.div>
      </div>

      {/* Right Content Container */}
      <div className="absolute top-1/2 right-4 md:right-12 w-full max-w-sm -translate-y-1/2 z-10 text-right">
        
        {/* Large Text sitting on top of the line */}
        <motion.h2 
          className="text-6xl md:text-[8rem] leading-none font-display font-bold text-[#00FF4D] tracking-[-0.08em] absolute bottom-full mb-3 md:mb-5 right-0 whitespace-nowrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          IDENTITY
        </motion.h2>
        
        {/* Small text hanging below the line */}
        <motion.div 
          className="absolute top-full mt-3 md:mt-5 right-0 text-[10px] md:text-xs font-bold text-black/80 max-w-[280px] uppercase tracking-widest leading-loose text-right"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          NOT WHAT YOU TYPE<br/>
          BUT HOW YOU TYPE IT<br/>
          WE EXTRACT GESTURE DNA IN REAL-TIME<br/>
          TO GENERATE A CRYPTOGRAPHIC KEY
        </motion.div>
      </div>

    </section>
  );
};

export default Concept;
