import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Effects, 
  Instances, 
  Instance,
  Trail, 
  Float, 
  MeshDistortMaterial,
  MeshReflectorMaterial,
  Environment
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';

const ProfessionalNode = ({ position, profession, connections }) => {
  const nodeRef = useRef();
  const trailRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    nodeRef.current.position.y += Math.sin(t + position.x) * 0.002;
    nodeRef.current.rotation.y += 0.01;
    if (trailRef.current) {
      trailRef.current.position.copy(nodeRef.current.position);
    }
  });

  return (
    <group position={position}>
      <Trail
        ref={trailRef}
        width={0.2}
        length={4}
        color={new THREE.Color(1, 0.84, 0)}
        attenuation={(t) => t * t}
      >
        <mesh ref={nodeRef}>
          <dodecahedronGeometry args={[0.4]} />
          <MeshDistortMaterial
            color="#FFD700"
            roughness={0.1}
            metalness={0.9}
            distort={0.2}
            speed={2}
          />
        </mesh>
      </Trail>
      {connections.map((target, i) => (
        <ConnectionBeam key={i} start={position} end={target} />
      ))}
    </group>
  );
};

const ConnectionBeam = ({ start, end }) => {
  const beamRef = useRef();
  const points = useMemo(() => {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(start.x, start.y, start.z),
      new THREE.Vector3(start.x, start.y + 2, start.z),
      new THREE.Vector3(end.x, end.y + 2, end.z),
      new THREE.Vector3(end.x, end.y, end.z)
    );
    return curve.getPoints(50);
  }, [start, end]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    beamRef.current.material.dashOffset = -t * 0.5;
  });

  return (
    <line ref={beamRef}>
      <bufferGeometry>
        <float32BufferAttribute attach="attributes-position" args={[points.flatMap(p => [p.x, p.y, p.z]), 3]} />
      </bufferGeometry>
      <lineDashedMaterial
        color="#FFD700"
        dashSize={0.2}
        gapSize={0.1}
        opacity={0.5}
        transparent
        linewidth={1}
      />
    </line>
  );
};

const SkillParticles = () => {
  const count = 200;
  const mesh = useRef();
  const [positions, scales] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
      scales[i] = Math.random() * 0.2;
    }
    
    return [positions, scales];
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      mesh.current.geometry.attributes.position.array[i3 + 1] += 
        Math.sin(time + positions[i3] * 0.1) * 0.01;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <float32BufferAttribute attach="attributes-position" args={[positions, 3]} />
        <float32BufferAttribute attach="attributes-scale" args={[scales, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#FFD700"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const NetworkScene = () => {
  const professionals = [
    { position: new THREE.Vector3(-3, 0, 0), profession: "Plumber" },
    { position: new THREE.Vector3(3, 0, 0), profession: "Electrician" },
    { position: new THREE.Vector3(0, 3, 0), profession: "Carpenter" },
    { position: new THREE.Vector3(0, -3, 0), profession: "Painter" },
    { position: new THREE.Vector3(-2, 2, 2), profession: "Mason" }
  ];

  // Create connections between professionals
  professionals.forEach(prof => {
    prof.connections = professionals
      .filter(p => p !== prof)
      .map(p => p.position)
      .slice(0, 2); // Connect to 2 nearest professionals
  });

  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
      <color attach="background" args={['#111']} />
      <fog attach="fog" args={['#111', 10, 30]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight
        position={[-10, -10, -10]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
      />

      <group>
        {professionals.map((prof, i) => (
          <ProfessionalNode key={i} {...prof} />
        ))}
      </group>

      <SkillParticles />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={2048}
          mixBlur={1}
          mixStrength={60}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.5}
        />
      </mesh>

      <Environment preset="city" />
      
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
        />
        <ChromaticAberration offset={[0.0005, 0.0005]} />
      </EffectComposer>
    </Canvas>
  );
};

export default NetworkScene; 