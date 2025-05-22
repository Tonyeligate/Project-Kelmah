import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Lines = () => {
  const linesRef = useRef();
  const points = [];
  
  // Create a grid of points
  for (let i = -5; i <= 5; i += 2) {
    for (let j = -5; j <= 5; j += 2) {
      points.push(new THREE.Vector3(i, j, 0));
    }
  }

  useFrame(({ clock }) => {
    points.forEach((point, i) => {
      point.z = Math.sin(clock.getElapsedTime() + i * 0.1) * 2;
    });
    if (linesRef.current) {
      linesRef.current.geometry.setFromPoints(points);
    }
  });

  return (
    <line ref={linesRef}>
      <bufferGeometry />
      <lineBasicMaterial color="#FFD700" linewidth={2} />
    </line>
  );
};

const ConnectionLines = () => {
  return (
    <Canvas camera={{ position: [0, 0, 10] }}>
      <ambientLight intensity={0.5} />
      <Lines />
    </Canvas>
  );
};

export default ConnectionLines; 