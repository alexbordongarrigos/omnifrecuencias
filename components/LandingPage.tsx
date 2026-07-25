import React, { useState, useEffect } from 'react';
import Icon from './Icon';

interface Props {
  onEnterWeb: () => void;
}

const AppIcon = () => (
  <div className="relative flex items-center justify-center w-32 h-32 mb-8 group">
    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 animate-pulse"></div>
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transform group-hover:scale-105 transition-transform duration-500">
      <defs>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* Outer Rings */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#iconGrad)" strokeWidth="1" opacity="0.3" strokeDasharray="4 4" className="animate-[spin_20s_linear_infinite]" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="url(#iconGrad)" strokeWidth="2" opacity="0.5" className="animate-[spin_15s_linear_infinite_reverse]" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="url(#iconGrad)" strokeWidth="3" opacity="0.8" filter="url(#glow)" />
      
      {/* Infinity / Wave symbol */}
      <path d="M 25 50 C 25 20, 50 20, 50 50 C 50 80, 75 80, 75 50 C 75 20, 50 20, 50 50 C 50 80, 25 80, 25 50 Z" fill="none" stroke="#ffffff" strokeWidth="3" filter="url(#glow)" className="animate-pulse" />
      
      {/* Center Core */}
      <circle cx="50" cy="50" r="6" fill="#ffffff" filter="url(#glow)" />
    </svg>
  </div>
);

type OS = 'mac' | 'windows' | 'android' | 'ios' | 'linux' | 'unknown';

const LandingPage: React.FC<Props> = ({ onEnterWeb }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [os, setOs] = useState<OS>('unknown');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // OS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac') && !userAgent.includes('iphone') && !userAgent.includes('ipad')) setOs('mac');
    else if (userAgent.includes('win')) setOs('windows');
    else if (userAgent.includes('android')) setOs('android');
    else if (userAgent.includes('iphone') || userAgent.includes('ipad')) setOs('ios');
    else if (userAgent.includes('linux')) setOs('linux');

    // Online Status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // PWA Install Prompt
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("Para instalar en iOS: Toca el botón 'Compartir' y luego 'Añadir a la pantalla de inicio'.\n\nPara instalar en Android/Windows: Usa la opción 'Instalar aplicación' en el menú de tu navegador.");
    }
  };

  const downloadDatabase = () => {
    const db = {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      description: "Base de datos maestra de frecuencias y resonancias",
      presets: []
    };
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'omni_database_latest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDownloadLink = () => {
    const base = "https://github.com/alexbordongarrigos/omni-frecuencias-holograficas/releases/latest/download";
    switch(os) {
      case 'mac': return `${base}/OmniFrequency-mac.dmg`;
      case 'windows': return `${base}/OmniFrequency-setup.exe`;
      case 'android': return `${base}/OmniFrequency.apk`;
      case 'linux': return `${base}/OmniFrequency.AppImage`;
      case 'ios': return 'https://apps.apple.com/app/omnifrequency/id123456789'; // Mock App Store Link
      default: return 'https://github.com/alexbordongarrigos/omni-frecuencias-holograficas/releases';
    }
  };

  const getOsLabel = () => {
    switch(os) {
      case 'mac': return 'macOS';
      case 'windows': return 'Windows';
      case 'android': return 'Android';
      case 'ios': return 'iOS (App Store)';
      case 'linux': return 'Linux';
      default: return 'Todas las plataformas';
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay z-0"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center animate-fade-in">
        <AppIcon />
        
        <h1 className="text-5xl md:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)] mb-4 text-center tracking-tight">
          OmniFrequency
        </h1>
        <p className="text-lg md:text-xl text-slate-400 font-medium tracking-wide text-center max-w-2xl mb-8">
          El generador de resonancias y frecuencias maestras más avanzado. Sintoniza tu mente, cuerpo y entorno.
        </p>

        {/* Network Status */}
        {!isOnline && (
          <div className="mb-8 px-4 py-2 rounded-full bg-red-900/30 border border-red-500/50 text-red-200 text-sm flex items-center gap-2">
            <Icon name="WifiOff" size={16} /> Estás desconectado. Las descargas pueden fallar y las funciones online están limitadas.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
          {/* Web Version Card */}
          <div className="group relative bg-black/40 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_10px_50px_rgba(34,211,238,0.2),inset_0_0_30px_rgba(34,211,238,0.05)] transition-all duration-500 overflow-hidden flex flex-col items-center text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(34,211,238,0.2)] group-hover:scale-110 transition-transform duration-500">
              <Icon name="Globe" size={40} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-3 tracking-wide">Versión Web</h2>
            <p className="text-sm text-slate-400 mb-8 flex-grow">
              Accede instantáneamente desde tu navegador. Incluye sincronización en la nube mediante Starseed OS y librería de presets en línea.
            </p>
            
            <button 
              onClick={onEnterWeb}
              className="w-full relative flex items-center justify-center gap-3 px-8 py-4 bg-cyan-950/50 hover:bg-cyan-500 text-cyan-200 hover:text-black rounded-2xl text-sm font-bold uppercase tracking-widest transition-all duration-500 border border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
            >
              <Icon name="Network" size={18} />
              <span>Entrar a la Web</span>
              <Icon name="ArrowRight" size={18} />
            </button>
          </div>

          {/* Downloadable / Installable Version Card */}
          <div className="group relative bg-black/40 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_10px_50px_rgba(168,85,247,0.2),inset_0_0_30px_rgba(168,85,247,0.05)] transition-all duration-500 overflow-hidden flex flex-col items-center text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)] group-hover:scale-110 transition-transform duration-500">
              <Icon name="Download" size={40} className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-3 tracking-wide">Instalar App Oficial</h2>
            <p className="text-sm text-slate-400 mb-6">
              Instala la aplicación en {getOsLabel()} con soporte offline, físicas 3D avanzadas y actualizaciones automáticas silenciosas garantizadas.
            </p>
            
            <div className="w-full flex flex-col gap-3 mb-6">
              {/* Primary Install Button */}
              <button 
                onClick={handleInstall}
                className="w-full relative flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-sm font-bold uppercase tracking-widest transition-all duration-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.8)]"
              >
                <Icon name="Download" size={18} />
                <span>Instalar para {getOsLabel()}</span>
              </button>

              {/* Status Message */}
              {isStandalone && (
                <div className="text-xs text-purple-300 font-bold uppercase tracking-wider mt-2">
                  <Icon name="Check" size={12} className="inline mr-1" />
                  App ya instalada
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

