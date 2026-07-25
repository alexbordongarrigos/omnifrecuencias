import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { GeminiWavePreset, OscillatorState } from '../types';
import { generateWavePresetWithGemini } from '../services/geminiService';
import Icon from './Icon';

interface Props {
  onClose: () => void;
  onApplyPreset: (oscillators: Partial<OscillatorState>[]) => void;
}

export const AIGeneratorModal: React.FC<Props> = ({ onClose, onApplyPreset }) => {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [presetResult, setPresetResult] = useState<GeminiWavePreset | null>(null);

  // Pool completo de sugerencias creativas avanzadas (incluyendo orquesta de 21 frecuencias)
  const promptPool = [
    "Sinergia armónica completa de 21 frecuencias Vórtex Tesla 3-6-9 y Solfeggio en espiral 3D",
    "Frecuencia 528Hz Mi para reparación de ADN con matriz biogénica de Rife y pulso Schumann 7.83Hz",
    "Secuencia neuroacústica multinivel de 21 capas (Epsilon 0.5Hz, Delta, Theta, Alfa, Beta y Gamma 40Hz)",
    "Resonancia 963Hz Vórtex Pineal con activación de los 7 Chakras y 8 armónicos de alineación",
    "Desintoxicación masiva de Bio-resonancia Rife de 12 órganos con armónicos de purificación",
    "Alineación arqueoacústica de 21 tonos: Malta 111Hz, Giza 432Hz, Chartres 304Hz y Stonehenge 117.5Hz",
    "Armonización de Coherencia Cardíaca 341.33Hz (Chakra Fa) con espiral Fibonacci de 144Hz a 987Hz",
    "Alquimia Solar-Lunar con 126.22Hz (Sol), 210.42Hz (Luna) y 8 octavas de polaridad Yin/Yang",
    "Onda infra-baja Epsilon a 0.5Hz para inducción a sueño profundo y regeneración somática",
    "Tono OM de la Tierra a 136.10Hz con elevación de crestas y modulación de fase angular a 180°"
  ];

  const [currentPrompts, setCurrentPrompts] = useState<string[]>(promptPool.slice(0, 4));

  const handleRefreshPrompts = () => {
    const shuffled = [...promptPool].sort(() => Math.random() - 0.5);
    setCurrentPrompts(shuffled.slice(0, 4));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setPresetResult(null);

    try {
      const result = await generateWavePresetWithGemini(prompt, apiKey);
      setPresetResult(result);
    } catch (err) {
      console.error("AI Generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in w-screen h-screen overflow-hidden">
      
      {/* Absolute Screen Backdrop Click to Close */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>

      {/* Main Centered Card Container */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] my-auto overflow-y-auto custom-scrollbar bg-black/95 border border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_90px_rgba(34,211,238,0.3),inset_0_0_30px_rgba(34,211,238,0.05)]">
        
        {/* Background glow elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Icon name="Zap" size={24} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </div>
            <div>
              <h2 className="text-xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300">
                Generador IA Matemático-Cuántico (Hasta 21 Frecuencias)
              </h2>
              <p className="text-[10px] text-cyan-200/70 font-bold uppercase tracking-widest">
                Google Gemini API & Síntesis Armónica
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-cyan-500/30 transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Form Input */}
        <form onSubmit={handleGenerate} className="space-y-4 relative z-10 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-300 mb-2">
              Describe la Frecuencia o Estado Acústico Deseado:
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Orquesta completa de 21 frecuencias Vórtex 3-6-9 de Tesla con modulación de valles y paneo en espiral 3D..."
              className="w-full bg-black/60 border border-white/15 rounded-2xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:bg-black/90 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all font-light"
            />
          </div>

          {/* Quick Prompts Suggestions Header & Refresh Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Sugerencias Creativas (Incluye 21 Osciladores):
              </span>
              <button
                type="button"
                onClick={handleRefreshPrompts}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-[10px] text-cyan-300 font-bold uppercase tracking-wider transition-all"
              >
                <Icon name="RefreshCw" size={12} />
                Reiniciar Sugerencias
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentPrompts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 text-[10px] text-slate-300 hover:text-cyan-200 transition-colors text-left truncate max-w-[290px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Optional API Key toggle */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-[10px] text-slate-400 hover:text-cyan-300 underline font-bold uppercase tracking-wider"
            >
              {showApiKeyInput ? "Ocultar Clave API" : "Configurar Clave API Gemini (Opcional)"}
            </button>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 border ${
                isLoading || !prompt.trim()
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  : 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border-cyan-500/50 shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] hover:scale-105'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></span>
                  Sintetizando {prompt.includes("21") || prompt.includes("orquesta") ? "21 Frecuencias" : "Armónicos"}...
                </>
              ) : (
                <>
                  <Icon name="Zap" size={16} className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  Generar con IA (Hasta 21 Frecuencias)
                </>
              )}
            </button>
          </div>

          {showApiKeyInput && (
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs">
              <input
                type="password"
                placeholder="Pega tu clave de API Google Gemini (AI Studio)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[9px] text-slate-500 mt-1 block">
                Si no especificas una clave, se utilizará la clave de entorno o el sintetizador matemático local.
              </span>
            </div>
          )}
        </form>

        {/* Generated Result Preview */}
        {presetResult && (
          <div className="relative z-10 bg-black/80 border border-cyan-500/30 rounded-2xl p-5 space-y-4 animate-fade-in shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-display font-bold text-cyan-200">{presetResult.title}</h3>
                <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mt-0.5">
                  Concepto: {presetResult.mathematicalConcept}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-400 font-bold uppercase tracking-wider font-mono">
                {presetResult.oscillators.length} Osciladores Armónicos
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-light">{presetResult.explanation}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {presetResult.oscillators.map((osc, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: osc.color || '#38bdf8' }}></span>
                    <span className="font-bold text-white text-[11px] truncate">{osc.name}</span>
                  </div>
                  <div className="text-right font-mono text-[11px] text-cyan-300 font-bold shrink-0">
                    {osc.frequency} Hz
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  onApplyPreset(presetResult.oscillators);
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] text-xs font-bold uppercase tracking-widest transition-all"
              >
                <Icon name="Zap" size={16} />
                Aplicar Sinergia ({presetResult.oscillators.length} Frecuencias) al Generador
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AIGeneratorModal;
