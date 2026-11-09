import React, { useEffect, useRef } from 'react';
import { SpacecraftConfig } from '../../types/game';

interface FlightView2DProps {
  config: SpacecraftConfig;
  isExploding?: boolean;
}

export const FlightView2D: React.FC<FlightView2DProps> = ({ config, isExploding = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: { x: number; y: number; s: number; speed: number; alpha: number }[] = [];

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.8 + 0.2,
        alpha: Math.random() * 0.8 + 0.2,
      });
    }

    const render = () => {
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render drifting stars
      stars.forEach((st) => {
        st.x -= st.speed;
        if (st.x < 0) st.x = canvas.width;
        ctx.fillStyle = `rgba(200, 230, 255, ${st.alpha})`;
        ctx.fillRect(st.x, st.y, st.s, st.s);
      });

      // Target celestial body in background
      const planetX = canvas.width * 0.78;
      const planetY = canvas.height * 0.35;
      const planetR = Math.min(canvas.width, canvas.height) * 0.18;

      const grad = ctx.createRadialGradient(
        planetX - planetR * 0.3,
        planetY - planetR * 0.3,
        planetR * 0.1,
        planetX,
        planetY,
        planetR
      );

      if (config.scenarioId === 'scenario-mars') {
        grad.addColorStop(0, '#ea580c');
        grad.addColorStop(1, '#7c2d12');
      } else if (config.scenarioId === 'scenario-moon') {
        grad.addColorStop(0, '#94a3b8');
        grad.addColorStop(1, '#334155');
      } else if (config.scenarioId === 'scenario-europa') {
        grad.addColorStop(0, '#e0f2fe');
        grad.addColorStop(1, '#0284c7');
      } else {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#1e3a8a');
      }

      ctx.beginPath();
      ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Atmosphere aura
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetR * 1.05, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Spacecraft in center-left
      const shipX = canvas.width * 0.42;
      const shipY = canvas.height * 0.52;

      if (isExploding) {
        ctx.beginPath();
        ctx.arc(shipX, shipY, 45, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.stroke();
      } else {
        // Spacecraft SVG-style vector drawing
        ctx.save();
        ctx.translate(shipX, shipY);

        // Thruster plume
        ctx.beginPath();
        ctx.moveTo(-45, 0);
        ctx.lineTo(-75 - Math.random() * 20, -8);
        ctx.lineTo(-65, 0);
        ctx.lineTo(-75 - Math.random() * 20, 8);
        ctx.closePath();
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Fuselage unibody
        ctx.beginPath();
        ctx.moveTo(45, 0);
        ctx.lineTo(10, -18);
        ctx.lineTo(-40, -14);
        ctx.lineTo(-45, 0);
        ctx.lineTo(-40, 14);
        ctx.lineTo(10, 18);
        ctx.closePath();
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cockpit / Avionics core
        ctx.beginPath();
        ctx.arc(15, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        // Solar panels if equipped
        ctx.fillStyle = '#1e40af';
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1;
        ctx.fillRect(-25, -55, 18, 35);
        ctx.strokeRect(-25, -55, 18, 35);
        ctx.fillRect(-25, 20, 18, 35);
        ctx.strokeRect(-25, 20, 18, 35);

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [config, isExploding]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-space-950">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute bottom-3 left-4 text-xs font-mono text-cyan-400/70 uppercase tracking-widest pointer-events-none">
        [ 2D Tactical Telemetry View // High-Efficiency Canvas Fallback Active ]
      </div>
    </div>
  );
};
