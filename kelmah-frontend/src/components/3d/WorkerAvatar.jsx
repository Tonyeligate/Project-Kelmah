import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const Avatar = () => {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 2, 32]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#FFB6C1" />
      </mesh>
      {/* Hard hat */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 0.3, 32]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
    </group>
  );
};

const WorkerAvatar = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Avatar />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
};

export default WorkerAvatar; 