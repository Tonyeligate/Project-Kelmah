import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, MeshDistortMaterial } from '@react-three/drei';

const AnimatedCube = () => {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(time / 4);
    meshRef.current.rotation.y = Math.sin(time / 2);
    meshRef.current.position.y = Math.sin(time / 1.5) / 10;
  });

  return (
    <Box ref={meshRef} args={[1, 1, 1]}>
      <MeshDistortMaterial
        color="#ffd700"
        speed={2}
        distort={0.3}
        radius={1}
      />
    </Box>
  );
};

const FloatingCube = () => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <AnimatedCube />
    </Canvas>
  );
};

export default FloatingCube; 