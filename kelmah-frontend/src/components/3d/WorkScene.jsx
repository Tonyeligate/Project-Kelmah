import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Animated Tool Component
const Tool = ({ position, scale = 1, toolType = 'wrench' }) => {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    meshRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
    meshRef.current.position.y = Math.sin(t * 0.5) * 0.2 + position[1];
  });

  // Different geometries for different tools
  const getGeometry = () => {
    switch(toolType) {
      case 'wrench':
        return <boxGeometry args={[0.5, 2, 0.2]} />;
      case 'hammer':
        return <cylinderGeometry args={[0.2, 0.3, 2, 8]} />;
      case 'drill':
        return <coneGeometry args={[0.3, 2, 8]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {getGeometry()}
        <MeshDistortMaterial
          color="#FFD700"
          roughness={0.1}
          metalness={0.9}
          distort={0.2}
          speed={2}
        />
      </mesh>
    </Float>
  );
};

// Sparkles Effect
const Sparkles = () => {
  const count = 50;
  const sparklesRef = useRef();
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const positionArray = sparklesRef.current.geometry.attributes.position.array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positionArray[i3 + 1] = positions[i3 + 1] + Math.sin(time + i) * 0.1;
      positionArray[i3] = positions[i3] + Math.cos(time + i) * 0.1;
    }
    
    sparklesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={sparklesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#FFD700"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Connection Lines
const ConnectionLines = () => {
  const linesRef = useRef();
  const points = [
    new THREE.Vector3(-3, 2, 0),
    new THREE.Vector3(3, -2, 0),
    new THREE.Vector3(0, 3, 0),
    new THREE.Vector3(-3, 2, 0),
  ];

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    points.forEach((point, i) => {
      point.y += Math.sin(time + i) * 0.002;
      point.x += Math.cos(time + i) * 0.002;
    });
    linesRef.current.geometry.setFromPoints(points);
  });

  return (
    <line ref={linesRef}>
      <bufferGeometry />
      <lineBasicMaterial color="#FFD700" linewidth={1} transparent opacity={0.4} />
    </line>
  );
};

function WorkScene() {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
      <color attach="background" args={['#1a1a1a']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight 
        position={[-10, -10, -10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={1} 
      />

      {/* Tools */}
      <Tool position={[-3, 2, 0]} toolType="wrench" />
      <Tool position={[3, -2, 0]} toolType="hammer" />
      <Tool position={[0, 3, 0]} toolType="drill" />

      {/* Effects */}
      <Sparkles />
      <ConnectionLines />

      {/* Ground Reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          metalness={0.8}
          roughness={0.2}
          opacity={0.4}
          transparent
        />
      </mesh>
    </Canvas>
  );
}

export default WorkScene; 