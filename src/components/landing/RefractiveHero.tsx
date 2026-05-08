import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, Text, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

// A moving, glassy refractive object
const GlassShape = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      // Smooth floating and rotating animation
      meshRef.current.rotation.x = Math.sin(time / 4) * 0.4;
      meshRef.current.rotation.y = Math.sin(time / 2) * 0.4;
      meshRef.current.position.y = Math.sin(time) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 1]} scale={1.2}>
      {/* Hexagonal ring (torus with 6 tubular segments) */}
      <torusGeometry args={[1.5, 0.4, 64, 6]} />
      <MeshTransmissionMaterial
        backside={false}
        thickness={2}
        roughness={0.05}
        transmission={1}
        ior={1.2}
        chromaticAberration={0.05}
        anisotropy={0.1}
        distortion={0.5}
        distortionScale={0.5}
        temporalDistortion={0.0}
        clearcoat={1}
        attenuationDistance={0.5}
        attenuationColor="#ffffff"
        color="#ffffff"
        resolution={256}
      />
    </mesh>
  );
};

const Scene = () => {
  const { viewport } = useThree();
  // Responsive font size
  const fontSize = Math.min(viewport.width / 4, 3);
  
  return (
    <>
      <color attach="background" args={['#00FF4D']} />
      
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      
      {/* Background Text */}
      <group position={[0, 0, -2]}>
        <Text
          fontSize={fontSize}
          letterSpacing={-0.05}
          color="black"
          position={[0, fontSize * 1.1, 0]}
          anchorX="center"
          anchorY="middle"
        >
          SECURE
        </Text>
        <Text
          fontSize={fontSize}
          letterSpacing={-0.05}
          color="black"
          position={[0, 0, 0]}
          anchorX="center"
          anchorY="middle"
        >
          WITH
        </Text>
        <Text
          fontSize={fontSize}
          letterSpacing={-0.05}
          color="black"
          position={[0, -fontSize * 1.1, 0]}
          anchorX="center"
          anchorY="middle"
        >
          BEHAVIOR
        </Text>
      </group>

      <GlassShape />

      {/* Environment lighting to create beautiful glassy reflections */}
      <Environment resolution={256} frames={1}>
        <group rotation={[-Math.PI / 4, -0.3, 0]}>
          <Lightformer intensity={20} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 2, 1]} />
        </group>
      </Environment>
    </>
  );
};

const RefractiveHero = () => {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      <Canvas camera={{ position: [0, 0, 10], fov: 35 }} dpr={[1, 1.5]}>
        <Scene />
      </Canvas>
    </section>
  );
};

export default RefractiveHero;
