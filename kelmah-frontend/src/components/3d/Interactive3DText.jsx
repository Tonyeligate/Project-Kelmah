import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text3D, Center, useMatcapTexture } from '@react-three/drei';
import { motion } from 'framer-motion-3d';

const AnimatedText = ({ text }) => {
  const meshRef = useRef();
  const [matcapTexture] = useMatcapTexture('7B5254_E9DCC7_B19986_C8AC91', 256);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(time / 4) * 0.1;
    meshRef.current.rotation.y = Math.sin(time / 2) * 0.1;
    if (hovered) {
      meshRef.current.scale.setScalar(1.1 + Math.sin(time * 4) * 0.05);
    }
  });

  return (
    <Center>
      <motion.group
        ref={meshRef}
        whileHover={{ scale: 1.2 }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={0.5}
          height={0.2}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.02}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={5}
        >
          {text}
          <meshMatcapMaterial matcap={matcapTexture} />
        </Text3D>
      </motion.group>
    </Center>
  );
};

const Interactive3DText = ({ text = "KELMAH" }) => {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <AnimatedText text={text} />
    </Canvas>
  );
};

export default Interactive3DText; 