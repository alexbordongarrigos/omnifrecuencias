import React, { useRef, useEffect, useState } from 'react';
import { CymaticsConfig, CymaticsPalette, CymaticsMode, OscillatorState } from '../types';
import Icon from './Icon';
import OscillatorControls from './OscillatorControls';

interface Props {
  analyser: AnalyserNode | null;
  activeFrequencies?: number[];
  allOscillators?: OscillatorState[];
  onUpdateOscillator?: (id: string, updates: Partial<OscillatorState>) => void;
  onRemoveOscillator?: (id: string) => void;
  getOscillatorAnalyser?: (id: string) => AnalyserNode | null;
  isMasterPlaying?: boolean;
  height?: number;
}

export const CymaticsVisualizer3D: React.FC<Props> = ({ analyser, activeFrequencies = [432], allOscillators = [], onUpdateOscillator, onRemoveOscillator, getOscillatorAnalyser, isMasterPlaying = true, height = 450 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideControlsTimeout = () => {
    setShowFullscreenControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowFullscreenControls(false);
    }, 3000);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) setShowControls(true);
      if (!!document.fullscreenElement) {
        resetHideControlsTimeout();
      } else {
        if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

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

  const resetConfig = () => {
    setConfig({
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
    setRotationX(0.5);
    setRotationY(0.4);
    setIsRotating(true);
  };
  
  const [isRotating, setIsRotating] = useState(true);
  const [rotationX, setRotationX] = useState(0.5);
  const [rotationY, setRotationY] = useState(0.4);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const isMasterPlayingRef = useRef(isMasterPlaying);
  useEffect(() => { isMasterPlayingRef.current = isMasterPlaying; }, [isMasterPlaying]);

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
      const hasPlaying = allOscillators.some(o => o.isPlaying);
      if (isMasterPlayingRef.current && hasPlaying) {
        time += 0.03 * config.vibrationSpeed;
      }

      if (isRotating && isMasterPlayingRef.current && hasPlaying) {
        angleY += 0.005;
      } else {
        if (!isRotating) angleY = rotationY;
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
    <div ref={containerRef} className={`relative ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none bg-black flex flex-col p-0' : 'rounded-3xl border border-cyan-500/30 bg-black/80 backdrop-blur-2xl p-6'} shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(34,211,238,0.05)] overflow-hidden transition-all duration-500`}>
      
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none"></div>
      
      {isFullscreen && !showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute top-4 right-4 z-50 p-3 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded-full text-cyan-300 backdrop-blur-md transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-pulse"
        >
          <Icon name="Settings" size={24} />
        </button>
      )}

      {/* Header controls */}
      <div className={`flex flex-wrap items-center justify-between gap-4 relative z-10 border-b border-white/10 pb-4 ${isFullscreen && !showControls ? 'hidden' : 'mb-4'} ${isFullscreen ? 'px-6 pt-6' : ''}`}>
      
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
            onClick={resetConfig}
            className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-1"
          >
            <Icon name="RefreshCw" size={12} /> Restablecer
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/40 transition-colors shadow-[0_0_10px_rgba(168,85,247,0.2)] flex items-center gap-1"
          >
            <Icon name={isFullscreen ? "Minimize" : "Maximize"} size={12} />
            {isFullscreen ? "Salir Pantalla Completa" : "Pantalla Completa"}
          </button>
          
          {isFullscreen && (
            <button
              onClick={() => setShowControls(false)}
              className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/40 transition-colors shadow-[0_0_10px_rgba(239,68,68,0.2)] flex items-center gap-1"
            >
              <Icon name="EyeOff" size={12} /> Ocultar
            </button>
          )}
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
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10 bg-black/40 p-4 rounded-2xl border border-white/5 text-[10px] ${isFullscreen && !showControls ? 'hidden' : 'mb-4'} ${isFullscreen ? 'mx-6' : ''}`}>
        <div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Gravedad</span>
             <input type="number" min="0.01" max="0.2" step="0.01" value={config.gravity} onChange={(e) => setConfig(prev => ({ ...prev, gravity: parseFloat(e.target.value) || 0.05 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="0.01" max="0.2" step="0.01" value={config.gravity}
            onChange={(e) => setConfig(prev => ({ ...prev, gravity: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Peso Part. (%)</span>
             <input type="number" min="80" max="99" step="1" value={Math.round(config.particleWeight * 100)} onChange={(e) => setConfig(prev => ({ ...prev, particleWeight: (parseFloat(e.target.value) || 92) / 100 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="0.80" max="0.99" step="0.01" value={config.particleWeight}
            onChange={(e) => setConfig(prev => ({ ...prev, particleWeight: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Tamaño Part.</span>
             <input type="number" min="0.5" max="5.0" step="0.1" value={config.particleSize} onChange={(e) => setConfig(prev => ({ ...prev, particleSize: parseFloat(e.target.value) || 2.0 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="0.5" max="5.0" step="0.1" value={config.particleSize}
            onChange={(e) => setConfig(prev => ({ ...prev, particleSize: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Densidad Flujo (%)</span>
             <input type="number" min="10" max="100" step="10" value={Math.round(config.particleDensity * 100)} onChange={(e) => setConfig(prev => ({ ...prev, particleDensity: (parseFloat(e.target.value) || 80) / 100 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="0.1" max="1.0" step="0.1" value={config.particleDensity}
            onChange={(e) => setConfig(prev => ({ ...prev, particleDensity: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Amplitud</span>
             <input type="number" min="0.1" max="3.0" step="0.1" value={config.vibrationAmplitude} onChange={(e) => setConfig(prev => ({ ...prev, vibrationAmplitude: parseFloat(e.target.value) || 1.0 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="0.1" max="3.0" step="0.1" value={config.vibrationAmplitude}
            onChange={(e) => setConfig(prev => ({ ...prev, vibrationAmplitude: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Factor Modal N</span>
             <input type="number" min="1" max="12" step="1" value={config.n} onChange={(e) => setConfig(prev => ({ ...prev, n: parseInt(e.target.value) || 3 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="1" max="12" value={config.n}
            onChange={(e) => setConfig(prev => ({ ...prev, n: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Factor Modal M</span>
             <input type="number" min="1" max="12" step="1" value={config.m} onChange={(e) => setConfig(prev => ({ ...prev, m: parseInt(e.target.value) || 5 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="1" max="12" value={config.m}
            onChange={(e) => setConfig(prev => ({ ...prev, m: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Partículas</span>
             <input type="number" min="400" max="3000" step="100" value={config.particleCount} onChange={(e) => setConfig(prev => ({ ...prev, particleCount: parseInt(e.target.value) || 1200 }))} className="w-14 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="400" max="3000" step="200" value={config.particleCount}
            onChange={(e) => setConfig(prev => ({ ...prev, particleCount: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-pink-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>

      {/* 3D Canvas rendering surface */}
      <div 
        className={`relative w-full rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 bg-black/90 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] ${isFullscreen ? 'flex-1 rounded-none resize-none' : 'resize'}`}
        style={{ minHeight: '300px', height: isFullscreen ? '100%' : `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        <div className="absolute bottom-3 left-4 text-[9px] text-slate-500 font-mono tracking-widest uppercase pointer-events-none bg-black/60 px-3 py-1.5 rounded-lg border border-white/5">
          Ecuación: Z = sin({config.n}πx)sin({config.m}πy) - sin({config.m}πx)sin({config.n}πy)
        </div>
        
        {/* Resize handle icon (visual only, CSS resize handles the actual drag) */}
        <div className="absolute bottom-0 right-0 p-2 text-white/20 pointer-events-none">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 15 21 21 15 21"></polyline><polyline points="9 3 3 3 3 9"></polyline></svg>
        </div>
      </div>
      
      {isFullscreen && (
        <div 
           className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
           onMouseMove={resetHideControlsTimeout}
           onClick={() => !showFullscreenControls && resetHideControlsTimeout()}
        >
            <div className={`absolute inset-0 transition-opacity duration-500 ${showFullscreenControls ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute top-6 right-6 pointer-events-auto">
                  <button 
                    onClick={() => {
                        setShowFullscreenControls(false);
                    }}
                    className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 hover:border-cyan-500/50 transition-all shadow-xl"
                  >
                      <Icon name="EyeOff" size={14} />
                      Ocultar Menú
                  </button>
              </div>
            
              {showFullscreenControls && (
                  <div className="pointer-events-auto w-full max-w-5xl max-h-[85vh] overflow-y-auto custom-scrollbar bg-black/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] mx-4 my-auto flex flex-col gap-6" onMouseMove={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                          <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-sm flex items-center gap-3">
                              <Icon name="Settings" size={18} />
                              Ajustes de Cimática y Frecuencias
                          </h3>
                          <button 
                              onClick={toggleFullscreen}
                              className="text-slate-400 hover:text-white px-4 py-2 bg-white/5 hover:bg-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-colors"
                          >
                              Salir de Pantalla Completa
                          </button>
                      </div>

                      {/* Cymatics Configs duplicated for Fullscreen */}
                      <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                        <h4 className="text-purple-400 font-bold uppercase tracking-wider text-[10px] mb-4">Configuración Cimática</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                          {renderNumberInput("Partículas", config.particleCount, 'particleCount', 100, 5000, 100)}
                          {renderNumberInput("Sensibilidad", config.sensitivity, 'sensitivity', 0.1, 5.0, 0.1)}
                          {renderNumberInput("Resolución", config.plateMeshResolution, 'plateMeshResolution', 10, 100, 5)}
                          {renderNumberInput("Gravedad", config.gravity, 'gravity', 0, 0.5, 0.01)}
                          {renderNumberInput("Tamaño Partícula", config.particleSize, 'particleSize', 0.5, 10.0, 0.5)}
                          
                          <div>
                            <span className="text-slate-400 uppercase font-bold tracking-wider block mb-2 text-[10px]">Rotación Automática</span>
                            <button onClick={() => setConfig(prev => ({ ...prev, autoRotate: !prev.autoRotate }))} className={`w-full py-2 rounded-lg border text-[10px] uppercase font-bold transition-colors ${config.autoRotate ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-black/40 text-slate-400 border-white/10'}`}>
                              {config.autoRotate ? 'Activo' : 'Inactivo'}
                            </button>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase font-bold tracking-wider block mb-2 text-[10px]">Visibilidad</span>
                            <button onClick={() => setConfig(prev => ({ ...prev, showParticles: !prev.showParticles }))} className={`w-full py-2 rounded-lg border text-[10px] uppercase font-bold transition-colors ${config.showParticles ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'bg-black/40 text-slate-400 border-white/10'}`}>
                              {config.showParticles ? 'Ocultar' : 'Mostrar'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Oscillator Controls */}
                      <div>
                        <h4 className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-4">Generadores Activos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {allOscillators.map(osc => (
                                <OscillatorControls 
                                    key={osc.id} 
                                    osc={osc} 
                                    update={onUpdateOscillator || (() => {})} 
                                    remove={onRemoveOscillator || (() => {})}
                                    analyser={getOscillatorAnalyser ? getOscillatorAnalyser(osc.id) : null}
                                />
                            ))}
                        </div>
                      </div>
                  </div>
              )}
            </div>
        </div>
      )}
    </div>
  );
};

export default CymaticsVisualizer3D;
