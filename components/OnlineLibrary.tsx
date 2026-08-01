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
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'vibras' | 'entonacion' | 'perfiles'>('vibras');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'category'>('recent');
  
  // Local storage for global network preference
  const [networkPreference, setNetworkPreference] = useState<'mixed' | 'mesh' | 'server' | 'private'>(
    (localStorage.getItem('globalNetworkPreference') as any) || 'mixed'
  );

  const handleNetworkPrefChange = (pref: 'mixed' | 'mesh' | 'server' | 'private') => {
    setNetworkPreference(pref);
    localStorage.setItem('globalNetworkPreference', pref);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  
  // Local audio context for previewing
  const previewAudioContextRef = React.useRef<AudioContext | null>(null);
  const previewOscillatorsRef = React.useRef<OscillatorNode[]>([]);
  const previewGainsRef = React.useRef<GainNode[]>([]);

  const stopPreview = () => {
    previewOscillatorsRef.current.forEach(osc => {
       try { osc.stop(); osc.disconnect(); } catch(e) {}
    });
    previewGainsRef.current.forEach(gain => {
       try { gain.disconnect(); } catch(e) {}
    });
    previewOscillatorsRef.current = [];
    previewGainsRef.current = [];
    if (previewAudioContextRef.current) {
       previewAudioContextRef.current.close();
       previewAudioContextRef.current = null;
    }
    setPreviewingId(null);
  };

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentStarseedUser();
      setUser(currentUser);
      await loadData();
      setLoading(false);
    };
    init();
    
    return () => {
      stopPreview(); // Cleanup preview audio on unmount
    };
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
      let loggedUser;
      if (isRegistering) {
        loggedUser = await signUpWithStarseed(email, password, email.split('@')[0]);
      } else {
        loggedUser = await loginWithStarseed(email, password);
      }
      setUser(loggedUser);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logoutStarseed();
    setUser(null);
    await loadData();
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
  

  const togglePreview = (sessionId: string, oscillators: OscillatorState[]) => {
     if (previewingId === sessionId) {
         stopPreview();
         return;
     }
     stopPreview();
     setPreviewingId(sessionId);
     
     const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
     previewAudioContextRef.current = ctx;
     
     const masterGain = ctx.createGain();
     masterGain.gain.value = 0.5; // reduced volume for preview
     masterGain.connect(ctx.destination);
     
     oscillators.forEach(oscData => {
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();
         
         osc.type = oscData.type as OscillatorType;
         osc.frequency.value = oscData.frequency;
         gain.gain.value = oscData.volume;
         
         if (oscData.type === 'binaural') {
             // simplify binaural to sine for preview
             osc.type = 'sine';
         }
         
         osc.connect(gain);
         gain.connect(masterGain);
         osc.start();
         
         previewOscillatorsRef.current.push(osc);
         previewGainsRef.current.push(gain);
     });
     
     // Stop preview automatically after 5 seconds
     setTimeout(() => {
        if (previewAudioContextRef.current === ctx) {
            stopPreview();
        }
     }, 5000);
  };

  let filteredPresets = selectedCategory === 'all' ? presets : presets.filter(p => p.content?.category === selectedCategory);
  if (searchQuery.trim()) {
      filteredPresets = filteredPresets.filter(p => p.presetName.toLowerCase().includes(searchQuery.toLowerCase()) || p.hostName.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  if (sortBy === 'recent') filteredPresets.sort((a, b) => b.createdAt - a.createdAt);
  else if (sortBy === 'popular') filteredPresets.sort((a, b) => (b.content?.downloads || 0) - (a.content?.downloads || 0));

  let filteredSessions = selectedCategory === 'all' ? sessions : sessions.filter(s => s.presetContent?.category === selectedCategory);
  if (searchQuery.trim()) {
      filteredSessions = filteredSessions.filter(s => s.presetName.toLowerCase().includes(searchQuery.toLowerCase()) || s.hostName.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  let sortedSessions = [...filteredSessions];
  if (sortBy === 'recent') sortedSessions.sort((a, b) => b.createdAt - a.createdAt);
  else if (sortBy === 'popular') sortedSessions.sort((a, b) => (b.participantsCount || 0) - (a.participantsCount || 0));

  let sortedProfiles = [...profiles];
  if (searchQuery.trim()) {
      sortedProfiles = sortedProfiles.filter(p => p.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  if (sortBy === 'recent') sortedProfiles.sort((a, b) => b.lastActive - a.lastActive);
  else if (sortBy === 'popular') sortedProfiles.sort((a, b) => b.resonancesCount - a.resonancesCount);

  return (
    <div className="p-6 h-full flex flex-col relative">
      {/* Conditionally render login modal if user clicked something requiring auth and is not logged in, or if explicitly opened. For now we use the error state hack to open it or we can just render it. Let's use a state `showLoginModal`. */}
      {/* Wait, we don't have showLoginModal state, let's just render the Login form inline if they want to login via header. */}
      
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border border-white/5 p-4 rounded-2xl backdrop-blur-md shrink-0 overflow-hidden">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10">
              <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
                <Icon name="Wifi" size={14} className="text-cyan-400" />
                <select 
                  value={networkPreference} 
                  onChange={(e) => handleNetworkPrefChange(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="mixed" className="bg-slate-900 text-white">Conexión: Mixta (Internet + Mesh)</option>
                  <option value="mesh" className="bg-slate-900 text-white">Conexión: Solo Mesh Local</option>
                  <option value="server" className="bg-slate-900 text-white">Conexión: Solo Servidores Públicos</option>
                  <option value="private" className="bg-slate-900 text-white">Conexión: Privada (Local)</option>
                </select>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm transition-colors flex items-center gap-2 border border-red-500/20">
                <Icon name="LogOut" size={16} /> Salir
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                <Icon name="Users" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white">Modo Invitado / P2P</h3>
                <p className="text-xs text-slate-400">Acceso a red pública y sintonizaciones en línea</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10">
              <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
                <Icon name="Wifi" size={14} className="text-cyan-400" />
                <select 
                  value={networkPreference} 
                  onChange={(e) => handleNetworkPrefChange(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="mixed" className="bg-slate-900 text-white">Conexión: Mixta (Internet + Mesh)</option>
                  <option value="mesh" className="bg-slate-900 text-white">Conexión: Solo Mesh Local</option>
                  <option value="server" className="bg-slate-900 text-white">Conexión: Solo Servidores Públicos</option>
                  <option value="private" className="bg-slate-900 text-white">Conexión: Privada (Local)</option>
                </select>
              </div>
              <button onClick={() => setError('force_login')} className="px-5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Icon name="LogIn" size={16} />
                Ingresar / Registrarse
              </button>
            </div>
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

              <div className="flex gap-3 mt-4">
                 <button type="button" onClick={() => setError('')} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10">Cancelar</button>
                 <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                   {isRegistering ? "Crear Cuenta" : "Conectar"}
                 </button>
              </div>
              <div className="text-center mt-4">
                 <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-xs text-amber-400 hover:text-amber-300 underline">
                   {isRegistering ? "¿Ya tienes cuenta? Inicia sesión aquí" : "¿No tienes cuenta? Regístrate aquí"}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0 w-full justify-between items-start md:items-center">
        <div className="flex bg-black/50 p-1 rounded-xl border border-white/5 shrink-0 w-full md:w-auto overflow-x-auto custom-scrollbar">
          <button
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'vibras' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('vibras')}
          >
            <Icon name="Library" size={18} /> Partículas
          </button>
          <button
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'entonacion' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('entonacion')}
          >
            <Icon name="Radio" size={18} /> Sintonización
          </button>
          <button
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'perfiles' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('perfiles')}
          >
            <Icon name="Users" size={18} /> Perfiles
          </button>
        </div>

        <div className="relative w-full md:w-72">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Icon name="Search" size={16} className="text-slate-500" />
           </div>
           <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en la comunidad..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-500"
           />
        </div>
      </div>

      {activeTab === 'vibras' && (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-300">
              <Icon name="Globe" size={24} /> Librería de Partículas
            </h2>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 mr-2">
                 <button onClick={() => setSortBy('recent')} className={`px-2 py-1 text-xs font-bold rounded ${sortBy === 'recent' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Recientes</button>
                 <button onClick={() => setSortBy('popular')} className={`px-2 py-1 text-xs font-bold rounded ${sortBy === 'popular' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Populares</button>
              </div>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-purple-300">
              <Icon name="Radio" size={24} /> Sintonizaciones Cuánticas
            </h2>
            <div className="flex flex-wrap gap-2 items-center">
               <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 mr-2">
                 <button onClick={() => setSortBy('recent')} className={`px-2 py-1 text-xs font-bold rounded ${sortBy === 'recent' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Nuevas</button>
                 <button onClick={() => setSortBy('popular')} className={`px-2 py-1 text-xs font-bold rounded ${sortBy === 'popular' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Más Activas</button>
              </div>
               <button onClick={() => handleProtectedAction(() => { if (onStartSessionRequest) onStartSessionRequest(); })} className="px-3 py-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Icon name="Radio" size={14} className="animate-pulse" /> Transmitir
              </button>
              <button onClick={loadData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300">
                <Icon name="RefreshCw" size={18} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar">
            {['all', ...Array.from(new Set(sessions.map(s => s.presetContent?.category || 'Varios'))).filter(c => c !== 'all').sort()].map(cat => {
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {sortedSessions.map(session => (
               <div key={session.id} className="bg-gradient-to-br from-black/80 to-[#1e1a2d]/80 border border-purple-500/30 rounded-2xl hover:border-purple-400 transition-colors relative overflow-hidden group flex flex-col">
                 
                 {/* Cover Background */}
                 <div className="absolute inset-0 z-0">
                    {session.cover_url ? (
                        <img src={session.cover_url} className="w-full h-full object-cover opacity-20 mix-blend-screen" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent blur-2xl"></div>
                    )}
                 </div>
                 
                 <div className="relative z-10 flex flex-col h-full p-5">
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-purple-500/50 overflow-hidden bg-black/50">
                            {session.avatar_url ? (
                                <img src={session.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                <Icon name="User" className="w-full h-full p-2 text-purple-400" />
                            )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight">{session.presetName}</h3>
                          <p className="text-xs text-slate-400">por <span className="text-purple-300 font-bold">{session.hostName}</span></p>
                        </div>
                     </div>
                     <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-bold animate-pulse whitespace-nowrap">
                       <Icon name="Radio" size={10} /> EN VIVO
                     </span>
                   </div>
                   
                   <p className="text-xs text-slate-300 mb-4 flex-grow line-clamp-2">
                       {session.description || session.presetContent?.description || 'Sin descripción.'}
                   </p>
                   
                   <div className="bg-black/50 rounded-lg p-2 mb-4 text-xs text-slate-400 flex flex-col gap-1 border border-white/5">
                        <div className="flex justify-between items-center">
                            <span>Frecuencias Activas:</span>
                            <span className="text-white font-mono">{session.presetContent?.oscillators?.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Resultante:</span>
                            <span className="text-cyan-400 font-mono">
                                {(session.presetContent?.oscillators?.reduce((acc, o) => acc + o.frequency, 0) / (session.presetContent?.oscillators?.length || 1)).toFixed(2)} Hz
                            </span>
                        </div>
                   </div>
                   
                   <div className="flex items-center gap-4 text-[10px] text-slate-500 mb-4 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 justify-between">
                     <span className="flex items-center gap-1"><Icon name="Users" size={12} className="text-fuchsia-400"/> {session.participantsCount || 1} Mentes</span>
                     <span className="flex items-center gap-1">
                         <Icon name={session.allowOpenModifications ? 'Unlock' : 'Lock'} size={12} className={session.allowOpenModifications ? 'text-green-400' : 'text-red-400'}/> 
                         {session.allowOpenModifications ? 'Abierto' : 'Sólo Host'}
                     </span>
                     {session.fixedPermissions && (
                         <span className="flex items-center gap-1 text-amber-400" title="Host Persistente"><Icon name="Anchor" size={12} /> Fijo</span>
                     )}
                   </div>

                   {user?.id === session.hostId && (
                     <div className="mb-4 flex gap-2">
                       <button className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold transition-colors"
                         onClick={() => {
                             stopPreview();
                             if (onJoinSession) onJoinSession(session);
                         }}
                       >
                         Entrar como Host
                       </button>
                     </div>
                   )}

                   <div className="flex gap-2 mt-auto">
                        <button 
                            onClick={() => togglePreview(session.id, session.presetContent?.oscillators || [])}
                            className={`p-2 rounded-xl border transition-colors flex items-center justify-center shrink-0 ${previewingId === session.id ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-black/50 border-white/10 hover:border-white/20 text-slate-400 hover:text-white'}`}
                            title="Pre-escuchar Sonido"
                        >
                            {previewingId === session.id ? <Icon name="Square" size={16} /> : <Icon name="Play" size={16} />}
                        </button>
                        <button 
                        onClick={() => {
                            stopPreview();
                            onJoinSession(session);
                        }}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2"
                        >
                        <Icon name="Headphones" size={16} /> Sincronizar
                        </button>
                   </div>
                 </div>
               </div>
             ))}

             {sortedSessions.length === 0 && (
               <div className="col-span-full py-16 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                 <Icon name="MicOff" size={32} className="mx-auto mb-3 opacity-40" />
                 <p className="mb-1 text-white/70">No hay sintonizaciones activas.</p>
                 <p className="text-xs">Inicia una sesión local y transmite al universo cuántico.</p>
               </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'perfiles' && (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
              <Icon name="Users" size={24} /> Exploradores Cuánticos
            </h2>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 mr-2">
                 <button onClick={() => setSortBy('recent')} className={`px-2 py-1 text-xs font-bold rounded ${sortBy === 'recent' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Recientes</button>
                 <button onClick={() => setSortBy('popular')} className={`px-2 py-1 text-xs font-bold rounded ${sortBy === 'popular' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>Más Resonantes</button>
              </div>
              <button onClick={loadData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300">
                <Icon name="RefreshCw" size={18} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProfiles.map(p => (
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
