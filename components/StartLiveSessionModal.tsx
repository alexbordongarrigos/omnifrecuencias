import React, { useState } from 'react';
import Icon from './Icon';
import { PresetContent } from '../types';
import { createLiveSession, getCurrentStarseedUser, StarseedUser } from '../services/starseedAuth';

interface Props {
  preset: PresetContent;
  onClose: () => void;
  onSessionStarted: (session: any) => void;
}

const StartLiveSessionModal: React.FC<Props> = ({ preset, onClose, onSessionStarted }) => {
  const [presetName, setPresetName] = useState('Sesión de Entonación');
  const [isPublic, setIsPublic] = useState(true);
  const [allowOpenModifications, setAllowOpenModifications] = useState(false);
  const [useGlobalWebRTC, setUseGlobalWebRTC] = useState(true);
  const [useLocalMesh, setUseLocalMesh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await getCurrentStarseedUser();
      if (!user && useGlobalWebRTC) {
        throw new Error("Debes iniciar sesión con Starseed OS para transmitir en la red global.");
      }
      
      if (!useGlobalWebRTC && !useLocalMesh) {
         throw new Error("Debes seleccionar al menos un modo de transmisión (Global o Mesh Local).");
      }
      
      let session = null;
      
      // If Global WebRTC is enabled, create session in Supabase DB
      if (useGlobalWebRTC && user) {
          session = await createLiveSession(
            preset,
            user.id,
            user.displayName,
            presetName,
            isPublic,
            allowOpenModifications
          );
      } else {
          // Off-grid mode / Mesh only. Create a local mock session object.
          session = {
              id: crypto.randomUUID(),
              presetName: presetName,
              hostId: user ? user.id : 'local-host',
              hostName: user ? user.displayName : 'Explorador Mesh',
              presetContent: preset,
              isPublic: false,
              allowOpenModifications: allowOpenModifications,
              createdAt: new Date().toISOString()
          };
      }
      
      onSessionStarted({ ...session, useGlobalWebRTC, useLocalMesh });
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-black/90 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <Icon name="Radio" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Transmitir en Vivo</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleStart} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre de la Sesión</label>
            <input 
              type="text" 
              required
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl">
            <input 
              type="checkbox" 
              id="isPublic" 
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              className="w-5 h-5 accent-red-500"
            />
            <label htmlFor="isPublic" className="flex-1 cursor-pointer">
              <span className="block text-sm font-bold text-white">Sesión Pública</span>
              <span className="block text-xs text-slate-400">Aparecerá en la pestaña "Entonación" para toda la comunidad.</span>
            </label>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl">
            <input 
              type="checkbox" 
              id="allowModifications" 
              checked={allowOpenModifications}
              onChange={e => setAllowOpenModifications(e.target.checked)}
              className="w-5 h-5 accent-red-500"
            />
            <label htmlFor="allowModifications" className="flex-1 cursor-pointer">
              <span className="block text-sm font-bold text-white">Modificaciones Abiertas</span>
              <span className="block text-xs text-slate-400">Permitir a los participantes modificar los parámetros de las frecuencias.</span>
            </label>
          </div>

          <div className="pt-2 border-t border-white/10 mt-4">
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Topología de Red</label>
              
              <div className="space-y-3">
                {/* Global WebRTC Option */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${useGlobalWebRTC ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
                  <div className="mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={useGlobalWebRTC}
                      onChange={(e) => setUseGlobalWebRTC(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-800"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <Icon name="Globe" size={14} className={useGlobalWebRTC ? 'text-cyan-400' : 'text-slate-500'} />
                      Red Global (Internet)
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Sincronización mundial por WebRTC a través de Starseed OS.</div>
                  </div>
                </label>

                {/* Local Mesh Option */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${useLocalMesh ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-black/30 hover:border-white/20'}`}>
                  <div className="mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={useLocalMesh}
                      onChange={(e) => setUseLocalMesh(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <Icon name="RadioReceiver" size={14} className={useLocalMesh ? 'text-green-400' : 'text-slate-500'} />
                      Mesh P2P Local (Radio)
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Conecta tu antena para sincronización ultrabaja off-grid.</div>
                  </div>
                </label>
              </div>
          </div>

          {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] flex justify-center items-center gap-2"
          >
            {loading ? <Icon name="Loader" className="animate-spin" /> : <><Icon name="Play" size={18} /> Iniciar Transmisión</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StartLiveSessionModal;
