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
import { FileSystemNode, LiveSession, CATEGORIES } from '../types';

interface Props {
  onLoadPreset: (node: FileSystemNode) => void;
  onJoinSession: (session: LiveSession) => void;
}

const OnlineLibrary: React.FC<Props> = ({ onLoadPreset, onJoinSession }) => {
  const [user, setUser] = useState<StarseedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [presets, setPresets] = useState<FileSystemNode[]>([]);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'vibras' | 'entonacion'>('vibras');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
      const [presetsData, sessionsData] = await Promise.all([
        fetchCommunityPresets(),
        fetchLiveSessions()
      ]);
      setPresets(presetsData);
      setSessions(sessionsData);
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
      // Show login modal or alert
      alert('Debes iniciar sesión con tu cuenta Starseed OS para realizar esta acción.');
      return;
    }
    action();
  };

  const LoginModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-black/80 border border-white/10 p-8 rounded-3xl backdrop-blur-xl w-full max-w-md shadow-[0_0_50px_rgba(245,158,11,0.2)]">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-950/30 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
            <Icon name="Cloud" size={32} />
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
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
             <button type="button" onClick={() => setError('login_cancelled')} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10">Cancelar</button>
             <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]">Conectar</button>
          </div>
        </form>
      </div>
    </div>
  );

  const filteredPresets = selectedCategory === 'all' ? presets : presets.filter(p => p.content?.category === selectedCategory);

  return (
    <div className="p-6 h-full flex flex-col relative">
      {/* Conditionally render login modal if user clicked something requiring auth and is not logged in, or if explicitly opened. For now we use the error state hack to open it or we can just render it. Let's use a state `showLoginModal`. */}
      {/* Wait, we don't have showLoginModal state, let's just render the Login form inline if they want to login via header. */}
      
      <div className="flex justify-between items-center mb-6 bg-black/30 border border-white/5 p-4 rounded-2xl backdrop-blur-md shrink-0">
        {user ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-amber-500 flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                {user.displayName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-white">{user.displayName}</h3>
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
              <Icon name="Cloud" size={16} /> Login Starseed
            </button>
          </>
        )}
      </div>

      {(!user && error === 'force_login') && <LoginModal />}

      <div className="flex mb-6 bg-black/50 p-1 rounded-xl border border-white/5 shrink-0">
        <button
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'vibras' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('vibras')}
        >
          <Icon name="Library" size={18} /> Vibras (Presets)
        </button>
        <button
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'entonacion' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('entonacion')}
        >
          <Icon name="Radio" size={18} /> Entonación (En Vivo)
        </button>
      </div>

      {activeTab === 'vibras' && (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-300">
              <Icon name="Globe" size={24} /> Librería Comunitaria
            </h2>
            <div className="flex gap-2">
              <button onClick={() => handleProtectedAction(() => {})} className="px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                <Icon name="Upload" size={14} /> Publicar Preset
              </button>
              <button onClick={loadData} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300">
                <Icon name="RefreshCw" size={18} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar">
            {CATEGORIES.map(cat => (
               <button
                 key={cat.id}
                 onClick={() => setSelectedCategory(cat.id)}
                 className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${selectedCategory === cat.id ? 'bg-white/20 border-white/40 text-white' : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10'}`}
               >
                 {cat.label}
               </button>
            ))}
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
              <Icon name="Radio" size={24} /> Sesiones en Vivo
            </h2>
            <div className="flex gap-2">
               <button onClick={() => handleProtectedAction(() => {})} className="px-3 py-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                <Icon name="Radio" size={14} /> Transmitir
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
                     <span className="flex items-center gap-1"><Icon name="Users" size={12}/> Público</span>
                     <span className="flex items-center gap-1"><Icon name="Settings" size={12}/> {session.allowOpenModifications ? 'Abierto' : 'Sólo Host'}</span>
                   </div>

                   <button 
                     onClick={() => onJoinSession(session)}
                     className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2"
                   >
                     <Icon name="Headphones" size={16} /> Unirse a la Sesión
                   </button>
                 </div>
               </div>
             ))}

             {sessions.length === 0 && (
               <div className="col-span-full py-16 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                 <Icon name="MicOff" size={32} className="mx-auto mb-3 opacity-40" />
                 <p className="mb-1 text-white/70">No hay sesiones públicas activas.</p>
                 <p className="text-xs">Inicia una sesión desde tus presets locales compartiendo como "Sesión Pública".</p>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineLibrary;
