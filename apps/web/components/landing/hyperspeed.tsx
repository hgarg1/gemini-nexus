"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function StarField({ count = 5000 }) {
  const mesh = useRef<THREE.Points>(null!);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      temp.push(x, y, z);
    }
    return new Float32Array(temp);
  }, [count]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    
    // Rotate the entire galaxy slowly
    mesh.current.rotation.z += delta * 0.05;
    
    if (!mesh.current.geometry.attributes.position) return;
    const positions: any = mesh.current.geometry.attributes.position.array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Move stars towards camera (z-axis)
      positions[i3 + 2] += delta * 400; // Speed
      
      // Reset if passed camera
      if (positions[i3 + 2] > 1000) {
        positions[i3 + 2] = -1000;
        positions[i3] = (Math.random() - 0.5) * 2000;
        positions[i3 + 1] = (Math.random() - 0.5) * 2000;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        color="#00f2ff"
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function Hyperspeed() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 100], fov: 75 }}
        gl={{ antialias: false, alpha: true }}
      >
        <color attach="background" args={["#000000"]} />
        <StarField />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
