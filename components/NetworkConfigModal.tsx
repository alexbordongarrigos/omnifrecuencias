import React, { useState } from 'react';
import Icon from './Icon';

interface NetworkConfigModalProps {
  onClose: () => void;
  onStart: (config: { useGlobalWebRTC: boolean; useLocalMesh: boolean; sessionName: string }) => void;
}

const NetworkConfigModal: React.FC<NetworkConfigModalProps> = ({ onClose, onStart }) => {
  const [sessionName, setSessionName] = useState('');
  const [useGlobal, setUseGlobal] = useState(true);
  const [useMesh, setUseMesh] = useState(true);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!useGlobal && !useMesh) return;
    
    onStart({
      useGlobalWebRTC: useGlobal,
      useLocalMesh: useMesh,
      sessionName: sessionName.trim() || 'Sincronización Cuántica'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
        
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="Radio" size={18} className="text-fuchsia-400" />
            Transmitir Vibras (Red Híbrida)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleStart} className="p-6">
          <p className="text-sm text-slate-400 mb-6">
            Configura los canales de transmisión cuántica. Puedes operar de manera híbrida o completamente off-grid.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre de la Sesión</label>
              <input
                type="text"
                value={sessionName}
                onChange={e => setSessionName(e.target.value)}
                placeholder="Ej. Meditación Pineal Global"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                autoFocus
              />
            </div>
            
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Topología de Red</label>
              
              <div className="space-y-3">
                {/* Global WebRTC Option */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${useGlobal ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
                  <div className="mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={useGlobal}
                      onChange={(e) => setUseGlobal(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-800"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <Icon name="Globe" size={14} className={useGlobal ? 'text-cyan-400' : 'text-slate-500'} />
                      Red Global (Internet / WebRTC)
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Conecta con usuarios de todo el mundo mediante los servidores centrales de Starseed OS. Requiere conexión a internet.</div>
                  </div>
                </label>

                {/* Local Mesh Option */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${useMesh ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
                  <div className="mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={useMesh}
                      onChange={(e) => setUseMesh(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <Icon name="RadioReceiver" size={14} className={useMesh ? 'text-green-400' : 'text-slate-500'} />
                      Mesh P2P Local (Antena Meshtastic)
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Detecta nodos físicos en tu área para sincronización de ultra-baja latencia sin necesidad de internet (Off-grid).</div>
                  </div>
                </label>
              </div>
              
              {!useGlobal && !useMesh && (
                <div className="mt-3 text-xs text-red-400 flex items-center gap-1">
                  <Icon name="AlertTriangle" size={12} />
                  Debes seleccionar al menos un canal de transmisión.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!useGlobal && !useMesh}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(192,38,211,0.3)] flex justify-center items-center gap-2"
            >
              <Icon name="Radio" size={16} className={(!useGlobal && !useMesh) ? '' : 'animate-pulse'} />
              Iniciar Sincronización
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NetworkConfigModal;
