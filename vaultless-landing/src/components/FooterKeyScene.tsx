import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';

const BronzeMaterial = () => (
  <meshStandardMaterial
    color="#b27a2c"
    metalness={0.82}
    roughness={0.34}
    emissive="#1a1004"
    emissiveIntensity={0.08}
  />
);

const FooterKeyModel = () => {
  return (
    <group rotation={[0.25, -0.35, -0.08]} scale={1.05}>
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.25, 32]} />
        <BronzeMaterial />
      </mesh>

      <mesh position={[0, 1.72, 0]}>
        <boxGeometry args={[0.82, 0.22, 0.18]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[-0.28, 1.54, 0]}>
        <boxGeometry args={[0.18, 0.34, 0.18]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[-0.06, 1.56, 0]}>
        <boxGeometry args={[0.16, 0.24, 0.18]} />
        <BronzeMaterial />
      </mesh>

      <mesh position={[0, -0.72, 0]}>
        <torusGeometry args={[0.58, 0.09, 24, 72]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[-0.3, -0.72, 0]}>
        <torusGeometry args={[0.24, 0.065, 20, 48]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[0.3, -0.72, 0]}>
        <torusGeometry args={[0.24, 0.065, 20, 48]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[0, -0.72, 0]}>
        <torusGeometry args={[0.17, 0.06, 20, 48]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[0, -1.17, 0]}>
        <torusGeometry args={[0.18, 0.06, 20, 48]} />
        <BronzeMaterial />
      </mesh>

      <mesh position={[0, -0.08, 0]}>
        <torusGeometry args={[0.18, 0.055, 16, 36]} />
        <BronzeMaterial />
      </mesh>
    </group>
  );
};

const Chip = ({ position, rotation, scale }: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}) => (
  <mesh position={position} rotation={rotation} scale={scale}>
    <boxGeometry args={[1, 1, 1]} />
    <BronzeMaterial />
  </mesh>
);

const FooterKeyShatterModel = () => {
  return (
    <group rotation={[0.8, -0.18, 0.02]} scale={0.95}>
      <mesh position={[-0.85, 0.04, 0.04]} rotation={[0, 0.2, 1.45]}>
        <cylinderGeometry args={[0.08, 0.08, 0.95, 24]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[0.05, -0.02, -0.03]} rotation={[0.2, 0.1, 1.58]}>
        <cylinderGeometry args={[0.08, 0.08, 1.05, 24]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[0.78, 0.02, 0.05]} rotation={[-0.12, -0.08, 1.4]}>
        <cylinderGeometry args={[0.075, 0.075, 0.7, 24]} />
        <BronzeMaterial />
      </mesh>

      <mesh position={[-1.3, -0.52, 0.1]} rotation={[0.9, -0.1, -0.35]}>
        <torusGeometry args={[0.42, 0.075, 18, 48]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[-0.45, -0.55, -0.12]} rotation={[1.1, 0.45, 0.18]}>
        <torusGeometry args={[0.28, 0.06, 16, 36]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[0.42, -0.56, 0.1]} rotation={[0.8, -0.38, -0.22]}>
        <torusGeometry args={[0.26, 0.06, 16, 36]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[1.14, -0.47, -0.08]} rotation={[1, 0.2, 0.55]}>
        <torusGeometry args={[0.2, 0.055, 14, 32]} />
        <BronzeMaterial />
      </mesh>

      <mesh position={[1.05, 0.46, 0.02]} rotation={[0.1, -0.2, -0.3]}>
        <boxGeometry args={[0.75, 0.22, 0.18]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[1.48, 0.18, -0.05]} rotation={[0.3, 0.1, 0.52]}>
        <boxGeometry args={[0.2, 0.42, 0.18]} />
        <BronzeMaterial />
      </mesh>
      <mesh position={[1.74, 0.2, 0.07]} rotation={[-0.1, 0.2, -0.4]}>
        <boxGeometry args={[0.16, 0.32, 0.16]} />
        <BronzeMaterial />
      </mesh>

      <Chip position={[-1.85, 0.28, -0.08]} rotation={[0.4, 0.7, 0.2]} scale={[0.24, 0.08, 0.12]} />
      <Chip position={[-1.55, -0.1, 0.24]} rotation={[0.2, -0.4, 0.9]} scale={[0.16, 0.06, 0.1]} />
      <Chip position={[-0.18, 0.34, 0.18]} rotation={[-0.3, 0.7, -0.5]} scale={[0.18, 0.07, 0.13]} />
      <Chip position={[0.58, 0.26, -0.22]} rotation={[0.6, 0.2, 0.8]} scale={[0.22, 0.06, 0.11]} />
      <Chip position={[1.9, -0.26, 0.2]} rotation={[-0.2, -0.6, 0.4]} scale={[0.18, 0.07, 0.12]} />
      <Chip position={[2.1, 0.08, -0.08]} rotation={[0.5, 0.1, -0.8]} scale={[0.14, 0.05, 0.09]} />
    </group>
  );
};

const FooterKeyScene = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5.1], fov: 34 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={1.15} />
      <directionalLight position={[3, 5, 4]} intensity={2.1} />
      <directionalLight position={[-3, -1, 3]} intensity={0.7} color="#00ff4d" />
      <FooterKeyModel />
      <Environment preset="city" />
    </Canvas>
  );
};

export const FooterKeyShatterScene = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5.1], fov: 36 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={1.05} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} />
      <directionalLight position={[-3, -1, 3]} intensity={0.55} color="#00ff4d" />
      <FooterKeyShatterModel />
      <Environment preset="city" />
    </Canvas>
  );
};

export default FooterKeyScene;
