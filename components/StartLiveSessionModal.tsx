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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await getCurrentStarseedUser();
      if (!user) {
        throw new Error("Debes iniciar sesión con Starseed OS para transmitir en vivo.");
      }
      
      const session = await createLiveSession(
        preset,
        user.id,
        user.displayName,
        presetName,
        isPublic,
        allowOpenModifications
      );
      onSessionStarted(session);
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
