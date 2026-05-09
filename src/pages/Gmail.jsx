import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVaultless } from '../lib/VaultlessContext';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MeshTransmissionMaterial } from '@react-three/drei';
import { useMotionValue, useSpring } from 'framer-motion';
import * as THREE from 'three';
import BinaryGlitchBackground from '../components/BinaryGlitchBackground';

const InteractiveHexagon = ({ mouseX, mouseY }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;

    // Base rotation for the torus is 0,0,0 to face the camera.
    // Then we add the mouse offset to make it "look" at the cursor.
    // Adding a slight Z rotation so the hexagon point is at the top.
    const targetX = (mouseY.get() * Math.PI) / 4;
    const targetY = (mouseX.get() * Math.PI) / 4;

    // Smoothly interpolate current rotation to the target
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetX, 0.1);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetY, 0.1);
    meshRef.current.rotation.z = Math.PI / 3; // 60 degrees rotation

    // Add a slight idle breathing animation
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.15;
  });

  return (
    <mesh ref={meshRef} scale={0.7}>
      <torusGeometry args={[1.5, 0.4, 64, 6]} />
      <meshPhysicalMaterial
        color="#00FF4D"
        metalness={0.1}
        roughness={0.05}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
};


export default function WalletAccess() {
  const navigate = useNavigate();
  const { isEnrolled, demoMode } = useVaultless();

  // Mouse tracking for the 3D hexagon
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
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
    <div className="min-h-screen bg-[#f7f7f2] font-sans flex flex-col relative overflow-hidden text-black selection:bg-[#00FF4D] selection:text-black">
      <BinaryGlitchBackground />

      {/* Header */}
      <header className="p-8 md:px-12 flex items-center justify-between z-10 relative">
        <button
          onClick={() => navigate('/')}
          className="text-xs font-mono font-bold tracking-widest hover:opacity-70 transition-opacity"
        >
          ← VAULTLESS
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative pb-32">

        {/* Wallet Card */}
        <div className="w-full max-w-sm bg-[#0a0a0a] border-2 border-black rounded-3xl p-8 shadow-2xl relative">

          {/* Floating 3D Fox/Hexagon */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 10]} intensity={1.5} />
              <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#00FF4D" />
              <InteractiveHexagon mouseX={smoothMouseX} mouseY={smoothMouseY} />
              <Environment preset="city" />
            </Canvas>
          </div>

          <div className="mt-20 text-center text-white">
            <h1 className="font-display text-4xl font-bold tracking-[1px] uppercase mb-3 whitespace-nowrap">Access Wallet</h1>
            <p className="text-white/80 text-sm font-mono mb-8 leading-relaxed">
              {demoMode
                ? 'Demo mode active. Biometrics will not touch the chain.'
                : 'Authenticate with your behavioral signature.'}
            </p>

            {demoMode && (
              <div className="inline-block bg-[#00FF4D]/10 border border-[#00FF4D]/25 text-[#00FF4D] text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-6">
                Demo Mode
              </div>
            )}

            <div className="space-y-4">
              {isEnrolled ? (
                <>
                  <button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-[#00FF4D] hover:bg-[#00FF4D]/90 text-black font-mono text-sm font-bold uppercase tracking-widest py-4 rounded-full transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,255,77,0.3)]"
                  >
                    Authenticate →
                  </button>
                  <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Type your phrase to unlock</p>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/enroll')}
                    className="w-full bg-[#00FF4D] hover:bg-[#00FF4D]/90 text-black font-mono text-sm font-bold uppercase tracking-widest py-4 rounded-full transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,255,77,0.3)]"
                  >
                    Enroll Identity →
                  </button>
                  <p className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Setup your signature first</p>
                </>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/20 flex justify-center gap-3">
              <span className="bg-white/10 border border-white/20 text-white/80 text-[9px] font-mono uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">Zero-Knowledge</span>
              <span className="bg-white/10 border border-white/20 text-white/80 text-[9px] font-mono uppercase tracking-[0.2em] px-3 py-1.5 rounded-full">On-Chain</span>
            </div>
          </div>
        </div>

        <p className="mt-12 text-black/50 text-[10px] font-mono uppercase tracking-widest font-bold z-10">
          Your key is derived from <span className="text-[#00FF4D] bg-black border border-[#00FF4D]/30 px-2 py-0.5 ml-1 rounded-sm">how you type</span>
        </p>
      </main>
    </div>
  );
}