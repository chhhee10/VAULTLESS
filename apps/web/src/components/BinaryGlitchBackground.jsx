import { useRef, useEffect } from 'react';

const BinaryGlitchBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    let columns, rows;
    const fontSize = 16;

    // Mouse tracking
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      width = window.innerWidth;
      // Use the parent's full scrollable height so the bg covers everything even when zoomed
      const parent = canvas.parentElement;
      height = parent ? Math.max(parent.scrollHeight, window.innerHeight) : window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      columns = Math.ceil(width / fontSize);
      rows = Math.ceil(height / fontSize);
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Store grid state
    const grid = [];
    const maxCells = 20000;
    for (let i = 0; i < maxCells; i++) {
      grid.push(Math.random() > 0.5 ? '0' : '1');
    }

    let animationFrameId;

    const draw = () => {
      // Clear background
      ctx.fillStyle = '#f7f7f2'; // White background
      ctx.fillRect(0, 0, width, height);

      ctx.font = `bold ${fontSize - 2}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const idx = y * columns + x;
          const px = x * fontSize + fontSize / 2;
          const py = y * fontSize + fontSize / 2;

          const dx = px - mouse.x;
          const dy = py - mouse.y;
          // Use a blocky/jagged distance (Chebyshev + noise) instead of a perfect circle
          const dist = Math.max(Math.abs(dx), Math.abs(dy)) + (Math.random() * 40);

          let char = grid[idx] || '0';
          let color = 'rgba(0, 0, 0, 0.15)'; // Significantly darker text for better visibility

          // Glitch effect near mouse
          if (dist < 120) {
            // Randomly flip 0 and 1
            if (Math.random() > 0.7) {
              char = Math.random() > 0.5 ? '0' : '1';
              if (idx < maxCells) grid[idx] = char;
            }
            // Intensity based on distance
            const intensity = Math.max(0, 1 - dist / 120);
            // Slightly darker green for contrast on white
            ctx.fillStyle = `rgba(0, 200, 60, ${intensity})`;
          } else {
            ctx.fillStyle = color;
          }

          ctx.fillText(char, px, py);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-80" />;
};

export default BinaryGlitchBackground;
