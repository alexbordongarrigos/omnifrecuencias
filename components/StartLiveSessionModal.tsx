import React, { useState } from 'react';
import Icon from './Icon';
import { PresetContent, CATEGORIES } from '../types';
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
  const [networkMode, setNetworkMode] = useState<'mixed' | 'mesh' | 'server'>('mixed');
  
  // New Metadata fields
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]?.id || 'sueño');
  const [fixedPermissions, setFixedPermissions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await getCurrentStarseedUser();
      const useGlobalWebRTC = networkMode === 'mixed' || networkMode === 'server';
      const useLocalMesh = networkMode === 'mixed' || networkMode === 'mesh';
      
      if (!user && useGlobalWebRTC) {
        throw new Error("Debes iniciar sesión con Starseed OS para transmitir en la red global.");
      }      
      let session = null;
      
      // Metadata payload
      const metadata = {
        description: description.trim() || undefined,
        cover_url: coverUrl.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        category,
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
      
      onSessionStarted({ ...session, useGlobalWebRTC, useLocalMesh, networkMode });
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
        
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon name="Radio" size={18} className="text-fuchsia-400" />
            Transmitir Vibras (Red Híbrida)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleStart} className="p-6 overflow-y-auto custom-scrollbar">
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
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoría</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500/50 transition-colors appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <Icon name="ChevronDown" size={16} />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe el propósito de esta sintonización..."
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
                <span className="block text-xs text-slate-400">
                  {isPublic 
                    ? 'Aparecerá en la pestaña "Entonación" para toda la comunidad.' 
                    : 'Será PRIVADA. Sólo podrán unirse los usuarios que reciban tu Enlace de Invitación (podrás copiarlo al iniciar la sesión).'}
                </span>
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
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className={`cursor-pointer border rounded-xl p-3 flex flex-col gap-1 transition-all ${networkMode === 'mixed' ? 'bg-cyan-500/20 border-cyan-500 text-white' : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/30'}`}>
                  <input type="radio" name="networkMode" value="mixed" checked={networkMode === 'mixed'} onChange={() => setNetworkMode('mixed')} className="hidden" />
                  <div className="font-bold text-sm flex items-center gap-2">
                    <Icon name="Globe" size={14} className={networkMode === 'mixed' ? 'text-cyan-400' : 'text-slate-500'} />
                    Mixto (Global + Mesh)
                  </div>
                  <div className="text-xs opacity-70">Transmite por internet y antena P2P simultáneamente.</div>
                </label>

                <label className={`cursor-pointer border rounded-xl p-3 flex flex-col gap-1 transition-all ${networkMode === 'mesh' ? 'bg-green-500/20 border-green-500 text-white' : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/30'}`}>
                  <input type="radio" name="networkMode" value="mesh" checked={networkMode === 'mesh'} onChange={() => setNetworkMode('mesh')} className="hidden" />
                  <div className="font-bold text-sm flex items-center gap-2">
                    <Icon name="RadioReceiver" size={14} className={networkMode === 'mesh' ? 'text-green-400' : 'text-slate-500'} />
                    Solo Mesh Local
                  </div>
                  <div className="text-xs opacity-70">Desconectado de internet. Solo dispositivos de radio locales.</div>
                </label>

                <label className={`cursor-pointer border rounded-xl p-3 flex flex-col gap-1 transition-all ${networkMode === 'server' ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/30'}`}>
                  <input type="radio" name="networkMode" value="server" checked={networkMode === 'server'} onChange={() => setNetworkMode('server')} className="hidden" />
                  <div className="font-bold text-sm flex items-center gap-2">
                    <Icon name="Server" size={14} className={networkMode === 'server' ? 'text-purple-400' : 'text-slate-500'} />
                    Solo Servidor
                  </div>
                  <div className="text-xs opacity-70">Solo a través de internet (WebRTC).</div>
                </label>
              </div>
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
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(192,38,211,0.3)] flex justify-center items-center gap-2"
            >
              {loading ? (
                <Icon name="Loader" className="animate-spin" />
              ) : (
                <>
                  <Icon name="Radio" size={16} className={networkMode !== 'mesh' ? 'animate-pulse' : ''} />
                  Iniciar Sintonización
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
