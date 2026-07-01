import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const GlowingShape = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float
      speed={2} // Animation speed, defaults to 1
      rotationIntensity={0.5} // XYZ rotation intensity, defaults to 1
      floatIntensity={1} // Up/down float intensity, works like a multiplier with floatingRange,defaults to 1
    >
      <mesh ref={meshRef} scale={1.5}>
        <icosahedronGeometry args={[1, 1]} />
        <meshPhysicalMaterial 
          color="#3b82f6" 
          wireframe={true} 
          roughness={0.1}
          metalness={0.8}
          transparent={true}
          opacity={0.4}
          emissive="#3b82f6"
          emissiveIntensity={2}
        />
      </mesh>
      
      {/* Inner solid core */}
      <mesh scale={0.8}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color="#60a5fa"
          transparent={true}
          opacity={0.2}
        />
      </mesh>
    </Float>
  );
};

export const ThreeDHero: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        
        {/* Background stars/dust */}
        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        {/* Abstract floating center shape */}
        <GlowingShape />
      </Canvas>
    </div>
  );
};
