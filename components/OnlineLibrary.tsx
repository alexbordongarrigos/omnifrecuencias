import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { 
  loginWithStarseed, 
  logoutStarseed, 
  getCurrentStarseedUser, 
  fetchCommunityPresets, 
  fetchLiveSessions,
  StarseedUser 
} from '../services/starseedAuth';
import { fetchCommunityProfiles, checkResonance, resonateWithUser, unresonateWithUser } from '../services/omniCommunity';
import { FileSystemNode, LiveSession, CATEGORIES, OmniProfile, OscillatorState } from '../types';
import PublishParticleModal from './PublishParticleModal';

interface Props {
  onLoadPreset: (node: FileSystemNode) => void;
  onJoinSession: (session: LiveSession) => void;
  currentOscillators?: OscillatorState[];
  onStartSessionRequest?: () => void;
}

const OnlineLibrary: React.FC<Props> = ({ onLoadPreset, onJoinSession, currentOscillators = [], onStartSessionRequest }) => {
  const [user, setUser] = useState<StarseedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [presets, setPresets] = useState<FileSystemNode[]>([]);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [profiles, setProfiles] = useState<OmniProfile[]>([]);
  const [resonancesCache, setResonancesCache] = useState<Record<string, boolean>>({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'vibras' | 'entonacion' | 'perfiles'>('vibras');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPublishModal, setShowPublishModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentStarseedUser();
      setUser(currentUser);
      if (currentUser) {
        await loadData();
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadData = async () => {
    try {
      const [presetsData, sessionsData, profilesData] = await Promise.all([
        fetchCommunityPresets(),
        fetchLiveSessions(),
        fetchCommunityProfiles()
      ]);
      setPresets(presetsData);
      setSessions(sessionsData);
      setProfiles(profilesData);
      
      // Load resonance states if user logged in
      const currentUser = await getCurrentStarseedUser();
      if (currentUser) {
        const cache: Record<string, boolean> = {};
        for (const p of profilesData) {
          cache[p.id] = await checkResonance(currentUser.id, p.id);
        }
        setResonancesCache(cache);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loggedUser = await loginWithStarseed(email, password);
      setUser(loggedUser);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logoutStarseed();
    setUser(null);
    setPresets([]);
    setSessions([]);
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-cyan-400"><Icon name="Loader" size={32} className="animate-spin" /></div>;
  }

  const handleProtectedAction = (action: () => void) => {
    if (!user) {
      setError('force_login');
      return;
    }
    action();
  };

  const filteredPresets = selectedCategory === 'all' ? presets : presets.filter(p => p.content?.category === selectedCategory);

  return (
    <div className="p-6 h-full flex flex-col relative">
      {/* Conditionally render login modal if user clicked something requiring auth and is not logged in, or if explicitly opened. For now we use the error state hack to open it or we can just render it. Let's use a state `showLoginModal`. */}
      {/* Wait, we don't have showLoginModal state, let's just render the Login form inline if they want to login via header. */}
      
      <div className="relative flex justify-between items-center mb-6 border border-white/5 p-4 rounded-2xl backdrop-blur-md shrink-0 overflow-hidden">
        {user?.cover_url && (
           <img src={user.cover_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none mix-blend-screen" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/30 pointer-events-none" />
        
        {user ? (
          <>
            <div className="flex items-center gap-4 relative z-10">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.displayName} className="w-14 h-14 rounded-full border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.5)] object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-bold text-white text-lg">{user.displayName}</h3>
                <p className="text-xs text-amber-400 font-bold">Conectado a Starseed OS</p>
              </div>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors flex items-center gap-2">
              <Icon name="LogOut" size={16} /> Salir
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Icon name="Users" size={20} className="text-slate-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Modo Invitado</h3>
                <p className="text-xs text-slate-400">Visualizando comunidad pública</p>
              </div>
            </div>
            <button onClick={() => setError('force_login')} className="px-5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M4.929 4.929l14.142 14.142M4.929 19.071L19.071 4.929M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              Login Starseed
            </button>
          </>
        )}
      </div>

      {(!user && error === 'force_login') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black/80 border border-white/10 p-8 rounded-3xl backdrop-blur-xl w-full max-w-md shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-950/30 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                 <img src="/starseed-symbol.png" alt="Starseed OS" className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white text-center mb-2">Starseed OS</h2>
            <p className="text-sm text-slate-400 text-center mb-8">Inicia sesión con tu cuenta universal para publicar, transmitir y sincronizar tus presets.</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input type="email" placeholder="Correo electrónico" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <input type="password" placeholder="Contraseña" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              {error && error !== 'force_login' && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                 <button type="button" onClick={() => setError('')} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10">Cancelar</button>
                 <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]">Conectar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex mb-6 bg-black/50 p-1 rounded-xl border border-white/5 shrink-0">
        <button
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'vibras' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('vibras')}
        >
          <Icon name="Library" size={18} /> Partículas (Vibras)
        </button>
        <button
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'entonacion' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('entonacion')}
        >
          <Icon name="Radio" size={18} /> Sincronización (En Vivo)
        </button>
        <button
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'perfiles' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('perfiles')}
        >
          <Icon name="Users" size={18} /> Perfiles
        </button>
      </div>

      {activeTab === 'vibras' && (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-300">
              <Icon name="Globe" size={24} /> Librería de Partículas
            </h2>
            <div className="flex gap-2">
              <button onClick={() => handleProtectedAction(() => setShowPublishModal(true))} className="px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                <Icon name="Upload" size={14} /> Publicar Partícula
              </button>
              <button onClick={loadData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300">
                <Icon name="RefreshCw" size={18} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar">
            {['all', ...Array.from(new Set(presets.map(p => p.content?.category || 'Varios'))).filter(c => c !== 'all').sort()].map(cat => {
               // Try to match with known CATEGORIES for a nicer label, else use the raw string
               const knownCat = CATEGORIES.find(c => c.id === cat);
               const label = knownCat ? knownCat.label : (cat === 'all' ? 'Todas' : cat);
               return (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${selectedCategory === cat ? 'bg-white/20 border-white/40 text-white' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10'}`}
                 >
                   {label}
                 </button>
               );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map(preset => (
              <div key={preset.id} className="bg-gradient-to-br from-black/80 to-slate-900/80 border border-white/10 p-5 rounded-2xl hover:border-cyan-500/50 transition-colors group relative overflow-hidden flex flex-col shadow-lg">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                  <Icon name="CloudDownload" size={20} className="text-cyan-400" />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Icon name="FileAudio" size={24} className="text-cyan-400" />
                    <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-1 rounded text-slate-300 font-mono">
                      {preset.content?.oscillators.length} Osc
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-lg mb-1">{preset.name}</h4>
                  <p className="text-xs text-slate-400 mb-4 flex-grow line-clamp-3">
                    {preset.content?.description || 'Sin descripción'}
                  </p>
                  
                  {preset.content?.tags && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {preset.content.tags.map(tag => (
                        <span key={tag} className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-slate-300">#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/10">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(preset.createdAt).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => onLoadPreset(preset)}
                      className="px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]"
                    >
                      Cargar
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredPresets.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-50" />
                <p>No hay presets en esta categoría.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'entonacion' && (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-purple-300">
              <Icon name="Radio" size={24} /> Sincronizaciones Cuánticas
            </h2>
            <div className="flex gap-2">
               <button onClick={() => handleProtectedAction(() => { if (onStartSessionRequest) onStartSessionRequest(); })} className="px-3 py-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                <Icon name="Radio" size={14} /> Transmitir Vibras
              </button>
              <button onClick={loadData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300">
                <Icon name="RefreshCw" size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {sessions.map(session => (
               <div key={session.id} className="bg-black/60 border border-purple-500/30 p-5 rounded-2xl hover:border-purple-400 transition-colors relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>
                 
                 <div className="relative z-10">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="text-lg font-bold text-white">{session.presetName}</h3>
                     <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-bold animate-pulse">
                       <Icon name="Radio" size={10} /> EN VIVO
                     </span>
                   </div>
                   
                   <p className="text-sm text-slate-400 mb-4">Host: <span className="text-purple-300 font-bold">{session.hostName}</span></p>
                   
                   <div className="flex items-center gap-4 text-[10px] text-slate-500 mb-6">
                     <span className="flex items-center gap-1"><Icon name="Users" size={12}/> {session.participantsCount || 0} Conectados</span>
                     <span className="flex items-center gap-1"><Icon name="Settings" size={12}/> {session.allowOpenModifications ? 'Abierto' : 'Sólo Host'}</span>
                   </div>

                   <button 
                     onClick={() => onJoinSession(session)}
                     className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2"
                   >
                     <Icon name="Headphones" size={16} /> Sincronizar
                   </button>
                 </div>
               </div>
             ))}

             {sessions.length === 0 && (
               <div className="col-span-full py-16 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                 <Icon name="MicOff" size={32} className="mx-auto mb-3 opacity-40" />
                 <p className="mb-1 text-white/70">No hay sincronizaciones activas.</p>
                 <p className="text-xs">Inicia una sesión local y transmite al universo cuántico.</p>
               </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'perfiles' && (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
              <Icon name="Users" size={24} /> Exploradores Cuánticos
            </h2>
            <button onClick={loadData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300">
              <Icon name="RefreshCw" size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map(p => (
              <div key={p.id} className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden relative group hover:border-amber-500/50 transition-colors">
                {/* Cover Image or fallback */}
                <div className="h-20 bg-gradient-to-br from-slate-900 to-black relative">
                  {p.cover_url && <img src={p.cover_url} className="w-full h-full object-cover opacity-60 mix-blend-screen" alt="Cover" />}
                  {p.status === 'online' && (
                    <span className="absolute top-2 right-2 bg-green-500/20 text-green-400 border border-green-500/50 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Activo
                    </span>
                  )}
                </div>
                
                <div className="p-4 pt-0 relative">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full border-4 border-black bg-gradient-to-tr from-cyan-500 to-amber-500 -mt-8 mb-2 flex items-center justify-center font-bold text-xl overflow-hidden">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      p.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  <h3 className="font-bold text-white mb-1">{p.displayName}</h3>
                  
                  <div className="flex gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Icon name="Activity" size={12} className="text-cyan-400" /> {p.particlesCount} Partículas
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Radio" size={12} className="text-amber-400" /> {p.resonancesCount} Resonancias
                    </span>
                  </div>
                  
                  {user && user.id !== p.id && (
                    <button 
                      onClick={() => handleProtectedAction(async () => {
                        try {
                          if (resonancesCache[p.id]) {
                            await unresonateWithUser(user.id, p.id);
                            setResonancesCache(prev => ({...prev, [p.id]: false}));
                          } else {
                            await resonateWithUser(user.id, p.id);
                            setResonancesCache(prev => ({...prev, [p.id]: true}));
                          }
                          // Refresh counts
                          loadData();
                        } catch(e) {
                          console.error(e);
                        }
                      })}
                      className={`w-full py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        resonancesCache[p.id] 
                        ? 'bg-white/10 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500 hover:text-black'
                      }`}
                    >
                      <Icon name="Radio" size={16} /> {resonancesCache[p.id] ? 'Dejar de Resonar' : 'Resonar'}
                    </button>
                  )}
                  {(!user || user.id === p.id) && (
                    <div className="w-full py-2 text-center text-xs text-slate-500">
                      {user?.id === p.id ? 'Este es tu avatar cuántico' : 'Inicia sesión para resonar'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPublishModal && user && (
        <PublishParticleModal
          onClose={() => {
            setShowPublishModal(false);
            loadData(); // recargar para ver la nueva partícula
          }}
          oscillators={currentOscillators}
          user={user}
        />
      )}
    </div>
  );
};

export default OnlineLibrary;
