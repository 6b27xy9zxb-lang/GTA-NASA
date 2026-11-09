import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Starfield } from './Starfield';
import { PlanetModel } from './PlanetModel';
import { SpacecraftModel } from './SpacecraftModel';
import { SpacecraftConfig } from '../types/game';

interface SpaceSceneProps {
  config: SpacecraftConfig;
  isExploding?: boolean;
  lowGraphics?: boolean;
}

export const SpaceScene: React.FC<SpaceSceneProps> = ({
  config,
  isExploding = false,
  lowGraphics = false,
}) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-space-950 select-none">
      <Canvas
        dpr={lowGraphics ? 1 : [1, 2]}
        gl={{ antialias: !lowGraphics, powerPreference: 'high-performance' }}
      >
        <PerspectiveCamera makeDefault position={[3.5, 2.0, 5.0]} fov={50} />
        <OrbitControls
          enablePan={false}
          maxDistance={12}
          minDistance={2.5}
          autoRotate={false}
          dampingFactor={0.05}
        />

        {/* Cinematic Deep Space Lighting */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[10, 8, 5]} intensity={1.8} color="#ffffff" castShadow />
        <pointLight position={[-8, -5, -10]} intensity={0.5} color="#38bdf8" />

        <Suspense fallback={null}>
          <Starfield count={lowGraphics ? 800 : 2200} />
          <PlanetModel scenarioId={config.scenarioId} />
          <SpacecraftModel config={config} isExploding={isExploding} />
        </Suspense>
      </Canvas>

      {/* Subtle Overlay Vignette & Grid */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-transparent via-space-950/20 to-space-950/80" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
    </div>
  );
};
