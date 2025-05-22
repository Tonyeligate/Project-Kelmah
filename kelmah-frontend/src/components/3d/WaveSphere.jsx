import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';

const AnimatedSphere = () => {
  const sphereRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    sphereRef.current.rotation.x = Math.cos(t / 2);
    sphereRef.current.rotation.y = Math.sin(t / 2);
    sphereRef.current.position.y = Math.sin(t / 1.5) / 10;
  });

  return (
    <Sphere ref={sphereRef} args={[1, 64, 64]}>
      <MeshDistortMaterial
        color="#ffd700"
        attach="material"
        distort={0.4}
        speed={4}
        roughness={0}
        metalness={0.9}
      />
    </Sphere>
  );
};

const WaveSphere = () => {
  return (
    <Canvas camera={{ position: [0, 0, 2.5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <AnimatedSphere />
    </Canvas>
  );
};

export default WaveSphere; 