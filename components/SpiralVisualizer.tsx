import React, { useRef, useEffect, useState } from 'react';
import { SpiralConfig, CymaticsPalette, SacredGeometryMode, OscillatorState } from '../types';
import Icon from './Icon';
import * as GeometryDrawers from './geometryDrawers';
import OscillatorControls from './OscillatorControls';

interface Props {
  analyser: AnalyserNode | null;
  activeOscillators?: OscillatorState[];
  allOscillators?: OscillatorState[];
  onUpdateOscillator?: (id: string, updates: Partial<OscillatorState>) => void;
  onRemoveOscillator?: (id: string) => void;
  getOscillatorAnalyser?: (id: string) => AnalyserNode | null;
  isMasterPlaying?: boolean;
  height?: number;
}

const DEFAULT_CONFIG: SpiralConfig = {
  k: 1.002,
  psi: 2.399,
  z0_r: 0,
  z0_i: 0,
  iter: 10000,
  zoom: 0.001,
  speedMultiplier: 1.0,
  thickness: 2.0,
  opacity: 0.8,
  unifiedMode: true,
  colorPalette: 'holographic',
  depthMode: false,
  depthSpeed: 1.0,
  baseFrequencyRef: 432,
  angleMultiplier: 1.0,
  waveStyle: false,
  waveAmplitude: 0.5,
  infiniteDepth: true,
  illumination: 0.0,
  autoPilot: true,
  sacredGeometryEnabled: false,
  sacredGeometryModes: [],
  bgMode: 'solid'
};

export const SpiralVisualizer: React.FC<Props> = ({ analyser, activeOscillators = [], allOscillators = [], onUpdateOscillator, onRemoveOscillator, getOscillatorAnalyser, isMasterPlaying = true, height = 450 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [config, setConfig] = useState<SpiralConfig>(DEFAULT_CONFIG);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
  };

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

  const activeOscillatorsRef = useRef(activeOscillators);
  const configRef = useRef(config);
  const analyserRef = useRef(analyser);
  const isMasterPlayingRef = useRef(isMasterPlaying);

  useEffect(() => { activeOscillatorsRef.current = activeOscillators; }, [activeOscillators]);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { analyserRef.current = analyser; }, [analyser]);
  useEffect(() => { isMasterPlayingRef.current = isMasterPlaying; }, [isMasterPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let fftData = new Uint8Array(256);
    let time = 0;
    
    let smoothedVol = 0;
    let smoothedFreq = 432;

    const render = () => {
      const currentAnalyser = analyserRef.current;
      const currentConfig = configRef.current;
      const currentOscillators = activeOscillatorsRef.current || [];
      
      if (currentAnalyser && currentAnalyser.frequencyBinCount !== fftData.length) {
         fftData = new Uint8Array(currentAnalyser.frequencyBinCount);
      }

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      let audioAmp = 0;
      let hasPlaying = false;
      
      for (const o of currentOscillators) {
        if (o.isPlaying) hasPlaying = true;
      }

      if (currentAnalyser && hasPlaying) {
        currentAnalyser.getByteFrequencyData(fftData);
        let sum = 0;
        for (let i = 0; i < 64; i++) sum += fftData[i];
        audioAmp = (sum / 64 / 255);
      }

      const playingOscillators = currentOscillators.filter(o => o.isPlaying);
      const activeFreqs = currentOscillators.map(o => o.frequency); // Use ALL current oscillators for geometry
      const primaryFreq = activeFreqs.length > 0 ? activeFreqs[0] : 432;
      
      if (!hasPlaying) {
        smoothedVol = 0;
      } else {
        smoothedVol += (audioAmp - smoothedVol) * 0.1;
      }
      smoothedFreq += (primaryFreq - smoothedFreq) * 0.1;

      // Solo avanza el tiempo (rotación/movimiento) si el reproductor principal está activo y hay frecuencias
      if (isMasterPlayingRef.current && hasPlaying) {
        time += 0.02 * currentConfig.speedMultiplier;
      }

      // Background
      if (currentConfig.bgMode === 'solid') {
        ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
        ctx.fillRect(0, 0, width, height);
      } else if (currentConfig.bgMode === 'gradient') {
        const grd = ctx.createLinearGradient(0, 0, width, height);
        grd.addColorStop(0, `rgba(10, 0, 20, 0.2)`);
        grd.addColorStop(1, `rgba(0, 20, 40, 0.2)`);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);
      } else {
         ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
         ctx.fillRect(0, 0, width, height);
      }

      const colors = getPaletteColors(currentConfig.colorPalette);
      const iter = currentConfig.iter;
      const baseZoom = currentConfig.zoom;
      const minDim = Math.min(width, height);
      
      // Relación Matemática: El ángulo fractal (psi) es exactamente la frecuencia en grados,
      // creando patrones cimáticos cerrados y perfectos para frecuencias armónicas o enteras.
      const drawSpiral = (osc: OscillatorState | null, freq: number, vol: number, baseColor: string, isUnified: boolean) => {
        let k = currentConfig.k * (osc && osc.crestValleyRatio ? osc.crestValleyRatio : 1.0);
        
        if (currentConfig.autoPilot && hasPlaying) {
          k = 1.002 + (Math.sin(time * 0.1) * 0.005) + (vol * 0.005);
        }
        
        let angleMult = currentConfig.angleMultiplier * (osc && osc.dutyCycle ? 1.0 + osc.dutyCycle : 1.0);
        const psi = (freq * Math.PI / 180) * angleMult;

        const rotReal = Math.cos(psi);
        const rotImag = Math.sin(psi);

        let z0_r = currentConfig.z0_r !== 0 ? currentConfig.z0_r : 1.0 + (vol * 0.5);
        let z0_i = currentConfig.z0_i !== 0 ? currentConfig.z0_i : 0.0;

        let zReal = z0_r;
        let zImag = z0_i;
        
        const loopStart = currentConfig.infiniteDepth ? -iter : 0;
        const loopEnd = iter;

        if (currentConfig.infiniteDepth) {
           const startMag = Math.pow(k, -iter);
           const startAngle = -iter * psi;
           const rotStartR = Math.cos(startAngle);
           const rotStartI = Math.sin(startAngle);
           
           zReal = (z0_r * rotStartR - z0_i * rotStartI) * startMag;
           zImag = (z0_r * rotStartI + z0_i * rotStartR) * startMag;
        }

        ctx.save();
        ctx.translate(cx, cy);

        let currentZoom = baseZoom * minDim;
        
        if (currentConfig.infiniteDepth) {
            const safePsi = Math.abs(psi) > 0.0001 ? psi : 0.0001;
            const iterPerTurn = 2 * Math.PI / Math.abs(safePsi);
            const growthPerTurn = Math.pow(k, iterPerTurn);
            
            const zoomPhase = (time * currentConfig.depthSpeed * 0.1) % 1;
            
            const continuousScale = Math.pow(growthPerTurn, zoomPhase);
            // Rotacion para contrarrestar el escalado y crear el ciclo perfecto
            const rotationOffset = 2 * Math.PI * zoomPhase * Math.sign(safePsi);

            ctx.scale(continuousScale, continuousScale);
            ctx.rotate(rotationOffset);
        } else if (currentConfig.depthMode) {
            const zF = 1 + (time * currentConfig.depthSpeed) % 15;
            ctx.scale(zF, zF);
        }

        ctx.beginPath();
        let prevX = zReal * currentZoom;
        let prevY = -zImag * currentZoom;
        ctx.moveTo(prevX, prevY);

        for (let n = loopStart; n < loopEnd; n++) {
          const zrK = zReal * k;
          const ziK = zImag * k;

          let nextReal = (zrK * rotReal - ziK * rotImag);
          let nextImag = (zrK * rotImag + ziK * rotReal);

          zReal = nextReal;
          zImag = nextImag;

          let px = zReal * currentZoom;
          let py = -zImag * currentZoom;

          if (currentConfig.waveStyle) {
             const wavePhase = n * 0.1 + time * (freq / 100);
             const dx = zReal;
             const dy = -zImag;
             const mag = Math.sqrt(dx*dx + dy*dy) || 1;
             const nx = dy / mag;
             const ny = -dx / mag;
             const waveOffset = Math.sin(wavePhase) * currentConfig.waveAmplitude * 20 * (vol + 0.2);
             px += nx * waveOffset;
             py += ny * waveOffset;
          }

          if (!Number.isFinite(px) || !Number.isFinite(py) || Math.abs(px) > width*5 || Math.abs(py) > height*5) {
            if (n > 0) break; // Only break if we are zooming way past the screen outwards
          }

          ctx.lineTo(px, py);
        }

        if (isUnified) {
          const gradient = ctx.createLinearGradient(-width/2, -height/2, width/2, height/2);
          gradient.addColorStop(0, colors[0]);
          gradient.addColorStop(1, colors[1]);
          ctx.strokeStyle = gradient;
          ctx.shadowColor = colors[0];
        } else {
          ctx.strokeStyle = baseColor;
          ctx.shadowColor = baseColor;
        }
        
        ctx.lineWidth = (currentConfig.thickness + (vol * 3)) * Math.max(0.01, currentConfig.illumination);
        // Si illuminacion es 0, desactivamos glow
        if (currentConfig.illumination > 0) {
           ctx.shadowBlur = (10 + vol * 30) * currentConfig.illumination;
        } else {
           ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = currentConfig.opacity;
        ctx.stroke();
        
        ctx.restore();
      };

      if (currentOscillators.length === 0) {
        // Render a default spiral responding to smoothed background frequency
        drawSpiral(null, smoothedFreq, smoothedVol, colors[0], true);
      } else {
        // Ondas Independientes separadas vs Unidas (usando todos los osciladores, no solo los que suenan)
        const independentOscs = currentOscillators.filter(o => o.isIndependent);
        const unifiedOscs = currentOscillators.filter(o => !o.isIndependent);

        if (unifiedOscs.length > 0) {
           const avgFreq = unifiedOscs.reduce((a, b) => a + b.frequency, 0) / unifiedOscs.length;
           // Volume applies to line glow/amplitude. If not playing, use 0.
           const maxVol = unifiedOscs.some(o => o.isPlaying) ? smoothedVol : 0;
           drawSpiral(null, avgFreq, maxVol, colors[0], true);
        }

        independentOscs.forEach((osc, idx) => {
           const vol = osc.isPlaying ? smoothedVol * osc.volume : 0;
           drawSpiral(osc, osc.frequency, vol, osc.color || colors[idx % colors.length], false);
        });
      }

      // Sacred Geometries
      if (currentConfig.sacredGeometryEnabled && currentConfig.sacredGeometryModes.length > 0) {
         ctx.globalAlpha = currentConfig.opacity * 0.5;
         const baseHue = time * 20 % 360;
         const r = minDim * 0.4 + (smoothedVol * minDim * 0.1);
         currentConfig.sacredGeometryModes.forEach(mode => {
            if (mode === 'flowerOfLife') GeometryDrawers.drawFlowerOfLife(ctx, cx, cy, r / 3, time, 0.5, 0.1, baseHue, 100, 50, smoothedVol, currentConfig.thickness);
            if (mode === 'metatron') GeometryDrawers.drawMetatron(ctx, cx, cy, r, time, 0.5, 0.1, baseHue, 100, 50, smoothedVol, currentConfig.thickness);
            if (mode === 'torus') GeometryDrawers.drawTorus(ctx, cx, cy, r, time, 0.5, 0.1, baseHue, 100, 50, smoothedVol, currentConfig.thickness);
         });
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
      animFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameId);
  }, []); // Empty dependency array, relies on refs to avoid recreation

  // Helper render for input rows
  const renderNumberInput = (
    label: string, 
    value: number, 
    key: keyof SpiralConfig, 
    min: number, 
    max: number, 
    step: number, 
    disabled: boolean = false
  ) => {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-slate-400 uppercase font-bold tracking-wider block">{label}</span>
        <div className="flex items-center gap-2">
          <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            disabled={disabled} 
            onChange={(e) => setConfig(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))} 
            className={`flex-grow h-1 bg-slate-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full ${disabled ? 'opacity-50' : 'cursor-pointer'}`} 
          />
          <input 
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => setConfig(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
            className={`w-14 bg-black/60 border border-white/10 rounded px-1 py-0.5 text-[10px] text-white text-center focus:outline-none focus:border-cyan-500 ${disabled ? 'opacity-50' : ''}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col h-full group ${
      isFullscreen 
        ? "bg-black" 
        : "rounded-3xl border border-cyan-500/30 bg-black/80 backdrop-blur-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(34,211,238,0.05)] overflow-hidden"
    }`}>
      {!isFullscreen && <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>}
      
      {/* Header and Basic Controls */}
      {!isFullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 relative z-10 border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Icon name="Aperture" size={22} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          </div>
          <div>
            <h3 className="text-lg font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-pink-300">
              Espiral Holográfica
            </h3>
            <p className="text-[10px] text-purple-200/70 font-bold uppercase tracking-widest">
              Geometría Cuántica Fractal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
           <button 
             onClick={resetToDefaults}
             className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/40"
             title="Restablecer Ajustes"
           >
             Restablecer
           </button>
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
           <button 
             onClick={handleFullscreen}
             className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-colors"
             title="Pantalla Completa"
           >
             <Icon name="Maximize2" size={16} />
           </button>
        </div>
      </div>
      )}

      {/* Advanced Controls */}
      {!isFullscreen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-4 relative z-10 bg-black/40 p-4 rounded-2xl border border-white/5 text-[9px] shrink-0">
        
        {renderNumberInput("Iteraciones", config.iter, 'iter', 100, 10000, 100)}
        {renderNumberInput("Zoom Inicial", config.zoom, 'zoom', 0.001, 0.5, 0.001)}
        {renderNumberInput("Vel. Profundidad", config.depthSpeed, 'depthSpeed', 0.1, 5.0, 0.1, !config.depthMode)}
        {renderNumberInput("Multiplicador Ángulo", config.angleMultiplier, 'angleMultiplier', 0.1, 10.0, 0.1, config.autoPilot)}
        {renderNumberInput("Factor Crecimiento (K)", config.k, 'k', 0.5, 1.5, 0.001, config.autoPilot)}
        
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1 text-emerald-400">Túnel Infinito (Continuo)</span>
          <button 
            onClick={() => {
              setConfig(prev => {
                const nextVal = !prev.infiniteDepth;
                return { 
                  ...prev, 
                  infiniteDepth: nextVal,
                  iter: nextVal ? 10000 : 1000,
                  zoom: nextVal ? 0.001 : 0.05
                };
              });
            }} 
            className={`w-full py-1.5 rounded border text-[10px] uppercase font-bold transition-colors ${config.infiniteDepth ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-black/40 text-slate-400 border-white/10'}`}>
            {config.infiniteDepth ? 'Activo' : 'Inactivo'}
          </button>
        </div>
        
        <div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1 text-pink-400">Trazo Ondular</span>
          <button onClick={() => setConfig(prev => ({ ...prev, waveStyle: !prev.waveStyle }))} className={`w-full py-1.5 rounded border text-[10px] uppercase font-bold transition-colors ${config.waveStyle ? 'bg-pink-500/20 text-pink-300 border-pink-500/50' : 'bg-black/40 text-slate-400 border-white/10'}`}>
            {config.waveStyle ? 'Ondas' : 'Liso'}
          </button>
        </div>
        
        {renderNumberInput("Amplitud Onda", config.waveAmplitude, 'waveAmplitude', 0.1, 2.0, 0.1, !config.waveStyle)}
        {renderNumberInput("Iluminación", config.illumination, 'illumination', 0, 3.0, 0.1)}
        {renderNumberInput("Grosor Línea", config.thickness, 'thickness', 0.5, 10.0, 0.5)}

      </div>
      )}
      
      {/* Geometría Sagrada Controls */}
      {!isFullscreen && (
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
      )}

      <div 
        className={`relative w-full overflow-hidden border border-white/10 bg-black/90 flex-grow resize-y ${
          isFullscreen ? 'h-full border-none' : 'rounded-2xl shadow-[inset_0_0_40px_rgba(0,0,0,0.9)]'
        }`}
        style={isFullscreen ? {} : { minHeight: '300px', height: '100%' }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {!isFullscreen && (
          <>
            <div className="absolute bottom-3 left-4 text-[9px] text-slate-500 font-mono tracking-widest uppercase pointer-events-none bg-black/60 px-3 py-1.5 rounded-lg border border-white/5">
              Ecuación: Z_n+1 = Z_n * (k * e^iψ) | Ψ = f * (π/180) * AngleMultiplier
            </div>
            
            {/* Resize handle icon */}
            <div className="absolute bottom-0 right-0 p-2 text-white/20 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 15 21 21 15 21"></polyline><polyline points="9 3 3 3 3 9"></polyline></svg>
            </div>
          </>
        )}
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
                              Ajustes de Espiral y Frecuencias
                          </h3>
                          <button 
                              onClick={handleFullscreen}
                              className="text-slate-400 hover:text-white px-4 py-2 bg-white/5 hover:bg-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-colors"
                          >
                              Salir de Pantalla Completa
                          </button>
                      </div>

                      {/* Spiral Advanced Configs duplicated for Fullscreen */}
                      <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                        <h4 className="text-purple-400 font-bold uppercase tracking-wider text-[10px] mb-4">Configuración del Espiral</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                          {renderNumberInput("Iteraciones", config.iter, 'iter', 100, 10000, 100)}
                          {renderNumberInput("Zoom Inicial", config.zoom, 'zoom', 0.001, 0.5, 0.001)}
                          {renderNumberInput("Vel. Profund.", config.depthSpeed, 'depthSpeed', 0.1, 5.0, 0.1, !config.depthMode)}
                          {renderNumberInput("Mult. Ángulo", config.angleMultiplier, 'angleMultiplier', 0.1, 10.0, 0.1, config.autoPilot)}
                          {renderNumberInput("Factor K", config.k, 'k', 0.5, 1.5, 0.001, config.autoPilot)}
                          
                          <div>
                            <span className="text-slate-400 uppercase font-bold tracking-wider block mb-2 text-[10px] text-emerald-400">Túnel Infinito</span>
                            <button 
                              onClick={() => {
                                setConfig(prev => {
                                  const nextVal = !prev.infiniteDepth;
                                  return { 
                                    ...prev, 
                                    infiniteDepth: nextVal,
                                    iter: nextVal ? 10000 : 1000,
                                    zoom: nextVal ? 0.001 : 0.05
                                  };
                                });
                              }} 
                              className={`w-full py-2 rounded-lg border text-[10px] uppercase font-bold transition-colors ${config.infiniteDepth ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-black/40 text-slate-400 border-white/10'}`}>
                              {config.infiniteDepth ? 'Activo' : 'Inactivo'}
                            </button>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase font-bold tracking-wider block mb-2 text-[10px] text-pink-400">Trazo Ondular</span>
                            <button onClick={() => setConfig(prev => ({ ...prev, waveStyle: !prev.waveStyle }))} className={`w-full py-2 rounded-lg border text-[10px] uppercase font-bold transition-colors ${config.waveStyle ? 'bg-pink-500/20 text-pink-300 border-pink-500/50' : 'bg-black/40 text-slate-400 border-white/10'}`}>
                              {config.waveStyle ? 'Ondas' : 'Liso'}
                            </button>
                          </div>
                          {renderNumberInput("Amp. Onda", config.waveAmplitude, 'waveAmplitude', 0.1, 2.0, 0.1, !config.waveStyle)}
                          {renderNumberInput("Iluminación", config.illumination, 'illumination', 0, 3.0, 0.1)}
                          {renderNumberInput("Grosor Línea", config.thickness, 'thickness', 0.5, 10.0, 0.5)}
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

export default SpiralVisualizer;
