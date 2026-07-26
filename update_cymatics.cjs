const fs = require('fs');

let content = fs.readFileSync('components/CymaticsVisualizer3D.tsx', 'utf8');

// 1. Add isFullscreen state and containerRef
content = content.replace(
  "const canvasRef = useRef<HTMLCanvasElement | null>(null);",
  `const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) setShowControls(true);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };`
);

// 2. Add Reset function
content = content.replace(
  "const [isRotating, setIsRotating] = useState(true);",
  `const resetConfig = () => {
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
  
  const [isRotating, setIsRotating] = useState(true);`
);

// 3. Update container div to use containerRef and full screen styles
content = content.replace(
  `<div className="relative rounded-3xl border border-cyan-500/30 bg-black/80 backdrop-blur-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(34,211,238,0.05)] overflow-hidden">`,
  `<div ref={containerRef} className={\`relative \${isFullscreen ? 'fixed inset-0 z-[100] rounded-none bg-black flex flex-col p-0' : 'rounded-3xl border border-cyan-500/30 bg-black/80 backdrop-blur-2xl p-6'} shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(34,211,238,0.05)] overflow-hidden transition-all duration-500\`}>`
);

// 4. Update Header controls to include Fullscreen and Reset buttons
content = content.replace(
  `{/* Header controls */}`,
  `{isFullscreen && !showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute top-4 right-4 z-50 p-3 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded-full text-cyan-300 backdrop-blur-md transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-pulse"
        >
          <Icon name="Settings" size={24} />
        </button>
      )}

      {/* Header controls */}
      <div className={\`flex flex-wrap items-center justify-between gap-4 relative z-10 border-b border-white/10 pb-4 \${isFullscreen && !showControls ? 'hidden' : 'mb-4'} \${isFullscreen ? 'px-6 pt-6' : ''}\`}>`
);
content = content.replace(
  `<div className="flex flex-wrap items-center justify-between gap-4 mb-4 relative z-10 border-b border-white/10 pb-4">`,
  ``
);

// Add Fullscreen and Reset buttons inside Toolbar controls
content = content.replace(
  `{/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-3">`,
  `{/* Toolbar controls */}
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
          )}`
);

// 5. Update sliders to include numerical inputs
content = content.replace(
  `<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 relative z-10 bg-black/40 p-4 rounded-2xl border border-white/5 text-[10px]">`,
  `<div className={\`grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10 bg-black/40 p-4 rounded-2xl border border-white/5 text-[10px] \${isFullscreen && !showControls ? 'hidden' : 'mb-4'} \${isFullscreen ? 'mx-6' : ''}\`}>`
);

// Slider 1: Gravedad
content = content.replace(
  `<div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Gravedad ({config.gravity.toFixed(2)})</span>
          <input
            type="range" min="0.01" max="0.2" step="0.01" value={config.gravity}
            onChange={(e) => setConfig(prev => ({ ...prev, gravity: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`,
  `<div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Gravedad</span>
             <input type="number" min="0.01" max="0.2" step="0.01" value={config.gravity} onChange={(e) => setConfig(prev => ({ ...prev, gravity: parseFloat(e.target.value) || 0.05 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="0.01" max="0.2" step="0.01" value={config.gravity}
            onChange={(e) => setConfig(prev => ({ ...prev, gravity: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`
);

// Slider 2: Peso Particulas
content = content.replace(
  `<div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Peso Partículas ({(config.particleWeight * 100).toFixed(0)}%)</span>
          <input
            type="range" min="0.80" max="0.99" step="0.01" value={config.particleWeight}
            onChange={(e) => setConfig(prev => ({ ...prev, particleWeight: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`,
  `<div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Peso Part. (%)</span>
             <input type="number" min="80" max="99" step="1" value={Math.round(config.particleWeight * 100)} onChange={(e) => setConfig(prev => ({ ...prev, particleWeight: (parseFloat(e.target.value) || 92) / 100 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="0.80" max="0.99" step="0.01" value={config.particleWeight}
            onChange={(e) => setConfig(prev => ({ ...prev, particleWeight: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`
);

// Slider 3: Tamaño particulas
content = content.replace(
  `<div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Tamaño Partículas ({config.particleSize.toFixed(1)})</span>
          <input
            type="range" min="0.5" max="5.0" step="0.1" value={config.particleSize}
            onChange={(e) => setConfig(prev => ({ ...prev, particleSize: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`,
  `<div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Tamaño Part.</span>
             <input type="number" min="0.5" max="5.0" step="0.1" value={config.particleSize} onChange={(e) => setConfig(prev => ({ ...prev, particleSize: parseFloat(e.target.value) || 2.0 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="0.5" max="5.0" step="0.1" value={config.particleSize}
            onChange={(e) => setConfig(prev => ({ ...prev, particleSize: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`
);

// Slider 4: Densidad Flujo
content = content.replace(
  `<div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Densidad Flujo ({(config.particleDensity * 100).toFixed(0)}%)</span>
          <input
            type="range" min="0.1" max="1.0" step="0.1" value={config.particleDensity}
            onChange={(e) => setConfig(prev => ({ ...prev, particleDensity: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`,
  `<div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Densidad Flujo (%)</span>
             <input type="number" min="10" max="100" step="10" value={Math.round(config.particleDensity * 100)} onChange={(e) => setConfig(prev => ({ ...prev, particleDensity: (parseFloat(e.target.value) || 80) / 100 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="0.1" max="1.0" step="0.1" value={config.particleDensity}
            onChange={(e) => setConfig(prev => ({ ...prev, particleDensity: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`
);

// Slider 5: Amplitud
content = content.replace(
  `<div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Amplitud ({config.vibrationAmplitude.toFixed(1)}x)</span>
          <input
            type="range" min="0.1" max="3.0" step="0.1" value={config.vibrationAmplitude}
            onChange={(e) => setConfig(prev => ({ ...prev, vibrationAmplitude: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`,
  `<div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Amplitud</span>
             <input type="number" min="0.1" max="3.0" step="0.1" value={config.vibrationAmplitude} onChange={(e) => setConfig(prev => ({ ...prev, vibrationAmplitude: parseFloat(e.target.value) || 1.0 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="0.1" max="3.0" step="0.1" value={config.vibrationAmplitude}
            onChange={(e) => setConfig(prev => ({ ...prev, vibrationAmplitude: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`
);

// Slider 6: N
content = content.replace(
  `<div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Factor Modal N ({config.n})</span>
          <input
            type="range" min="1" max="12" value={config.n}
            onChange={(e) => setConfig(prev => ({ ...prev, n: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`,
  `<div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Factor Modal N</span>
             <input type="number" min="1" max="12" step="1" value={config.n} onChange={(e) => setConfig(prev => ({ ...prev, n: parseInt(e.target.value) || 3 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="1" max="12" value={config.n}
            onChange={(e) => setConfig(prev => ({ ...prev, n: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`
);

// Slider 7: M
content = content.replace(
  `<div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Factor Modal M ({config.m})</span>
          <input
            type="range" min="1" max="12" value={config.m}
            onChange={(e) => setConfig(prev => ({ ...prev, m: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`,
  `<div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Factor Modal M</span>
             <input type="number" min="1" max="12" step="1" value={config.m} onChange={(e) => setConfig(prev => ({ ...prev, m: parseInt(e.target.value) || 5 }))} className="w-12 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="1" max="12" value={config.m}
            onChange={(e) => setConfig(prev => ({ ...prev, m: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`
);

// Slider 8: Particulas
content = content.replace(
  `<div>
          <span className="text-slate-400 uppercase font-bold tracking-wider block mb-1">Partículas ({config.particleCount})</span>
          <input
            type="range" min="400" max="3000" step="200" value={config.particleCount}
            onChange={(e) => setConfig(prev => ({ ...prev, particleCount: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-pink-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`,
  `<div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-slate-400 uppercase font-bold tracking-wider">Partículas</span>
             <input type="number" min="400" max="3000" step="100" value={config.particleCount} onChange={(e) => setConfig(prev => ({ ...prev, particleCount: parseInt(e.target.value) || 1200 }))} className="w-14 bg-black border border-white/20 text-white rounded px-1 text-right focus:border-cyan-400 outline-none" />
          </div>
          <input
            type="range" min="400" max="3000" step="200" value={config.particleCount}
            onChange={(e) => setConfig(prev => ({ ...prev, particleCount: parseInt(e.target.value) }))}
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-pink-400 [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>`
);

// Canvas div resize handling
content = content.replace(
  `className="relative w-full rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 bg-black/90 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] resize-y"`,
  `className={\`relative w-full rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 bg-black/90 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] \${isFullscreen ? 'flex-1 rounded-none resize-none' : 'resize'}\`}`
);
content = content.replace(
  `style={{ minHeight: '300px', height: \`\${height}px\` }}`,
  `style={{ minHeight: '300px', height: isFullscreen ? '100%' : \`\${height}px\` }}`
);

fs.writeFileSync('components/CymaticsVisualizer3D.tsx', content);
