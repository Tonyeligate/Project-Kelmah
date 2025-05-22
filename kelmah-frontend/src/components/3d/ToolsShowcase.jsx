import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const Tool = ({ position, color }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const ToolsShowcase = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Tool position={[-2, 0, 0]} color="#FFD700" />
      <Tool position={[0, 0, 0]} color="#FFA500" />
      <Tool position={[2, 0, 0]} color="#FF4500" />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
};

export default ToolsShowcase; 