import React, { useRef, useEffect, useState } from 'react';
import { SpiralConfig, CymaticsPalette, SacredGeometryMode } from '../types';
import Icon from './Icon';
import * as GeometryDrawers from './geometryDrawers';

interface Props {
  analyser: AnalyserNode | null;
  activeFrequencies?: number[];
  height?: number;
}

export const SpiralVisualizer: React.FC<Props> = ({ analyser, activeFrequencies = [432], height = 450 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [config, setConfig] = useState<SpiralConfig>({
    k: 1.002,
    psi: 2.399,
    z0_r: 0,
    z0_i: 0,
    iter: 1000,
    zoom: 0.05,
    speedMultiplier: 1.0,
    thickness: 2.0,
    opacity: 0.8,
    unifiedMode: true,
    colorPalette: 'holographic',
    autoPilot: true,
    sacredGeometryEnabled: false,
    sacredGeometryModes: [],
    bgMode: 'solid'
  });

  const getPaletteColors = (palette: CymaticsPalette) => {
    switch (palette) {
      case 'quantum': return ['#3b82f6', '#60a5fa'];
      case 'neon': return ['#f472b6', '#ec4899'];
      case 'aurora': return ['#34d399', '#10b981'];
      case 'gold': return ['#fbbf24', '#f59e0b'];
      case 'holographic':
      default: return ['#22d3ee', '#a855f7'];
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    const fftData = new Uint8Array(analyser ? analyser.frequencyBinCount : 256);
    let time = 0;
    
    let smoothedVol = 0;
    let smoothedFreq = 432;

    const render = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      let audioAmp = 0;
      if (analyser) {
        analyser.getByteFrequencyData(fftData);
        let sum = 0;
        for (let i = 0; i < 64; i++) sum += fftData[i];
        audioAmp = (sum / 64 / 255);
      }

      const primaryFreq = activeFrequencies[0] || 432;
      smoothedVol += (audioAmp - smoothedVol) * 0.1;
      smoothedFreq += (primaryFreq - smoothedFreq) * 0.1;

      time += 0.02 * config.speedMultiplier;

      // Background
      if (config.bgMode === 'solid') {
        ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
        ctx.fillRect(0, 0, width, height);
      } else if (config.bgMode === 'gradient') {
        const grd = ctx.createLinearGradient(0, 0, width, height);
        grd.addColorStop(0, `rgba(10, 0, 20, 0.2)`);
        grd.addColorStop(1, `rgba(0, 20, 40, 0.2)`);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);
      } else {
         ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
         ctx.fillRect(0, 0, width, height);
      }

      const colors = getPaletteColors(config.colorPalette);
      
      // AutoPilot
      let k = config.k;
      let psi = config.psi;
      if (config.autoPilot) {
        k = 1.002 + (Math.sin(time * 0.1) * 0.005) + (smoothedVol * 0.005);
        psi = (smoothedFreq * 0.01) + (smoothedVol * 0.1) + time * 0.2;
      }

      const iter = config.iter;
      const minDim = Math.min(width, height);
      const zoom = minDim * config.zoom;

      const rotReal = Math.cos(psi);
      const rotImag = Math.sin(psi);

      let zReal = config.z0_r !== 0 ? config.z0_r : 1.0 + (smoothedVol * 0.5);
      let zImag = config.z0_i !== 0 ? config.z0_i : 0.0;

      ctx.beginPath();
      let prevX = cx + zReal * zoom;
      let prevY = cy - zImag * zoom;
      ctx.moveTo(prevX, prevY);

      for (let n = 0; n < iter; n++) {
        const zrK = zReal * k;
        const ziK = zImag * k;

        let nextReal = (zrK * rotReal - ziK * rotImag);
        let nextImag = (zrK * rotImag + ziK * rotReal);

        zReal = nextReal;
        zImag = nextImag;

        let px = cx + zReal * zoom;
        let py = cy - zImag * zoom;

        if (!Number.isFinite(px) || !Number.isFinite(py) || Math.abs(px - cx) > width || Math.abs(py - cy) > height) {
          break;
        }

        ctx.lineTo(px, py);
      }

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = config.thickness + (smoothedVol * 3);
      ctx.globalAlpha = config.opacity;
      
      ctx.shadowBlur = 10 + smoothedVol * 20;
      ctx.shadowColor = colors[0];
      ctx.stroke();

      // Sacred Geometries
      if (config.sacredGeometryEnabled && config.sacredGeometryModes.length > 0) {
         ctx.globalAlpha = config.opacity * 0.5;
         const baseHue = time * 20 % 360;
         const r = minDim * 0.4 + (smoothedVol * minDim * 0.1);
         config.sacredGeometryModes.forEach(mode => {
            if (mode === 'flowerOfLife') GeometryDrawers.drawFlowerOfLife(ctx, cx, cy, r / 3, time, 0.5, 0.1, baseHue, 100, 50, smoothedVol, config.thickness);
            if (mode === 'metatron') GeometryDrawers.drawMetatron(ctx, cx, cy, r, time, 0.5, 0.1, baseHue, 100, 50, smoothedVol, config.thickness);
            if (mode === 'torus') GeometryDrawers.drawTorus(ctx, cx, cy, r, time, 0.5, 0.1, baseHue, 100, 50, smoothedVol, config.thickness);
         });
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
      animFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameId);
  }, [analyser, activeFrequencies, config]);

  return (
    <div className="relative rounded-3xl border border-cyan-500/30 bg-black/80 backdrop-blur-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(34,211,238,0.05)] overflow-hidden flex flex-col h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
      
      {/* Header and Basic Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 relative z-10 border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Icon name="Aperture" size={22} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          </div>
          <div>
            <h3 className="text-lg font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-pink-300">
              Espiral Holográfica Audiomorphic
            </h3>
            <p className="text-[10px] text-purple-200/70 font-bold uppercase tracking-widest">
              Geometría Cuántica de Variable Compleja
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => setConfig(prev => ({ ...prev, autoPilot: !prev.autoPilot }))}
             className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${config.autoPilot ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50' : 'bg-black/60 text-slate-400 border border-white/10'}`}
           >
             Auto Piloto {config.autoPilot ? 'ON' : 'OFF'}
           </button>
           <select
             value={config.colorPalette}
             onChange={(e) => setConfig(prev => ({ ...prev, colorPalette: e.target.value as CymaticsPalette }))}
             className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold text-purple-200 uppercase tracking-wider focus:outline-none focus:border-purple-400 cursor-pointer"
           >
             <option value="holographic">Holográfico</option>
             <option value="quantum">Quantum Blue</option>
             <option value="neon">Neon Magenta</option>
             <option value="aurora">Aurora Green</option>
             <option value="gold">Gold Alquimia</option>
           </select>
        </div>
      </div>

      {/* Advanced Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 relative z-10 bg-black/40 p-3 rounded-2xl border border-white/5 text-[9px] shrink-0">
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Iteraciones ({config.iter})</span>
          <input type="range" min="100" max="10000" step="100" value={config.iter} onChange={(e) => setConfig(prev => ({ ...prev, iter: parseInt(e.target.value) }))} className="w-full h-1 bg-slate-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer" />
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Factor K ({config.k.toFixed(3)})</span>
          <input type="range" min="0.5" max="1.5" step="0.001" value={config.k} disabled={config.autoPilot} onChange={(e) => setConfig(prev => ({ ...prev, k: parseFloat(e.target.value) }))} className={`w-full h-1 bg-slate-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:rounded-full ${config.autoPilot ? 'opacity-50' : 'cursor-pointer'}`} />
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Ángulo Psi ({config.psi.toFixed(2)})</span>
          <input type="range" min="0" max={Math.PI * 2} step="0.01" value={config.psi} disabled={config.autoPilot} onChange={(e) => setConfig(prev => ({ ...prev, psi: parseFloat(e.target.value) }))} className={`w-full h-1 bg-slate-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-pink-400 [&::-webkit-slider-thumb]:rounded-full ${config.autoPilot ? 'opacity-50' : 'cursor-pointer'}`} />
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Zoom ({(config.zoom * 100).toFixed(0)}%)</span>
          <input type="range" min="0.001" max="0.5" step="0.001" value={config.zoom} onChange={(e) => setConfig(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))} className="w-full h-1 bg-slate-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer" />
        </div>
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Velocidad ({config.speedMultiplier.toFixed(1)}x)</span>
          <input type="range" min="0.1" max="3.0" step="0.1" value={config.speedMultiplier} onChange={(e) => setConfig(prev => ({ ...prev, speedMultiplier: parseFloat(e.target.value) }))} className="w-full h-1 bg-slate-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer" />
        </div>
      </div>
      
      {/* Geometría Sagrada Controls */}
      <div className="flex gap-2 mb-4 relative z-10 shrink-0">
          <button 
             onClick={() => setConfig(prev => ({ ...prev, sacredGeometryEnabled: !prev.sacredGeometryEnabled, sacredGeometryModes: !prev.sacredGeometryEnabled ? ['flowerOfLife'] : [] }))}
             className={`px-3 py-1 text-[10px] rounded-lg font-bold uppercase transition-colors ${config.sacredGeometryEnabled ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50' : 'bg-black/60 text-slate-400 border border-white/10'}`}
           >
             Geometría Sagrada
           </button>
           
           {config.sacredGeometryEnabled && (
              <select
                 value={config.sacredGeometryModes[0] || ''}
                 onChange={(e) => setConfig(prev => ({ ...prev, sacredGeometryModes: [e.target.value as SacredGeometryMode] }))}
                 className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-cyan-200 uppercase focus:outline-none"
              >
                 <option value="flowerOfLife">Flor de la Vida</option>
                 <option value="metatron">Cubo de Metatrón</option>
                 <option value="torus">Toroide Cósmico</option>
              </select>
           )}
      </div>

      <div 
        className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/90 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] flex-grow"
        style={{ minHeight: '300px', height: '100%' }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        <div className="absolute bottom-3 left-4 text-[9px] text-slate-500 font-mono tracking-widest uppercase pointer-events-none bg-black/60 px-3 py-1.5 rounded-lg border border-white/5">
          Ecuación Compleja: Z_n+1 = Z_n * (k * e^iψ) | k={config.k.toFixed(3)} ψ={config.psi.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default SpiralVisualizer;
