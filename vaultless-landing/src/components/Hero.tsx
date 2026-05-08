
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(0,255,157,0.05)] via-background to-background"></div>

      {/* Abstract Waveform Visual */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl opacity-30 flex items-center justify-center gap-2">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-accent rounded-full border-glow"
            initial={{ height: "10%" }}
            animate={{
              height: ["10%", "50%", "20%", "80%", "10%"],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center flex flex-col items-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.08em] mb-6 text-glow">
            YOU ARE<br />THE <span className="text-accent">KEY</span>
          </h1>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-2xl text-gray-400 font-light max-w-2xl font-mono tracking-wide"
        >
          Passwordless authentication using <span className="text-white font-medium">Gesture DNA</span>.
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-accent to-transparent"></div>
      </motion.div>
    </section>
  );
};

export default Hero;
