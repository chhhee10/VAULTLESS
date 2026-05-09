import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';

const textLayout = [
  { text: "REDEFINING", top: "15%", left: "30%", speedX: 0.05, speedY: 0.02 },
  { text: "TRUE", top: "15%", left: "75%", speedX: -0.04, speedY: 0.03 },
  { text: "IDENTITY", top: "35%", left: "20%", speedX: 0.08, speedY: -0.02 },
  { text: "AND", top: "35%", left: "65%", speedX: -0.06, speedY: 0.04 },
  { text: "DIGITAL", top: "50%", left: "80%", speedX: 0.03, speedY: -0.05 },
  { text: "FREEDOM,", top: "65%", left: "25%", speedX: -0.07, speedY: 0.02 },
  { text: "WHERE", top: "65%", left: "55%", speedX: 0.05, speedY: -0.03 },
  { text: "SECURITY", top: "80%", left: "65%", speedX: -0.03, speedY: 0.06 },
  { text: "KNOWS", top: "90%", left: "20%", speedX: 0.06, speedY: -0.04 },
  { text: "NO", top: "90%", left: "80%", speedX: -0.05, speedY: 0.03 },
  { text: "BOUNDS.", top: "95%", left: "45%", speedX: 0.04, speedY: -0.02 },
];

interface ParallaxWordProps {
  text: string;
  top: string;
  left: string;
  speedX: number;
  speedY: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

const ParallaxWord: React.FC<ParallaxWordProps> = ({ text, top, left, speedX, speedY, mouseX, mouseY }) => {
  const x = useTransform(mouseX, (v) => v * 1500 * speedX);
  const y = useTransform(mouseY, (v) => v * 1500 * speedY);

  return (
    <motion.div
      className="absolute font-display text-5xl md:text-7xl lg:text-[8rem] leading-none tracking-tighter whitespace-nowrap text-black pointer-events-none"
      style={{
        top,
        left,
        x,
        y,
        translateX: "-50%",
        translateY: "-50%"
      }}
    >
      {text}
    </motion.div>
  );
};

const ParallaxSection = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1 range
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section className="relative w-full h-[120vh] bg-white overflow-hidden py-20 cursor-crosshair">
      <div className="absolute inset-0 w-full h-full">
        {textLayout.map((item, index) => (
          <ParallaxWord 
            key={index} 
            {...item} 
            mouseX={smoothMouseX} 
            mouseY={smoothMouseY} 
          />
        ))}
      </div>
    </section>
  );
};

export default ParallaxSection;
