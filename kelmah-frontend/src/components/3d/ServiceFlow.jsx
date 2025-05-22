import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const FlowingParticles = () => {
  const count = 100;
  const mesh = useRef();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const position = new THREE.Vector3(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      );
      const speed = 0.01 + Math.random() * 0.02;
      temp.push({ position, speed });
    }
    return temp;
  }, []);

  useFrame(({ clock }) => {
    particles.forEach((particle, i) => {
      const t = clock.getElapsedTime();
      
      dummy.position.copy(particle.position);
      dummy.position.y += Math.sin(t * particle.speed) * 0.1;
      dummy.position.x += Math.cos(t * particle.speed) * 0.1;
      dummy.updateMatrix();
      
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[0.1]} />
      <meshStandardMaterial color="#FFD700" />
    </instancedMesh>
  );
};

const ServiceIcon = ({ position, size = 1 }) => {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial 
          color="#FFD700"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
};

function ServiceFlow() {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <FlowingParticles />
      <ServiceIcon position={[-3, 2, 0]} size={0.8} />
      <ServiceIcon position={[3, -2, 0]} size={0.8} />
      <ServiceIcon position={[-2, -1, 0]} size={0.8} />
    </Canvas>
  );
}

export default ServiceFlow; 