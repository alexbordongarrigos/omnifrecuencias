import React, { useRef, useEffect, useState } from 'react';
import { CymaticsConfig, CymaticsPalette, CymaticsMode } from '../types';
import Icon from './Icon';

interface Props {
  analyser: AnalyserNode | null;
  activeFrequencies?: number[];
  height?: number;
}

export const CymaticsVisualizer3D: React.FC<Props> = ({ analyser, activeFrequencies = [432], height = 450 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cymatics Configuration State
  const [config, setConfig] = useState<CymaticsConfig>({
    mode: 'chladni3d',
    n: 3,
    m: 5,
    particleCount: 1200,
    sensitivity: 1.2,
    palette: 'holographic',
    vibrationSpeed: 1.0,
    vibrationAmplitude: 1.0,
    plateMeshResolution: 40,
    autoRotate: true,
    showParticles: true,
    gravity: 0.05,
    particleDensity: 0.8,
    particleSize: 2.0,
    particleWeight: 0.92
  });

  const [isRotating, setIsRotating] = useState(true);
  const [rotationX, setRotationX] = useState(0.5);
  const [rotationY, setRotationY] = useState(0.4);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Get color palette gradient arrays
  const getPaletteColors = (palette: CymaticsPalette) => {
    switch (palette) {
      case 'quantum':
        return { plate: '#3b82f6', line: '#60a5fa', particles: '#93c5fd', glow: 'rgba(59, 130, 246, 0.5)' };
      case 'neon':
        return { plate: '#f472b6', line: '#ec4899', particles: '#f43f5e', glow: 'rgba(244, 114, 182, 0.5)' };
      case 'aurora':
        return { plate: '#34d399', line: '#10b981', particles: '#6ee7b7', glow: 'rgba(52, 211, 153, 0.5)' };
      case 'gold':
        return { plate: '#fbbf24', line: '#f59e0b', particles: '#fef08a', glow: 'rgba(251, 191, 36, 0.5)' };
      case 'holographic':
      default:
        return { plate: '#22d3ee', line: '#a855f7', particles: '#f472b6', glow: 'rgba(34, 211, 238, 0.5)' };
    }
  };

  // Main 3D Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let angleY = rotationY;
    const fftData = new Uint8Array(analyser ? analyser.frequencyBinCount : 256);

    // Particles system initialization
    const particles: { x: number; y: number; vx: number; vy: number; pz: number }[] = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        vx: 0,
        vy: 0,
        pz: 0
      });
    }

    let time = 0;

    const render = () => {
      time += 0.03 * config.vibrationSpeed;

      if (isRotating) {
        angleY += 0.005;
      } else {
        angleY = rotationY;
      }

      // Read audio FFT amplitude
      let audioAmp = 0.5;
      if (analyser) {
        analyser.getByteFrequencyData(fftData);
        let sum = 0;
        for (let i = 0; i < 64; i++) sum += fftData[i];
        audioAmp = (sum / 64 / 255) * config.sensitivity;
      }

      const primaryFreq = activeFrequencies[0] || 432;
      // Calculate dynamic modal numbers based on active frequency if automatic
      const n = config.n + Math.floor((primaryFreq % 100) / 25);
      const m = config.m + Math.floor((primaryFreq % 50) / 10);

      // Resize canvas to match display
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      const colors = getPaletteColors(config.palette);

      // 3D Projection Helper
      const project = (x: number, y: number, z: number) => {
        // Rotate Y
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        // Rotate X
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Perspective Projection
        const fov = 400;
        const dist = 3.5 + z2;
        const px = cx + (x1 * fov) / dist;
        const py = cy + (y2 * fov) / dist;
        return { px, py, scale2: 1 / dist, z2 };
      };

      // Chladni 2D Formula: N(x,y) = sin(n*pi*x)*sin(m*pi*y) - sin(m*pi*x)*sin(n*pi*y)
      const chladni = (x: number, y: number) => {
        const pi = Math.PI;
        const val = Math.sin(n * pi * x) * Math.sin(m * pi * y) - Math.sin(m * pi * x) * Math.sin(n * pi * y);
        return val;
      };

      // Render 3D Surface Grid / Mesh (STABLE GEOMETRY WITH MODULABLE AMPLITUDE)
      const res = config.plateMeshResolution;
      const step = 2 / res;
      const ampMult = 0.35 * config.vibrationAmplitude;

      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.glow;

      for (let i = 0; i < res; i++) {
        const x = -1 + i * step;
        ctx.beginPath();
        for (let j = 0; j <= res; j++) {
          const y = -1 + j * step;
          const amp = chladni(x, y) * audioAmp * ampMult;
          const p = project(x, amp, y);
          if (j === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();
      }

      for (let j = 0; j < res; j++) {
        const y = -1 + j * step;
        ctx.beginPath();
        for (let i = 0; i <= res; i++) {
          const x = -1 + i * step;
          const amp = chladni(x, y) * audioAmp * ampMult;
          const p = project(x, amp, y);
          if (i === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();
      }

      // Render Chladni Particles Migration (Particles move towards nodal lines where chladni(x,y) ~ 0)
      if (config.showParticles) {
        ctx.fillStyle = colors.particles;
        particles.forEach(pt => {
        const val = chladni(pt.x, pt.y);
        const gradX = (chladni(pt.x + 0.02, pt.y) - chladni(pt.x - 0.02, pt.y)) / 0.04;
        const gradY = (chladni(pt.x, pt.y + 0.02) - chladni(pt.x, pt.y - 0.02)) / 0.04;

        // Force pushing away from anti-nodes towards nodal zero lines
        const vib = Math.abs(val) * audioAmp * config.gravity;
        pt.vx += gradX * vib + (Math.random() - 0.5) * (1.0 - config.particleDensity) * 0.01;
        pt.vy += gradY * vib + (Math.random() - 0.5) * (1.0 - config.particleDensity) * 0.01;

        pt.vx *= config.particleWeight;
        pt.vy *= config.particleWeight;

        pt.x += pt.vx;
        pt.y += pt.vy;

        // Keep inside bounds [-1, 1]
        if (pt.x < -1) pt.x = 1;
        if (pt.x > 1) pt.x = -1;
        if (pt.y < -1) pt.y = 1;
        if (pt.y > 1) pt.y = -1;

        const ptAmp = val * audioAmp * ampMult;
        const p = project(pt.x, ptAmp, pt.y);

        const r = Math.max(0.5, config.particleSize * p.scale2);
        ctx.beginPath();
        ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
        ctx.fill();
      });
      }

      // Render Glowing Outer Ring
      ctx.beginPath();
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 2;
      const ringSegs = 48;
      for (let s = 0; s <= ringSegs; s++) {
        const a = (s / ringSegs) * Math.PI * 2;
        const rx = Math.cos(a);
        const ry = Math.sin(a);
        const p = project(rx, 0, ry);
        if (s === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animFrameId);
  }, [analyser, activeFrequencies, config, isRotating, rotationX, rotationY]);

  // Drag interaction for 3D rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    setIsRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    setRotationY(prev => prev + dx * 0.01);
    setRotationX(prev => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev + dy * 0.01)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative rounded-3xl border border-cyan-500/30 bg-black/80 backdrop-blur-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(34,211,238,0.05)] overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none"></div>
      
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 relative z-10 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Icon name="Orbit" size={22} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </div>
          <div>
            <h3 className="text-lg font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300">
              Patrón Cimático 3D Chladni
            </h3>
            <p className="text-[10px] text-cyan-200/70 font-bold uppercase tracking-widest">
              Geometría Acústica de Placa Estable & Modulable
            </p>
          </div>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
              isRotating
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {isRotating ? 'Rotación 3D: On' : 'Rotación 3D: Pausa'}
          </button>
          
          <button
            onClick={() => setConfig(prev => ({ ...prev, showParticles: !prev.showParticles }))}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
              config.showParticles
                ? 'bg-pink-950/60 border-pink-500/40 text-pink-300 shadow-[0_0_15px_rgba(244,114,182,0.3)]'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {config.showParticles ? 'Partículas: On' : 'Partículas: Off'}
          </button>

          <select
            value={config.palette}
            onChange={(e) => setConfig(prev => ({ ...prev, palette: e.target.value as CymaticsPalette }))}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold text-cyan-200 uppercase tracking-wider focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="holographic">Holográfico</option>
            <option value="quantum">Quantum Blue</option>
            <option value="neon">Neon Magenta</option>
            <option value="aurora">Aurora Green</option>
            <option value="gold">Gold Alquimia</option>
          </select>
        </div>
      </div>

      {/* Modal / Parameters Slider Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 relative z-10 bg-black/40 p-4 rounded-2xl border border-white/5 text-[10px]">
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Gravedad ({config.gravity.toFixed(2)})</span>
          <input
            type="range" min="0.01" max="0.2" step="0.01" value={config.gravity}
            onChange={(e) => setConfig(prev => ({ ...prev, gravity: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Peso Partículas ({(config.particleWeight * 100).toFixed(0)}%)</span>
          <input
            type="range" min="0.80" max="0.99" step="0.01" value={config.particleWeight}
            onChange={(e) => setConfig(prev => ({ ...prev, particleWeight: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Tamaño Partículas ({config.particleSize.toFixed(1)})</span>
          <input
            type="range" min="0.5" max="5.0" step="0.1" value={config.particleSize}
            onChange={(e) => setConfig(prev => ({ ...prev, particleSize: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Densidad Flujo ({(config.particleDensity * 100).toFixed(0)}%)</span>
          <input
            type="range" min="0.1" max="1.0" step="0.1" value={config.particleDensity}
            onChange={(e) => setConfig(prev => ({ ...prev, particleDensity: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Amplitud ({config.vibrationAmplitude.toFixed(1)}x)</span>
          <input
            type="range" min="0.1" max="3.0" step="0.1" value={config.vibrationAmplitude}
            onChange={(e) => setConfig(prev => ({ ...prev, vibrationAmplitude: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Factor Modal N ({config.n})</span>
          <input
            type="range" min="1" max="12" value={config.n}
            onChange={(e) => setConfig(prev => ({ ...prev, n: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Factor Modal M ({config.m})</span>
          <input
            type="range" min="1" max="12" value={config.m}
            onChange={(e) => setConfig(prev => ({ ...prev, m: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Partículas ({config.particleCount})</span>
          <input
            type="range" min="400" max="3000" step="200" value={config.particleCount}
            onChange={(e) => setConfig(prev => ({ ...prev, particleCount: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-pink-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>

      {/* 3D Canvas rendering surface */}
      <div 
        className="relative w-full rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 bg-black/90 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)]"
        style={{ height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        <div className="absolute bottom-3 left-4 text-[9px] text-slate-500 font-mono tracking-widest uppercase pointer-events-none bg-black/60 px-3 py-1.5 rounded-lg border border-white/5">
          Ecuación: Z = sin({config.n}πx)sin({config.m}πy) - sin({config.m}πx)sin({config.n}πy)
        </div>
      </div>
    </div>
  );
};

export default CymaticsVisualizer3D;
