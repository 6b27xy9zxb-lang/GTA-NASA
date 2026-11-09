import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlanetProps {
  scenarioId: string;
}

export const PlanetModel: React.FC<PlanetProps> = ({ scenarioId }) => {
  const planetRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.05;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += delta * 0.07;
    }
  });

  // Color schemes and appearance based on scenario
  let surfaceColor = '#1e40af'; // Earth blue
  let detailColor = '#15803d'; // Earth land green
  let atmosphereColor = '#38bdf8';
  let atmosphereOpacity = 0.25;
  let planetRadius = 4.2;

  if (scenarioId === 'scenario-moon') {
    surfaceColor = '#475569';
    detailColor = '#334155';
    atmosphereColor = '#94a3b8';
    atmosphereOpacity = 0.05;
    planetRadius = 3.6;
  } else if (scenarioId === 'scenario-mars') {
    surfaceColor = '#c2410c'; // Red planet
    detailColor = '#7c2d12';
    atmosphereColor = '#fb923c';
    atmosphereOpacity = 0.22;
    planetRadius = 4.0;
  } else if (scenarioId === 'scenario-europa') {
    surfaceColor = '#f1f5f9'; // Pale icy Europa
    detailColor = '#94a3b8'; // Lineae fractures
    atmosphereColor = '#06b6d4'; // Induced ocean cyan luminescence
    atmosphereOpacity = 0.35;
    planetRadius = 3.8;
  }

  return (
    <group ref={planetRef} position={[14, -2, -18]}>
      {/* Planetary Body */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[planetRadius, 48, 48]} />
        <meshStandardMaterial
          color={surfaceColor}
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Surface Pattern Banding / Continents */}
      <mesh scale={[1.002, 1.002, 1.002]}>
        <sphereGeometry args={[planetRadius, 32, 32]} />
        <meshStandardMaterial
          color={detailColor}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Atmospheric Glow Shell */}
      <mesh ref={atmosphereRef} scale={[1.08, 1.08, 1.08]}>
        <sphereGeometry args={[planetRadius, 32, 32]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={atmosphereOpacity}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};
