import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpacecraftConfig } from '../types/game';

interface SpacecraftModelProps {
  config: SpacecraftConfig;
  isExploding?: boolean;
}

export const SpacecraftModel: React.FC<SpacecraftModelProps> = ({ config, isExploding = false }) => {
  const shipRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.Mesh>(null);
  const shieldBubbleRef = useRef<THREE.Mesh>(null);
  const explosionRef = useRef<THREE.Group>(null);

  const { chassisId, installedModules } = config;

  // Check equipped features
  const hasSolar = installedModules.includes('advanced-solar-wing') || config.coreComponents.solar;
  const hasRtg = installedModules.includes('rtg-power-unit') || config.coreComponents.powerSource === 'power-rtg-base';
  const hasDish = installedModules.includes('high-gain-antenna') || config.coreComponents.antenna === 'antenna-ka-band';
  const hasShield = installedModules.includes('heavy-deflector-shield');
  const hasArmor = installedModules.includes('reinforced-hull-plating') || installedModules.includes('radiation-shielding');

  useFrame((state, delta) => {
    if (shipRef.current) {
      // Subtle flight sway and roll
      shipRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
      shipRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
      shipRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 1.0) * 0.03;
    }

    if (thrusterRef.current) {
      // Thruster pulse flicker
      const s = 0.9 + Math.random() * 0.25;
      thrusterRef.current.scale.set(s, s * 1.4, s);
    }

    if (shieldBubbleRef.current && hasShield) {
      shieldBubbleRef.current.rotation.y += delta * 0.5;
    }

    if (explosionRef.current && isExploding) {
      explosionRef.current.scale.multiplyScalar(1.08);
      explosionRef.current.rotation.x += delta * 4;
      explosionRef.current.rotation.y += delta * 3;
    }
  });

  if (isExploding) {
    return (
      <group ref={explosionRef} position={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[2.5, 16, 16]} />
          <meshBasicMaterial color="#ef4444" wireframe />
        </mesh>
        <mesh>
          <dodecahedronGeometry args={[2.0, 1]} />
          <meshBasicMaterial color="#f59e0b" wireframe />
        </mesh>
        <pointLight color="#ff4400" intensity={15} distance={20} />
      </group>
    );
  }

  // Color schemes by chassis
  let primaryColor = '#38bdf8'; // Nova-Core cyan
  let metalColor = '#334155';
  let accentColor = '#00f0ff';

  if (chassisId === 'titan-x') {
    primaryColor = '#0284c7';
    metalColor = '#1e293b';
    accentColor = '#38bdf8';
  } else if (chassisId === 'aero-dart') {
    primaryColor = '#f59e0b'; // Gold-amber
    metalColor = '#0f172a';
    accentColor = '#fbbf24';
  } else if (chassisId === 'goliath') {
    primaryColor = '#e11d48'; // Heavy crimson
    metalColor = '#1e1b4b';
    accentColor = '#f43f5e';
  }

  return (
    <group ref={shipRef} position={[0, 0, 0]}>
      {/* Deflector Shield Energy Bubble */}
      {hasShield && (
        <mesh ref={shieldBubbleRef}>
          <sphereGeometry args={[3.2, 24, 24]} />
          <meshStandardMaterial
            color="#00f0ff"
            wireframe
            transparent
            opacity={0.18}
            emissive="#00f0ff"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}

      {/* Main Bus Fuselage based on chassis */}
      {chassisId === 'aero-dart' ? (
        // Sleek Dart Body
        <group>
          <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.7, 3.2, 16]} />
            <meshStandardMaterial color={primaryColor} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Wings */}
          <mesh position={[0, 0, -0.4]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.08, 3.6, 0.9]} />
            <meshStandardMaterial color={metalColor} metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ) : chassisId === 'titan-x' ? (
        // Heavy Box Modular Platform
        <group>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.8, 1.4, 3.2]} />
            <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.4, 0.4]}>
            <boxGeometry args={[1.4, 0.7, 2.0]} />
            <meshStandardMaterial color={primaryColor} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Heavy forward bumper */}
          <mesh position={[0, 0, 1.7]}>
            <cylinderGeometry args={[0.8, 0.9, 0.3, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ) : chassisId === 'goliath' ? (
        // Armored Dreadnought Hexagonal Citadel
        <group>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[1.4, 1.4, 3.0, 6]} />
            <meshStandardMaterial color={metalColor} metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Armored Bulkheads */}
          <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[2.8, 1.2, 2.0]} />
            <meshStandardMaterial color={primaryColor} metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ) : (
        // Nova-Core Balanced Cruiser
        <group>
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.85, 0.95, 2.8, 16]} />
            <meshStandardMaterial color={primaryColor} metalness={0.75} roughness={0.25} />
          </mesh>
          {/* Central Habitation Ring */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[1.3, 0.12, 12, 32]} />
            <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* Deployable Solar Wings */}
      {hasSolar && (
        <group position={[0, 0, -0.2]}>
          {/* Left Wing */}
          <mesh position={[-2.4, 0, 0]}>
            <boxGeometry args={[2.4, 0.04, 1.1]} />
            <meshStandardMaterial
              color="#1d4ed8"
              metalness={0.9}
              roughness={0.1}
              emissive="#1e40af"
              emissiveIntensity={0.2}
            />
          </mesh>
          {/* Right Wing */}
          <mesh position={[2.4, 0, 0]}>
            <boxGeometry args={[2.4, 0.04, 1.1]} />
            <meshStandardMaterial
              color="#1d4ed8"
              metalness={0.9}
              roughness={0.1}
              emissive="#1e40af"
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      )}

      {/* RTG Nuclear Power Unit */}
      {hasRtg && (
        <group position={[0, -0.85, -0.6]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.9, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Heat Radiator Fins */}
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.7, 0.02, 0.8]} />
            <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}

      {/* High-Gain Parabolic Reflector Dish */}
      {hasDish && (
        <group position={[0, 1.0, 0.4]} rotation={[0.4, 0.2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.65, 0.05, 0.25, 24]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Feeder Horn */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
      )}

      {/* Reinforced Hull Armor plating */}
      {hasArmor && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.9, 1.5, 2.5]} />
          <meshStandardMaterial color="#475569" wireframe transparent opacity={0.35} />
        </mesh>
      )}

      {/* Main Ion/Chemical Thruster Engine Bell & Glow */}
      <group position={[0, 0, -1.6]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.45, 0.6, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Thruster Flame/Plasma Exhaust */}
        <mesh ref={thrusterRef} position={[0, 0, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 0.9, 16]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.8} />
        </mesh>
        <pointLight color="#00f0ff" intensity={4} distance={6} />
      </group>
    </group>
  );
};
