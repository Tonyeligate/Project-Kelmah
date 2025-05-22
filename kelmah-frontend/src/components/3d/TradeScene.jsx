import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const Tool = ({ position, rotation, scale = 1 }) => {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(t) * 0.1;
    meshRef.current.rotation.y += 0.01;
    meshRef.current.position.y = Math.sin(t * 2) * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#FFD700"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
};

const ConnectingLines = () => {
  const linesRef = useRef();
  const positions = [
    new THREE.Vector3(-4, 0, 0),
    new THREE.Vector3(4, 0, 0),
    new THREE.Vector3(0, 4, 0),
  ];

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    positions.forEach((pos, i) => {
      pos.y = Math.sin(time + i * 0.5) * 0.5;
    });
    linesRef.current.geometry.setFromPoints(positions);
  });

  return (
    <line ref={linesRef}>
      <bufferGeometry />
      <lineBasicMaterial color="#FFD700" linewidth={2} />
    </line>
  );
};

function TradeScene() {
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Tool position={[-4, 0, 0]} rotation={[0, 0, Math.PI / 4]} scale={0.8} />
      <Tool position={[4, 0, 0]} rotation={[0, 0, -Math.PI / 4]} scale={0.8} />
      <Tool position={[0, 4, 0]} rotation={[Math.PI / 4, 0, 0]} scale={0.8} />
      <ConnectingLines />
    </Canvas>
  );
}

export default TradeScene;