import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { motion } from 'framer-motion-3d';

function AnimatedSpheres() {
    const group = useRef();

    useFrame((state) => {
        group.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    });

    return (
        <group ref={group}>
            {Array.from({ length: 50 }).map((_, i) => (
                <motion.mesh
                    key={i}
                    position={[
                        Math.random() * 20 - 10,
                        Math.random() * 20 - 10,
                        Math.random() * 20 - 10
                    ]}
                    animate={{
                        y: Math.sin(i) * 2,
                        x: Math.cos(i) * 2,
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 2 + Math.random() * 2,
                        ease: "easeInOut"
                    }}
                >
                    <Sphere args={[0.1]}>
                        <meshStandardMaterial
                            color={`hsl(${Math.random() * 360}, 50%, 75%)`}
                            transparent
                            opacity={0.6}
                        />
                    </Sphere>
                </motion.mesh>
            ))}
        </group>
    );
}

function AnimatedBackground() {
    return (
        <Canvas
            camera={{ position: [0, 0, 20] }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
            }}
        >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <AnimatedSpheres />
        </Canvas>
    );
}

export default AnimatedBackground; 