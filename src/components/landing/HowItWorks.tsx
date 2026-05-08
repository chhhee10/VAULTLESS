import { motion } from 'framer-motion';

const steps = [
  { id: '01', title: 'TYPE', desc: 'Enter your unique passphrase normally.' },
  { id: '02', title: 'EXTRACT', desc: 'Flight and dwell times are analyzed.' },
  { id: '03', title: 'GENERATE', desc: 'A deterministic key is formed.' },
  { id: '04', title: 'UNLOCK', desc: 'Instant access granted without databases.' }
];

const HowItWorks = () => {
  return (
    <section className="relative w-full h-[40vh] md:h-[50vh] bg-white overflow-hidden font-sans">
      
      {/* Background Giant Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <motion.div 
          className="text-[12vw] leading-none font-display font-bold text-black/[0.03] tracking-[-0.04em] whitespace-nowrap"
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          HOW IT WORKS
        </motion.div>
      </div>







      {/* Desktop Timeline Layout */}
      <div className="hidden md:grid absolute top-1/2 left-0 w-full px-8 lg:px-16 grid-cols-4 gap-8 -translate-y-1/2 z-10">
        {steps.map((step, index) => (
          <motion.div 
            key={step.id} 
            className="relative w-full"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
          >
            {/* Title sitting ON the line */}
            <h3 className="absolute bottom-full mb-12 lg:mb-16 text-4xl lg:text-[4rem] leading-none font-display font-bold tracking-[-0.08em] text-black whitespace-nowrap origin-bottom-left">
              {step.title}
            </h3>
            {/* Description hanging BELOW the line */}
            <p className="absolute top-full mt-12 lg:mt-16 text-[10px] lg:text-xs font-bold text-black/80 uppercase tracking-widest leading-loose max-w-[200px]">
              {step.id} — <br/>
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Mobile Layout Fallback */}
      <div className="md:hidden relative z-10 flex flex-col justify-center h-full px-8 space-y-16">
        {steps.map((step, index) => (
          <motion.div 
            key={step.id} 
            className="relative border-l border-black/20 pl-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="absolute top-0 -left-[5px] w-[9px] h-[9px] bg-white border border-black rounded-full"></div>
            <h3 className="text-4xl font-display font-bold tracking-[-0.08em] text-black mb-2 leading-none">
              {step.title}
            </h3>
            <p className="text-xs font-bold text-black/80 uppercase tracking-widest leading-loose">
              {step.id} — {step.desc}
            </p>
          </motion.div>
        ))}
      </div>

    </section>
  );
};

export default HowItWorks;
