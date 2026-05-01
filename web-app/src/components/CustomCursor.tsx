import { useEffect, useState } from 'react';

export const CustomCursor = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    const handleDown = () => setClicked(true);
    const handleUp = () => setClicked(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  return (
    <>
      <div 
        className="cursor-dot" 
        style={{ 
          left: `${pos.x}px`, 
          top: `${pos.y}px`,
          transform: `translate(-50%, -50%) scale(${clicked ? 0.8 : 1})`
        }} 
      />
      <div 
        className="cursor-ring" 
        style={{ 
          left: `${pos.x}px`, 
          top: `${pos.y}px`,
          width: clicked ? '48px' : '36px',
          height: clicked ? '48px' : '36px',
          opacity: clicked ? 0.8 : 1,
          transform: `translate(-50%, -50%)`
        }} 
      />
    </>
  );
};
