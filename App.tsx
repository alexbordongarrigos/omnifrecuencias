
import React, { useState, useMemo } from 'react';
import { frequencyData } from './data/frequencies';
import { CATEGORIES, CategoryId, SortOption, FrequencyItem, OscillatorState } from './types';
import FrequencyCard from './components/FrequencyCard';
import Icon from './components/Icon';
import { useAudio } from './hooks/useAudio';
import Generator from './components/Generator';
import GlobalPlayer from './components/GlobalPlayer';
import LandingPage from './components/LandingPage';
import OnlineLibrary from './components/OnlineLibrary';
import { useFileSystem } from './hooks/useFileSystem';
import FileExplorer from './components/FileExplorer';
import StartLiveSessionModal from './components/StartLiveSessionModal';
import LiveSyncCall from './components/LiveSyncCall';
import Introduction from './components/Introduction';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LiveSession, PresetContent } from './types';
import { getCurrentStarseedUser, StarseedUser, fetchLiveSessionById } from './services/starseedAuth';

export interface SessionPermissions {
  canEditFrequencies: boolean;
  canUseMic: boolean;
  canUseVideo: boolean;
  canChat: boolean;
}

type ViewMode = 'intro' | 'library' | 'generator' | 'online';

// --- SYNERGY RECIPES ENGINE ---
// Defines how complex synergies are constructed (multi-oscillator stacks, binaurals, etc)
const getSynergyRecipe = (id: string): Partial<OscillatorState>[] | null => {
  const commonVol = 0.5;
  
  switch (id) {
    case 'syn_phi': // 1.618 Hz Binaural (Golden Ratio)
      return [
        { frequency: 432, type: 'sine', volume: commonVol, panX: -0.8, panY: 0, panZ: 0, name: 'Base Phi (L)', isIndependent: false, color: '#fbbf24' },
        { frequency: 433.618, type: 'sine', volume: commonVol, panX: 0.8, panY: 0, panZ: 0, name: 'Binaural Phi (R)', isIndependent: false, color: '#f59e0b' }
      ];
    case 'syn_pi': // 3.1416 Hz Binaural
        return [
          { frequency: 432, type: 'sine', volume: commonVol, panX: -0.8, panY: 0, panZ: 0, name: 'Base Pi (L)', isIndependent: false, color: '#3b82f6' },
          { frequency: 435.1416, type: 'sine', volume: commonVol, panX: 0.8, panY: 0, panZ: 0, name: 'Binaural Pi (R)', isIndependent: false, color: '#60a5fa' }
        ];
    case 'syn_astral': // Theta 4Hz
        return [
            { frequency: 216, type: 'sine', volume: commonVol, panX: -0.9, panY: 0, panZ: 0, name: 'Base Astral (L)', isIndependent: false, color: '#8b5cf6' },
            { frequency: 220, type: 'sine', volume: commonVol, panX: 0.9, panY: 0, panZ: 0, name: 'Theta 4Hz (R)', isIndependent: false, color: '#a78bfa' }
        ];
    case 'syn_gaia_matrix': // 528 + 7.83
        return [
            { frequency: 528, type: 'sine', volume: 0.4, panX: 0, panY: 0, panZ: 0, name: 'ADN 528Hz', isIndependent: false, color: '#4ade80' },
            { frequency: 7.83, type: 'sine', volume: 0.8, panX: 0, panY: -1, panZ: 0, name: 'Schumann Ground', isIndependent: true, color: '#166534' }
        ];
    case 'syn_sun_moon': // Sun + Moon
        return [
            { frequency: 126.22, type: 'sine', volume: commonVol, panX: -0.6, panY: 0.5, panZ: 0, name: 'Sol (Yang)', isIndependent: false, color: '#fcd34d' },
            { frequency: 210.42, type: 'sine', volume: commonVol, panX: 0.6, panY: -0.5, panZ: 0, name: 'Luna (Yin)', isIndependent: false, color: '#e2e8f0' }
        ];
    case 'syn_venus_mars': // Venus + Mars
        return [
            { frequency: 221.23, type: 'sine', volume: commonVol, panX: -0.6, panY: 0, panZ: 0, name: 'Venus', isIndependent: false, color: '#f472b6' },
            { frequency: 144.72, type: 'sine', volume: commonVol, panX: 0.6, panY: 0, panZ: 0, name: 'Marte', isIndependent: false, color: '#ef4444' }
        ];
    case 'syn_fibonacci': // 144 + 233
        return [
            { frequency: 144, type: 'sine', volume: commonVol, panX: -0.3, panY: 0, panZ: 0, name: 'Fibo 144', isIndependent: false, color: '#2dd4bf' },
            { frequency: 233, type: 'sine', volume: commonVol, panX: 0.3, panY: 0, panZ: 0, name: 'Fibo 233', isIndependent: false, color: '#14b8a6' }
        ];
     case 'syn_pleiades': // Chord
        return [
            { frequency: 432, type: 'sine', volume: 0.4, panX: 0, panY: 0, panZ: 0, name: 'Pléyades Base', isIndependent: false, color: '#0ea5e9' },
            { frequency: 528, type: 'sine', volume: 0.3, panX: -0.5, panY: 0.5, panZ: 0, name: 'Pléyades High', isIndependent: false, color: '#38bdf8' },
            { frequency: 639, type: 'sine', volume: 0.3, panX: 0.5, panY: 0.5, panZ: 0, name: 'Pléyades Connect', isIndependent: false, color: '#7dd3fc' }
        ];
     case 'syn_sirius': // Sirius Connection
        return [
            { frequency: 396, type: 'sine', volume: 0.5, panX: -0.4, panY: 0, panZ: 0, name: 'Sirio Base', isIndependent: false, color: '#6366f1' },
            { frequency: 741, type: 'sine', volume: 0.4, panX: 0.4, panY: 0.5, panZ: 0, name: 'Sirio Light', isIndependent: false, color: '#818cf8' }
        ];
    case 'syn_orion': // Orion Belt Triad
        return [
            { frequency: 144, type: 'sine', volume: 0.4, panX: -0.5, panY: 0, panZ: 0, name: 'Alnitak', isIndependent: false, color: '#3b82f6' },
            { frequency: 528, type: 'sine', volume: 0.4, panX: 0, panY: 0.5, panZ: 0, name: 'Alnilam', isIndependent: false, color: '#60a5fa' },
            { frequency: 852, type: 'sine', volume: 0.4, panX: 0.5, panY: 0, panZ: 0, name: 'Mintaka', isIndependent: false, color: '#93c5fd' }
        ];
    case 'syn_arcturus': // Healing Stack
        return [
            { frequency: 396, type: 'sine', volume: 0.4, panX: -0.3, panY: -0.2, panZ: 0, name: 'Release Fear', isIndependent: false, color: '#f87171' },
            { frequency: 528, type: 'sine', volume: 0.4, panX: 0.3, panY: -0.2, panZ: 0, name: 'Heal Structure', isIndependent: false, color: '#4ade80' },
            { frequency: 963, type: 'sine', volume: 0.3, panX: 0, panY: 0.5, panZ: 0, name: 'Spirit Unity', isIndependent: false, color: '#facc15' }
        ];
     case 'syn_christ': // 33 Hz
        return [
            { frequency: 33, type: 'sine', volume: 0.7, panX: 0, panY: 0, panZ: 0, name: 'Resonancia 33', isIndependent: true, color: '#fb923c' }
        ];
    case 'syn_fifth':
         return [
            { frequency: 256, type: 'sine', volume: commonVol, panX: -0.4, panY: 0, panZ: 0, name: 'Raíz (C)', isIndependent: false, color: '#94a3b8' },
            { frequency: 384, type: 'sine', volume: commonVol, panX: 0.4, panY: 0, panZ: 0, name: 'Quinta (G)', isIndependent: false, color: '#64748b' }
         ];
     case 'syn_tritone':
         return [
            { frequency: 256, type: 'sine', volume: commonVol, panX: -0.4, panY: 0, panZ: 0, name: 'Raíz (C)', isIndependent: false, color: '#ef4444' },
            { frequency: 362.04, type: 'sine', volume: commonVol, panX: 0.4, panY: 0, panZ: 0, name: 'Tritono (F#)', isIndependent: false, color: '#dc2626' }
         ];
     case 'syn_tesla_369':
         return [
            { frequency: 369, type: 'sine', volume: 0.4, panX: -0.5, panY: 0, panZ: 0, name: 'Vórtex 369Hz', isIndependent: false, color: '#22d3ee' },
            { frequency: 639, type: 'sine', volume: 0.4, panX: 0, panY: 0.5, panZ: 0, name: 'Armonización 639Hz', isIndependent: false, color: '#a855f7' },
            { frequency: 963, type: 'sine', volume: 0.4, panX: 0.5, panY: 0, panZ: 0, name: 'Conciencia 963Hz', isIndependent: false, color: '#f472b6' }
         ];
     case 'syn_heart_coherence':
         return [
            { frequency: 341.33, type: 'sine', volume: 0.4, panX: -0.4, panY: 0, panZ: 0, name: 'Fa Corazón', isIndependent: false, color: '#4ade80' },
            { frequency: 528, type: 'sine', volume: 0.4, panX: 0.4, panY: 0, panZ: 0, name: 'Mi ADN', isIndependent: false, color: '#22c55e' },
            { frequency: 10, type: 'sine', volume: 0.7, panX: 0, panY: -0.8, panZ: 0, name: 'Alfa Pulse', isIndependent: true, color: '#fbbf24' }
         ];
     case 'syn_merkaba':
         return [
            { frequency: 111, type: 'sine', volume: 0.5, panX: -0.6, panY: -0.3, panZ: 0, name: 'Malta 111Hz', isIndependent: false, color: '#38bdf8' },
            { frequency: 432, type: 'sine', volume: 0.4, panX: 0, panY: 0, panZ: 0, name: 'Giza 432Hz', isIndependent: false, color: '#c084fc' },
            { frequency: 963, type: 'sine', volume: 0.4, panX: 0.6, panY: 0.3, panZ: 0, name: 'Crown 963Hz', isIndependent: false, color: '#f472b6' }
         ];
     case 'syn_deep_sleep':
         return [
            { frequency: 0.5, type: 'sine', volume: 0.6, panX: 0, panY: 0, panZ: 0, name: 'Epsilon 0.5Hz', isIndependent: true, color: '#818cf8' },
            { frequency: 2.0, type: 'sine', volume: 0.6, panX: -0.5, panY: 0, panZ: 0, name: 'Delta 2Hz', isIndependent: true, color: '#6366f1' },
            { frequency: 174, type: 'sine', volume: 0.4, panX: 0.5, panY: 0, panZ: 0, name: 'Anestésico 174Hz', isIndependent: false, color: '#a78bfa' }
         ];
    default:
        return null;
  }
};

const App: React.FC = () => {
  const [started, setStarted] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOption['value']>('hz-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('intro');
  const [currentUser, setCurrentUser] = useState<StarseedUser | null>(null);
  
  // Audio Engine Hook
  const audio = useAudio();

  // Session State
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const [sessionPermissions, setSessionPermissions] = useState<SessionPermissions>({
    canEditFrequencies: true,
    canUseMic: true,
    canUseVideo: true,
    canChat: true,
  });
  const [activeVizTab, setActiveVizTab] = useState<'2d' | '3d' | 'spiral'>('2d');

  const [showStartSessionModal, setShowStartSessionModal] = useState(false);
  const [presetToStart, setPresetToStart] = useState<PresetContent | null>(null);

  React.useEffect(() => {
    getCurrentStarseedUser().then(user => setCurrentUser(user));
    
    // Check for session invite link
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session');
    if (sessionId) {
       fetchLiveSessionById(sessionId).then(session => {
          if (session) {
             setActiveSession(session as LiveSession);
             setViewMode('generator');
             // Load the session preset automatically
             audio.syncFromRemote(session.presetContent.oscillators);
          } else {
             console.error("Session not found or RLS blocked access.");
          }
       });
       // Clear the URL so we don't keep rejoining on refresh
       window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handler to add from Library to Generator
  const handleAddToPlayer = (item: FrequencyItem) => {
    
    // 1. Check for Synergy Recipe
    if (item.category === 'synergy') {
        const recipe = getSynergyRecipe(item.id);
        if (recipe) {
            recipe.forEach(oscParams => {
                audio.addOscillator(oscParams);
            });
            setViewMode('generator');
            return;
        }
    }

    // 2. Default Single Oscillator Logic
    let freq = item.numericalHz;
    if (!freq || freq === 0) {
        // Fallback for complex strings, try to extract first number
        const match = item.hz.match(/[\d.]+/);
        freq = match ? parseFloat(match[0]) : 432;
    }

    // Determine default color based on category
    let defaultColor = '#38bdf8';
    const cat = CATEGORIES.find(c => c.id === item.category);
    if (cat) {
        // Map Tailwind class to approx hex for visualizer defaults
        if (cat.color.includes('purple')) defaultColor = '#c084fc';
        if (cat.color.includes('red')) defaultColor = '#f87171';
        if (cat.color.includes('green') || cat.color.includes('emerald')) defaultColor = '#4ade80';
        if (cat.color.includes('amber') || cat.color.includes('orange')) defaultColor = '#fbbf24';
        if (cat.color.includes('pink')) defaultColor = '#f472b6';
    }

    audio.addOscillator({
        name: item.name,
        frequency: freq,
        type: 'sine', // Default
        volume: 0.5,
        panX: 0,
        color: defaultColor
    });
    
    // Switch view to generator to show feedback
    setViewMode('generator');
  };

  // Filter and Sort Logic
  const filteredData = useMemo(() => {
    let data = [...frequencyData];

    // 1. Filter by Category
    if (activeCategory !== 'all') {
      data = data.filter(item => item.category === activeCategory);
    }

    // 2. Filter by Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.hz.includes(lowerQuery) ||
        item.detailedUsage.toLowerCase().includes(lowerQuery)
      );
    }

    // 3. Sort
    data.sort((a, b) => {
      switch (sortOrder) {
        case 'hz-asc':
          return a.numericalHz - b.numericalHz;
        case 'hz-desc':
          return b.numericalHz - a.numericalHz;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'location':
          if (a.location && !b.location) return -1;
          if (!a.location && b.location) return 1;
          return (a.location || '').localeCompare(b.location || '');
        default:
          return 0;
      }
    });

    return data;
  }, [activeCategory, searchQuery, sortOrder]);

  if (!started) {
    return <LandingPage onEnterWeb={() => setStarted(true)} />;
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-100">
      
      {/* --- Ambient Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* --- Header --- */}
        <header className="text-center mb-12 animate-fade-in flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-3 mb-8 px-6 py-2 rounded-full bg-black/40 border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-md hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] transition-shadow duration-500 cursor-default">
            <Icon name="Globe" size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Versión Web V.7</span>
          </div>
          
          <div className="relative inline-block mt-4">
              <div className="flex flex-col items-center gap-4">
                <img src="/omnifrecuencias.png" alt="Omni Frecuencias Logo" className="w-24 h-24 object-contain animate-[pulse_4s_infinite] drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]" />
                <h1 className="font-display text-4xl md:text-7xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-purple-300 to-pink-300 drop-shadow-[0_5px_15px_rgba(168,85,247,0.4)]" style={{ textShadow: '0 10px 30px rgba(168,85,247,0.3), 0 2px 10px rgba(34,211,238,0.5)' }}>
                  Omni-Frecuencias
                </h1>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-2xl -z-10 rounded-full opacity-50 mix-blend-screen"></div>
          </div>
          
          {/* Main Navigation Tabs */}
          <div className="flex flex-wrap justify-center mt-10 gap-4 md:gap-6">
             <button 
                onClick={() => setViewMode('intro')}
                className={`relative overflow-hidden group flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 rounded-2xl font-display font-bold tracking-widest uppercase text-sm transition-all duration-500 ${viewMode === 'intro' ? 'bg-indigo-950/40 text-indigo-200 border-2 border-indigo-400/50 shadow-[0_0_30px_rgba(99,102,241,0.4),inset_0_0_20px_rgba(99,102,241,0.2)] scale-105' : 'bg-black/40 text-slate-400 border-2 border-white/5 hover:bg-white/5 hover:border-indigo-500/30 hover:text-indigo-100 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]'}`}
             >
                <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-400/20 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ${viewMode === 'intro' ? 'animate-[shimmer_2s_infinite]' : ''}`}></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none"></div>
                <Icon name="Info" size={20} className={viewMode === 'intro' ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]' : ''} />
                <span className="hidden md:inline">Introducción</span>
             </button>
             <button 
                onClick={() => setViewMode('library')}
                className={`relative overflow-hidden group flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 rounded-2xl font-display font-bold tracking-widest uppercase text-sm transition-all duration-500 ${viewMode === 'library' ? 'bg-cyan-950/40 text-cyan-200 border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.4),inset_0_0_20px_rgba(34,211,238,0.2)] scale-105' : 'bg-black/40 text-slate-400 border-2 border-white/5 hover:bg-white/5 hover:border-cyan-500/30 hover:text-cyan-100 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]'}`}
             >
                <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-400/20 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ${viewMode === 'library' ? 'animate-[shimmer_2s_infinite]' : ''}`}></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none"></div>
                <Icon name="Search" size={20} className={viewMode === 'library' ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''} />
                <span className="hidden md:inline">Librería</span>
             </button>
             <button 
                onClick={() => setViewMode('generator')}
                className={`relative overflow-hidden group flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 rounded-2xl font-display font-bold tracking-widest uppercase text-sm transition-all duration-500 ${viewMode === 'generator' ? 'bg-purple-950/40 text-purple-200 border-2 border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.4),inset_0_0_20px_rgba(168,85,247,0.2)] scale-105' : 'bg-black/40 text-slate-400 border-2 border-white/5 hover:bg-white/5 hover:border-purple-500/30 hover:text-purple-100 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]'}`}
             >
                <div className={`absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-400/20 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ${viewMode === 'generator' ? 'animate-[shimmer_2s_infinite]' : ''}`}></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none"></div>
                <Icon name="Zap" size={20} className={viewMode === 'generator' ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : ''} />
                <span className="hidden md:inline">Generador</span>
             </button>
             <button 
                onClick={() => setViewMode('online')}
                className={`relative overflow-hidden group flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 rounded-2xl font-display font-bold tracking-widest uppercase text-sm transition-all duration-500 ${viewMode === 'online' ? 'bg-pink-950/40 text-pink-200 border-2 border-pink-400/50 shadow-[0_0_30px_rgba(244,114,182,0.4),inset_0_0_20px_rgba(244,114,182,0.2)] scale-105' : 'bg-black/40 text-slate-400 border-2 border-white/5 hover:bg-white/5 hover:border-pink-500/30 hover:text-pink-100 hover:shadow-[0_0_20px_rgba(244,114,182,0.2)]'}`}
             >
                <div className={`absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-400/20 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ${viewMode === 'online' ? 'animate-[shimmer_2s_infinite]' : ''}`}></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none"></div>
                <Icon name="Globe" size={20} className={viewMode === 'online' ? 'drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]' : ''} />
                <span className="hidden md:inline">Comunidad</span>
             </button>
          </div>
        </header>

        {/* --- MAIN VIEWS --- */}
        <>
            {/* --- VIEW: INTRO --- */}
            {viewMode === 'intro' && <Introduction />}
            
            {/* --- VIEW: LIBRARY --- */}
        {viewMode === 'library' && (
            <div className="animate-fade-in">
                {/* --- Controls Panel --- */}
                <div className="sticky top-4 z-40 mb-10" style={{ animationDelay: '100ms' }}>
                <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                    
                    {/* Top Row: Search & Mobile Toggle */}
                    <div className="flex flex-col md:flex-row gap-5 justify-between items-center mb-4 md:mb-3 relative z-10">
                    <div className="relative w-full md:w-96 group">
                        <div className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                        <Icon name="Search" size={18} />
                        </div>
                        <input 
                        type="text" 
                        placeholder="Buscar frecuencia, órgano, pirámide..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-400/50 focus:bg-black/80 focus:shadow-[0_0_20px_rgba(34,211,238,0.2),inset_0_0_10px_rgba(34,211,238,0.1)] transition-all duration-300 text-white placeholder-slate-600 font-light"
                        />
                    </div>

                    {/* Sort Controls (Desktop) */}
                    <div className="hidden md:flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 px-3 font-bold">Ordenar:</span>
                        {[
                        { label: 'Hz Asc', value: 'hz-asc' },
                        { label: 'Hz Desc', value: 'hz-desc' },
                        { label: 'Nombre', value: 'name-asc' },
                        { label: 'Ubicación', value: 'location' }
                        ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setSortOrder(opt.value as any)}
                            className={`
                            px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300
                            ${sortOrder === opt.value 
                                ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                                : 'text-slate-500 border border-transparent hover:text-cyan-200 hover:bg-white/5'}
                            `}
                        >
                            {opt.label}
                        </button>
                        ))}
                    </div>
                    
                    {/* Mobile Filter Toggle */}
                    <button 
                        className="md:hidden w-full py-3 bg-black/50 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/70 hover:text-cyan-300 hover:border-cyan-500/30 transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? 'Ocultar Filtros' : 'Mostrar Categorías y Orden'}
                    </button>
                    </div>

                    {/* Bottom Row: Categories */}
                    <div className={`
                    ${showFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-5 items-start md:items-center border-t border-white/10 pt-5 md:pt-3 mt-3 md:mt-0 relative z-10
                    `}>
                    {/* Mobile Sort */}
                    <div className="md:hidden flex flex-wrap gap-2 w-full mb-4">
                        {[
                        { label: 'Hz Bajo-Alto', value: 'hz-asc' },
                        { label: 'Hz Alto-Bajo', value: 'hz-desc' },
                        ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setSortOrder(opt.value as any)}
                            className={`flex-grow px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 ${sortOrder === opt.value ? 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-black/40 text-slate-500 border-white/10 hover:bg-white/5'}`}
                        >
                            {opt.label}
                        </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full">
                        {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border
                            ${activeCategory === cat.id 
                                ? `bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.15),inset_0_0_10px_rgba(255,255,255,0.05)] scale-105` 
                                : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300 hover:border-white/10'}
                            `}
                        >
                            <Icon name={cat.iconName} size={14} className={activeCategory === cat.id ? `${cat.color} drop-shadow-[0_0_5px_currentColor]` : ''} />
                            {cat.label}
                        </button>
                        ))}
                    </div>
                    </div>
                </div>
                </div>

                {/* --- Results Grid --- */}
                {filteredData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-32">
                    {filteredData.map((item, index) => (
                    <FrequencyCard 
                        key={item.id} 
                        item={item} 
                        delay={index * 50} 
                        onAddToPlayer={handleAddToPlayer}
                    />
                    ))}
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center py-32 text-slate-600 animate-fade-in">
                    <Icon name="Activity" size={64} className="mb-6 opacity-20" />
                    <h3 className="text-xl font-light">No hay resonancia en este espectro.</h3>
                    <p className="text-sm mt-2">Intenta ajustar tu búsqueda o filtros.</p>
                </div>
                )}
            </div>
        )}

        {/* --- VIEW: GENERATOR --- */}
        {viewMode === 'generator' && (
            <Generator 
                audio={audio} 
                isMasterPlaying={audio.isPlaying}
                activeVizTab={activeVizTab}
                onVizTabChange={setActiveVizTab}
                onStartLiveSession={(preset) => {
                    setPresetToStart(preset);
                    setShowStartSessionModal(true);
                }}
                sessionPermissions={activeSession && (activeSession.hostId === currentUser?.id || (!currentUser && activeSession.hostId === 'local-host'))
                    ? { ...sessionPermissions, canEditFrequencies: true }
                    : sessionPermissions}
            />
        )}

        {/* --- VIEW: ONLINE --- */}
        {viewMode === 'online' && (
           <div className="h-[80vh]">
            <OnlineLibrary 
              currentOscillators={audio.oscillators}
              onLoadPreset={(node) => {
                 if (node.content) {
                     // Just adding the oscillators for now
                     node.content.oscillators.forEach(osc => {
                         audio.addOscillator(osc);
                     });
                     setViewMode('generator');
                 }
              }}
              onJoinSession={(session) => {
                 setActiveSession(session);
                 setViewMode('generator');
              }}
              onStartSessionRequest={() => {
                  setPresetToStart({
                    id: crypto.randomUUID(),
                    name: 'Sintonización en Vivo',
                    content: { oscillators: audio.oscillators }
                  } as any);
                  setShowStartSessionModal(true);
              }}
            />
           </div>
        )}
        </>
      </div>

      {/* --- Global Player --- */}
      <GlobalPlayer audio={audio} />

      {/* --- Live Sync Call Overlay --- */}
      {activeSession && (
         <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 md:w-[400px] max-h-[80vh] flex flex-col pointer-events-none">
            <div className="pointer-events-auto shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black/80 backdrop-blur-md">
               <ErrorBoundary>
                 <LiveSyncCall 
                    session={activeSession} 
                    currentUser={currentUser || { id: 'anonymous', displayName: 'Explorador', email: '' } as any} 
                    onLeave={() => {
                        setActiveSession(null);
                        setSessionPermissions({
                          canEditFrequencies: true,
                          canUseMic: true,
                          canUseVideo: true,
                          canChat: true,
                        });
                    }} 
                    currentOscillators={audio.oscillators}
                    activeVizTab={activeVizTab}
                    onSyncReceive={(oscillators, latency, vizTab) => {
                        audio.syncFromRemote(oscillators);
                        // NOTA: Ignoramos vizTab para desacoplar el visualizador. 
                        // Cada usuario puede elegir su vista local.
                    }}
                    onPermissionsChange={(perms) => setSessionPermissions(perms)}
                    onEndSession={() => setActiveSession(null)}
                 />
               </ErrorBoundary>
            </div>
         </div>
      )}

      {/* --- Modals --- */}
      {showStartSessionModal && presetToStart && (
         <StartLiveSessionModal 
            preset={presetToStart}
            onClose={() => {
                setShowStartSessionModal(false);
                setPresetToStart(null);
            }}
            onSessionStarted={(session) => {
                setShowStartSessionModal(false);
                setPresetToStart(null);
                setActiveSession(session);
                setViewMode('generator');
            }}
         />
      )}
    </div>
    </ErrorBoundary>
  );
};

export default App;
