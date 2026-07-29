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
  
  // New Metadata fields
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fixedPermissions, setFixedPermissions] = useState(false);

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
      
      // Metadata payload
      const metadata = {
        description: description.trim() || undefined,
        cover_url: coverUrl.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        fixedPermissions
      };

      // If Global WebRTC is enabled, create session in Supabase DB
      if (useGlobalWebRTC && user) {
          session = await createLiveSession(
            preset,
            user.id,
            user.displayName,
            presetName,
            isPublic,
            allowOpenModifications,
            metadata
          );
      } else {
          // Off-grid mode / Mesh only. Create a local mock session object.
          session = {
              id: crypto.randomUUID(),
              presetName: presetName,
              hostId: user ? user.id : 'local-host',
              hostName: user ? user.displayName : 'Explorador Mesh',
              presetContent: { ...preset, sessionMetadata: metadata },
              isPublic: false,
              allowOpenModifications: allowOpenModifications,
              createdAt: Date.now(),
              ...metadata
          };
      }
      
      onSessionStarted({ ...session, useGlobalWebRTC, useLocalMesh });
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión.");
    }
    setLoading(false);
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
                required
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                placeholder="Ej. Meditación Pineal Global"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe el propósito de esta sincronización..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500/50 transition-colors h-20 resize-none custom-scrollbar text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">URL Portada (Opcional)</label>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={e => setCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500/50 transition-colors text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">URL Avatar (Opcional)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-fuchsia-500/50 transition-colors text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/30 border border-white/10 p-3 rounded-xl hover:border-white/20 transition-colors">
              <input 
                type="checkbox" 
                id="isPublic" 
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-gray-800"
              />
              <label htmlFor="isPublic" className="flex-1 cursor-pointer">
                <span className="block text-sm font-bold text-white">Sesión Pública</span>
                <span className="block text-xs text-slate-400">Aparecerá en la pestaña "Entonación" para toda la comunidad.</span>
              </label>
            </div>

            <div className="flex items-center gap-3 bg-black/30 border border-white/10 p-3 rounded-xl hover:border-white/20 transition-colors">
              <input 
                type="checkbox" 
                id="allowModifications" 
                checked={allowOpenModifications}
                onChange={e => setAllowOpenModifications(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-gray-800"
              />
              <label htmlFor="allowModifications" className="flex-1 cursor-pointer">
                <span className="block text-sm font-bold text-white">Modificaciones Abiertas</span>
                <span className="block text-xs text-slate-400">Permitir a los participantes modificar los parámetros de las frecuencias.</span>
              </label>
            </div>

            <div className="flex items-center gap-3 bg-fuchsia-900/10 border border-fuchsia-500/20 p-3 rounded-xl hover:border-fuchsia-500/40 transition-colors">
              <input 
                type="checkbox" 
                id="fixedPermissions" 
                checked={fixedPermissions}
                onChange={e => setFixedPermissions(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-gray-800"
              />
              <label htmlFor="fixedPermissions" className="flex-1 cursor-pointer">
                <span className="block text-sm font-bold text-fuchsia-300">Persistencia de Host</span>
                <span className="block text-xs text-slate-400">Si sales de la sesión, los permisos y controles de editor permanecerán con la configuración actual.</span>
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
                      Red Global (Internet / WebRTC)
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Conecta con usuarios de todo el mundo mediante los servidores centrales de Starseed OS. Requiere conexión a internet.</div>
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
                      Mesh P2P Local (Antena Meshtastic)
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Detecta nodos físicos en tu área para sincronización de ultra-baja latencia sin necesidad de internet (Off-grid).</div>
                  </div>
                </label>
              </div>
              {!useGlobalWebRTC && !useLocalMesh && (
                <div className="mt-3 text-xs text-red-400 flex items-center gap-1">
                  <Icon name="AlertTriangle" size={12} />
                  Debes seleccionar al menos un canal de transmisión.
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm font-bold text-center mb-4">{error}</p>}

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
              disabled={loading || (!useGlobalWebRTC && !useLocalMesh)}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(192,38,211,0.3)] flex justify-center items-center gap-2"
            >
              {loading ? (
                <Icon name="Loader" className="animate-spin" />
              ) : (
                <>
                  <Icon name="Radio" size={16} className={(!useGlobalWebRTC && !useLocalMesh) ? '' : 'animate-pulse'} />
                  Iniciar Sincronización
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartLiveSessionModal;
