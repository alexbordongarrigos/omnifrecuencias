
import React, { useMemo, useState } from 'react';
import { useAudio } from '../hooks/useAudio';
import { useFileSystem } from '../hooks/useFileSystem';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { PresetContent, OscillatorState } from '../types';
import OscillatorControls from './OscillatorControls';
import Visualizer, { VisualizerSource } from './Visualizer';
import CymaticsVisualizer3D from './CymaticsVisualizer3D';
import SpiralVisualizer from './SpiralVisualizer';
import AIGeneratorModal from './AIGeneratorModal';
import Icon from './Icon';
import FileExplorer from './FileExplorer';

interface Props {
  audio: ReturnType<typeof useAudio>;
  onStartLiveSession?: (preset: PresetContent) => void;
}

// Helper to get brainwave name
const getWaveName = (hz: number) => {
    if (hz < 0.5) return 'Epsilon';
    if (hz < 4) return 'Delta';
    if (hz < 8) return 'Theta';
    if (hz < 12) return 'Alfa';
    if (hz < 30) return 'Beta';
    if (hz < 100) return 'Gamma';
    return 'Lambda';
};

interface ResonanceResult {
    id: string;
    type: 'binaural' | 'beat';
    hz: string;
    waveName: string;
    sourceA: string;
    sourceB: string;
}

const Generator: React.FC<Props> = ({ audio, onStartLiveSession }) => {
  const { oscillators, addOscillator, removeOscillator, updateOscillator, setAllOscillators, getCombinedAnalyser, getOscillatorAnalyser } = audio;
  
  // Undo/Redo Hook (Control+Z / Cmd+Z)
  const history = useUndoRedo(oscillators, setAllOscillators);

  // File System Integration
  const fs = useFileSystem();
  const [showExplorer, setShowExplorer] = useState(false);
  const [explorerMode, setExplorerMode] = useState<'save' | 'load'>('save');

  // AI Generator Modal state
  const [showAIModal, setShowAIModal] = useState(false);

  // Visualizer Tab State ('2d' | '3d' | 'spiral')
  const [vizTab, setVizTab] = useState<'2d' | '3d' | 'spiral'>('2d');

  // Wrapped addOscillator to capture history
  const handleAddOscillator = (initialState?: Partial<OscillatorState>) => {
    history.pushState(oscillators);
    addOscillator(initialState);
  };

  // Wrapped removeOscillator to capture history
  const handleRemoveOscillator = (id: string) => {
    history.pushState(oscillators);
    removeOscillator(id);
  };

  // Wrapped updateOscillator to capture history
  const handleUpdateOscillator = (id: string, changes: Partial<OscillatorState>) => {
    history.pushState(oscillators);
    updateOscillator(id, changes);
  };

  // Apply AI Generated Preset
  const handleApplyAIPreset = (aiOscillators: Partial<OscillatorState>[]) => {
    history.pushState(oscillators);
    // Clear existing
    oscillators.forEach(osc => removeOscillator(osc.id));
    // Add new
    setTimeout(() => {
      aiOscillators.forEach(oscParams => {
        addOscillator(oscParams);
      });
    }, 50);
  };

  // Logic to remove all and load new or mix
  const loadPreset = (preset: PresetContent, mix: boolean = false) => {
    history.pushState(oscillators);
    if (!mix) {
      // Clear existing
      oscillators.forEach(osc => removeOscillator(osc.id));
    }
    // Add new
    setTimeout(() => {
        preset.oscillators.forEach(osc => {
             const { id, ...props } = osc;
             addOscillator(props);
        });
    }, mix ? 0 : 50);
  };

  const handleExport = () => {
    const data = fs.exportSystem();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          if (ev.target?.result) {
              const success = fs.importSystem(ev.target.result as string);
              if (success) alert('Backup importado correctamente. Las carpetas se han fusionado.');
              else alert('Error al importar el archivo.');
          }
      };
      reader.readAsText(file);
  };

  // Advanced Resonance Calculation (Combinatorial Analysis)
  const resonanceResults = useMemo(() => {
    const active = oscillators.filter(o => o.isPlaying && !o.isIndependent);
    const results: ResonanceResult[] = [];

    for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
            const oscA = active[i];
            const oscB = active[j];
            
            const diff = Math.abs(oscA.frequency - oscB.frequency);

            if (diff > 0.1 && diff < 120) {
                const waveName = getWaveName(diff);
                const hzFormatted = diff.toFixed(2);

                results.push({
                    id: `beat-${oscA.id}-${oscB.id}`,
                    type: 'beat',
                    hz: hzFormatted,
                    waveName,
                    sourceA: oscA.name || 'Freq A',
                    sourceB: oscB.name || 'Freq B'
                });

                const isOpposite = (oscA.panX <= -0.1 && oscB.panX >= 0.1) || (oscA.panX >= 0.1 && oscB.panX <= -0.1);
                
                if (isOpposite) {
                     results.push({
                        id: `bin-${oscA.id}-${oscB.id}`,
                        type: 'binaural',
                        hz: hzFormatted,
                        waveName,
                        sourceA: oscA.name || 'Freq A',
                        sourceB: oscB.name || 'Freq B'
                    });
                }
            }
        }
    }

    return results;
  }, [oscillators]);

  // Construct Visualizer Sources
  const visualizerSources: VisualizerSource[] = useMemo(() => {
    const sources: VisualizerSource[] = [];
    
    const combined = getCombinedAnalyser();
    if (combined) {
        sources.push({ analyser: combined, color: '#475569' });
    }

    oscillators.forEach(osc => {
        if (osc.isPlaying && osc.isIndependent) {
            const analyser = getOscillatorAnalyser(osc.id);
            if (analyser) {
                sources.push({ analyser, color: osc.color });
            }
        }
    });
    
    if (sources.length === 1 && sources[0].color === '#475569') {
        sources[0].color = '#22d3ee';
    }

    return sources;
  }, [oscillators, getCombinedAnalyser, getOscillatorAnalyser]);

  const activeFreqsList = useMemo(() => {
    return oscillators.filter(o => o.isPlaying).map(o => o.frequency);
  }, [oscillators]);

  return (
    <div className="animate-fade-in space-y-6 pb-24">
      
      {/* --- Toolbar --- */}
      <div className="flex flex-col items-center justify-center gap-6 bg-black/60 border border-white/10 p-6 rounded-3xl backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
         <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
         
         <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-5 relative z-10 w-full">
            <button 
                onClick={audio.toggleMasterPlay}
                className={`group relative overflow-hidden flex items-center justify-center w-full sm:w-16 h-16 rounded-2xl transition-all duration-500 border-2 shadow-[0_0_20px_rgba(0,0,0,0.5),inset_0_0_10px_rgba(255,255,255,0.1)] hover:-translate-y-1 ${audio.isPlaying ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.6),inset_0_0_15px_rgba(0,0,0,0.2)] scale-105' : 'bg-black/80 text-cyan-400 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-950/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]'}`}
                title={audio.isPlaying ? "Pausar Todo" : "Reproducir Todo"}
            >
                <Icon name={audio.isPlaying ? 'Pause' : 'Play'} size={32} className={audio.isPlaying ? '' : 'ml-1'} />
                <span className="sm:hidden ml-3 font-bold uppercase tracking-widest">{audio.isPlaying ? "Pausar Todo" : "Reproducir Todo"}</span>
            </button>

            {/* Undo / Redo buttons (Control+Z) */}
            <div className="flex items-center gap-2 bg-black/50 p-2 rounded-2xl border border-white/10 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
              <button
                onClick={history.undo}
                disabled={!history.canUndo}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  history.canUndo
                    ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'text-slate-600 border border-transparent cursor-not-allowed opacity-50'
                }`}
                title="Deshacer (Ctrl+Z / Cmd+Z)"
              >
                <Icon name="RotateCcw" size={16} />
                Deshacer
              </button>

              <button
                onClick={history.redo}
                disabled={!history.canRedo}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  history.canRedo
                    ? 'bg-purple-950/50 text-purple-300 border border-purple-500/40 hover:bg-purple-900/60 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'text-slate-600 border border-transparent cursor-not-allowed opacity-50'
                }`}
                title="Rehacer (Ctrl+Y / Cmd+Shift+Z)"
              >
                <Icon name="RotateCw" size={16} />
                Rehacer
              </button>
            </div>

            {/* AI Generator Trigger button */}
            <button 
                onClick={() => setShowAIModal(true)}
                className="group relative overflow-hidden flex items-center justify-center gap-3 px-6 py-4 w-full sm:w-auto bg-gradient-to-r from-cyan-950/60 via-purple-950/60 to-pink-950/60 hover:from-cyan-900/80 hover:to-purple-900/80 text-cyan-100 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all duration-500 border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.3),inset_0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_45px_rgba(34,211,238,0.5)] hover:-translate-y-1"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/20 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 rounded-2xl"></div>
                <Icon name="Zap" size={20} className="text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" /> 
                <span className="whitespace-nowrap">Generar con IA</span>
            </button>

            <button 
                onClick={() => { setExplorerMode('save'); setShowExplorer(true); }}
                className="group relative overflow-hidden flex items-center justify-center gap-3 px-6 py-4 w-full sm:w-auto bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all duration-500 border-2 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1),inset_0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:-translate-y-1 hover:border-cyan-400/50"
            >
                <Icon name="Save" size={20} className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> 
                <span className="whitespace-nowrap">Guardar Preset</span>
            </button>
            <button 
                onClick={() => { setExplorerMode('load'); setShowExplorer(true); }}
                className="group relative overflow-hidden flex items-center justify-center gap-3 px-6 py-4 w-full sm:w-auto bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all duration-500 border-2 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1),inset_0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:-translate-y-1 hover:border-purple-400/50"
            >
                <Icon name="Folder" size={20} className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" /> 
                <span className="whitespace-nowrap">Cargar Preset</span>
            </button>
            <button 
                onClick={() => {
                   if (onStartLiveSession) {
                       onStartLiveSession({
                           oscillators,
                           dateCreated: Date.now(),
                           description: 'Sesión en vivo de Omni-Frecuencias',
                       });
                   }
                }}
                className="group relative overflow-hidden flex items-center justify-center gap-3 px-6 py-4 w-full sm:w-auto bg-red-950/40 hover:bg-red-900/60 text-red-200 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all duration-500 border-2 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1),inset_0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:-translate-y-1 hover:border-red-400/50"
            >
                <Icon name="Radio" size={20} className="drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> 
                <span className="whitespace-nowrap">Transmitir en Vivo</span>
            </button>
         </div>

         <div className="flex items-center justify-center gap-6 pt-5 border-t border-white/10 w-full max-w-md relative z-10">
             <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition-colors border border-transparent hover:border-cyan-500/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]" title="Exportar Backup v.7">
                 <Icon name="Download" size={14} className="text-cyan-500/70" /> Exportar v.7
             </button>
             <label className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-purple-500/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]" title="Importar Backup">
                 <Icon name="Upload" size={14} className="text-purple-500/70" /> Importar
                 <input type="file" accept=".json" onChange={handleImport} className="hidden" />
             </label>
         </div>
      </div>

      {/* --- AI Generator Modal --- */}
      {showAIModal && (
        <AIGeneratorModal
          onClose={() => setShowAIModal(false)}
          onApplyPreset={handleApplyAIPreset}
        />
      )}

      {/* --- File Explorer Modal --- */}
      {showExplorer && (
          <FileExplorer 
             mode={explorerMode}
             fs={fs}
             onClose={() => setShowExplorer(false)}
             onFileSelect={loadPreset}
             currentConfig={{
                 oscillators,
                 dateCreated: Date.now(),
                 description: 'Configuración generada'
             }}
          />
      )}

      {/* Master Visualizer & Info Header */}
      <div className="relative p-6 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-stretch justify-between mb-6 gap-6 border-b border-white/10 pb-5 relative z-10">
            
            {/* Header Title & Visualizer Mode Switcher */}
            <div className="flex flex-col gap-3 min-w-[220px]">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 shadow-[inset_0_0_15px_rgba(34,211,238,0.2)]">
                        <Icon name="Activity" size={22} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    </div>
                    <h2 className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 tracking-wide">
                        Resonancia Maestra
                    </h2>
                </div>

                {/* 2D / 3D Cymatics Selector Tabs */}
                <div className="flex items-center gap-2 bg-black/50 p-1 rounded-xl border border-white/10 w-fit">
                  <button
                    onClick={() => setVizTab('2d')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      vizTab === '2d'
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    <Icon name="Activity" size={14} /> Osciloscopio 2D
                  </button>
                  <button
                    onClick={() => setVizTab('3d')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      vizTab === '3d'
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    <Icon name="Orbit" size={14} /> Cimática 3D
                  </button>
                  <button
                    onClick={() => setVizTab('spiral')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      vizTab === 'spiral'
                        ? 'bg-pink-950/60 text-pink-300 border border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    <Icon name="Aperture" size={14} /> Espiral Fractal
                  </button>
                </div>
            </div>

            {/* Results Display */}
            <div className="flex-1 w-full bg-black/60 rounded-2xl border border-white/10 p-4 max-h-40 overflow-y-auto shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] custom-scrollbar relative">
                {resonanceResults.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 font-bold uppercase tracking-widest italic opacity-70 gap-2">
                        <Icon name="Waves" size={24} className="opacity-50" />
                        <span>No se detectan interacciones resonantes activas.</span>
                     </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                        {resonanceResults.map(res => (
                            <div key={res.id} className={`
                                flex items-center justify-between px-4 py-3 rounded-xl border text-xs relative overflow-hidden group
                                ${res.type === 'binaural' 
                                    ? 'bg-purple-950/40 border-purple-500/30 shadow-[inset_0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
                                    : 'bg-amber-950/40 border-amber-500/30 shadow-[inset_0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]'}
                                transition-all duration-300 hover:-translate-y-0.5
                            `}>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`p-2 rounded-lg ${res.type === 'binaural' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                                        <Icon name={res.type === 'binaural' ? 'Brain' : 'Zap'} size={18} className={`${res.type === 'binaural' ? 'text-purple-400' : 'text-amber-400'}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`font-black uppercase tracking-[0.2em] text-[10px] ${res.type === 'binaural' ? 'text-purple-300' : 'text-amber-300'}`}>
                                            {res.type === 'binaural' ? 'Binaural' : 'Batido'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">
                                            {res.sourceA} <span className="text-slate-600 mx-1">+</span> {res.sourceB}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right relative z-10">
                                    <div className="font-display font-black text-white text-lg tracking-wider">{res.hz} <span className="text-xs text-slate-400 font-bold">Hz</span></div>
                                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5 text-slate-400">
                                        {res.waveName}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        
        {/* Render Selected Visualizer (2D Canvas or 3D Cymatics) */}
        {vizTab === '2d' ? (
          <div className="h-80 w-full bg-black/80 rounded-2xl border border-white/10 overflow-hidden relative shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] z-10 group/viz">
              <Visualizer sources={visualizerSources} height={320} />
              <div className="absolute top-4 right-4 flex flex-col gap-2 items-end pointer-events-none z-20">
                  <div className="flex items-center gap-3 px-4 py-2 bg-black/60 rounded-xl text-[10px] text-slate-300 border border-white/10 backdrop-blur-md">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-slate-400"></div>
                      <span className="font-bold uppercase tracking-widest">Onda Combinada</span>
                  </div>
                  {oscillators.filter(o => o.isPlaying && o.isIndependent).map(osc => (
                      <div key={osc.id} className="flex items-center gap-3 px-4 py-2 bg-black/60 rounded-xl text-[10px] text-white border border-white/10 backdrop-blur-md">
                          <div className="w-2.5 h-2.5 rounded-full border border-white/50" style={{ background: osc.color }}></div>
                          <span className="font-bold uppercase tracking-widest" style={{ color: osc.color }}>{osc.name}</span>
                      </div>
                  ))}
              </div>
          </div>
        ) : vizTab === '3d' ? (
          <CymaticsVisualizer3D
            analyser={getCombinedAnalyser()}
            activeFrequencies={activeFreqsList}
            height={380}
          />
        ) : (
          <SpiralVisualizer
            analyser={getCombinedAnalyser()}
            activeOscillators={oscillators.filter(o => o.isPlaying)}
            height={380}
          />
        )}
      </div>

      {/* Global Controls */}
      {oscillators.length > 0 && (
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl backdrop-blur-xl flex flex-wrap items-center justify-center gap-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="flex items-center gap-3 text-sm text-cyan-200 font-bold uppercase tracking-widest relative z-10">
                <Icon name="Settings" size={18} className="text-cyan-400" />
                Ajustes Globales
            </div>
            
            <div className="flex items-center gap-3 relative z-10 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Volumen</span>
                <input 
                    type="range" min="0" max="1" step="0.01" defaultValue="0.5"
                    onChange={(e) => audio.setGlobalVolume(parseFloat(e.target.value))}
                    className="w-32 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full"
                />
            </div>

            <button 
                onClick={() => {
                  history.pushState(oscillators);
                  audio.centerAllPositions();
                }}
                className="relative group flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/50 rounded-xl text-slate-300 hover:text-cyan-100 transition-all duration-300 z-10"
            >
                Centrar Posiciones
            </button>

            <div className="flex items-center gap-3 relative z-10 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Onda</span>
                <select 
                    onChange={(e) => {
                        if (e.target.value) {
                            history.pushState(oscillators);
                            audio.setGlobalWaveType(e.target.value as any);
                            e.target.value = "";
                        }
                    }}
                    className="bg-black/50 border border-white/10 rounded-lg text-xs text-cyan-200 font-bold uppercase tracking-wider px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                    <option value="">(Cambiar todas)</option>
                    <option value="sine">Senoidal</option>
                    <option value="square">Cuadrada</option>
                    <option value="sawtooth">Diente de sierra</option>
                    <option value="triangle">Triangular</option>
                </select>
            </div>
        </div>
      )}

      {/* Oscillator List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {oscillators.map(osc => (
            <OscillatorControls 
                key={osc.id} 
                osc={osc} 
                update={handleUpdateOscillator} 
                remove={handleRemoveOscillator}
                analyser={getOscillatorAnalyser(osc.id)}
            />
        ))}

        <button 
            onClick={() => handleAddOscillator()}
            className="group relative min-h-[400px] rounded-2xl border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 bg-black/20 hover:bg-cyan-950/30 flex flex-col items-center justify-center gap-6 transition-all duration-500 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.2)]"
        >
            <div className="relative w-24 h-24 rounded-full bg-cyan-950/50 border border-cyan-500/30 group-hover:border-cyan-400 flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                <Icon name="Zap" className="text-cyan-500/50 group-hover:text-cyan-300 w-10 h-10 transition-colors duration-500" />
            </div>
            
            <div className="text-center relative z-10">
                <h3 className="text-xl font-display font-black text-cyan-500/50 group-hover:text-cyan-200 tracking-widest uppercase mb-2 transition-colors duration-500">Añadir Frecuencia</h3>
                <p className="text-xs text-slate-500 group-hover:text-cyan-400/70 uppercase tracking-widest font-bold transition-colors duration-500">Nueva capa armónica</p>
            </div>
        </button>
      </div>

    </div>
  );
};

export default Generator;
