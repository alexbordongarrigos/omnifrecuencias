import React from 'react';
import Icon from './Icon';

const Introduction: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in text-slate-300 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex justify-center items-center gap-6 mb-4">
           <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]" title="OmniFrecuencias">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l3 -9 6 18 3 -9h3" />
               <circle cx="12" cy="12" r="10" strokeWidth="1" strokeDasharray="2 4" />
             </svg>
           </div>
           <div className="w-8 h-px bg-gradient-to-r from-cyan-500/50 to-amber-500/50"></div>
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-950/50 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]" title="Starseed OS">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20M4.929 4.929l14.142 14.142M4.929 19.071L19.071 4.929M12 8a4 4 0 100 8 4 4 0 000-8z" />
             </svg>
           </div>
        </div>
        
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
          Bienvenidos a OmniFrecuencias
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Un motor avanzado de resonancias, secuencias binaurales y cimática holográfica diseñado para sintonizar tu mente, cuerpo y entorno mediante geometrías cuánticas. Integra la consciencia global de <span className="text-amber-400 font-bold">Starseed OS</span>.
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-black/40 border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
          <div className="w-12 h-12 bg-cyan-950/50 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/30">
            <Icon name="Zap" size={24} className="text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Generador y Resonancias</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Combina osciladores senoidales, cuadrados y triangulares. Modula secuencias LFO, paneo 3D y secuencias binaurales. Incluye recetas maestras (Solfeggio, Schumann, Geometría Sagrada).
          </p>
        </div>

        <div className="bg-black/40 border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
          <div className="w-12 h-12 bg-purple-950/50 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30">
            <Icon name="Eye" size={24} className="text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Cimática y Holografía</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Visualiza las ondas en tiempo real. Utiliza el motor cuántico para proyectar un **Espiral Fractal** o un Osciloscopio 3D. Renderiza Geometría Sagrada (Flor de la Vida, Metatrón) sincronizada a tus armónicos.
          </p>
        </div>

        <div className="bg-black/40 border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
          <div className="w-12 h-12 bg-pink-950/50 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/30">
            <Icon name="Users" size={24} className="text-pink-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Entonación Colectiva (WebRTC)</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Crea sesiones en vivo públicas para sintonizar colectivamente. Transmite el estado de tu onda y comunícate con micrófono y chat con otros participantes en tiempo real.
          </p>
        </div>

        <div className="bg-black/40 border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
          <div className="w-12 h-12 bg-amber-950/50 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30">
            <Icon name="Cloud" size={24} className="text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Ecosistema Starseed OS</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Sincroniza tus presets de manera global a través de tu cuenta Starseed. Explora la librería pública **Vibras** y descubre las frecuencias subidas por otros exploradores del universo.
          </p>
        </div>

      </div>

      {/* Downloads Section */}
      <div className="mt-12 bg-black/60 border border-white/10 p-8 rounded-3xl backdrop-blur-xl flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-emerald-950/50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
          <Icon name="Download" size={32} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
        </div>
        <h3 className="text-2xl font-black text-white mb-4">Descarga la App Nativa</h3>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          Para disfrutar del máximo rendimiento, aceleración de hardware para la geometría 3D y audio de baja latencia, descarga OmniFrecuencias en tu dispositivo.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {/* Enlaces a los Releases de GitHub */}
          <a href="https://github.com/alexbordongarrigos/omnifrecuencias/releases/latest" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-all">
            <Icon name="Apple" size={20} />
            <div className="text-left">
               <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Descargar para</span>
               <span className="block font-bold text-sm text-white">macOS</span>
            </div>
          </a>
          <a href="https://github.com/alexbordongarrigos/omnifrecuencias/releases/latest" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 hover:border-blue-400 rounded-xl transition-all">
            <Icon name="Monitor" size={20} className="text-blue-400" />
            <div className="text-left">
               <span className="block text-[10px] text-blue-200/70 uppercase tracking-wider font-bold">Descargar para</span>
               <span className="block font-bold text-sm text-blue-100">Windows</span>
            </div>
          </a>
          <a href="https://github.com/alexbordongarrigos/omnifrecuencias/releases/latest" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-green-950/40 hover:bg-green-900/60 border border-green-500/30 hover:border-green-400 rounded-xl transition-all">
            <Icon name="Smartphone" size={20} className="text-green-400" />
            <div className="text-left">
               <span className="block text-[10px] text-green-200/70 uppercase tracking-wider font-bold">Descargar apk</span>
               <span className="block font-bold text-sm text-green-100">Android</span>
            </div>
          </a>
          <a href="https://github.com/alexbordongarrigos/omnifrecuencias/releases/latest" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-all">
            <Icon name="Apple" size={20} />
            <div className="text-left">
               <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Instrucciones</span>
               <span className="block font-bold text-sm text-white">iOS</span>
            </div>
          </a>
        </div>
      </div>

      {/* Links Section */}
      <div className="mt-12 bg-gradient-to-br from-cyan-950/40 via-purple-950/20 to-black border border-cyan-500/20 p-8 rounded-3xl backdrop-blur-xl flex flex-col items-center text-center">
        <h3 className="text-2xl font-black text-white mb-6">Enlaces y Referencias</h3>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          OmniFrecuencias es parte del ecosistema de consciencia cuántica de Starseed System. Puedes encontrar nuestro código abierto, explorar nuestro sistema operativo o sumergirte en proyectos hermanos de visualización.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://github.com/alexbordongarrigos/omnifrecuencias" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all">
            <Icon name="Github" size={20} />
            <span className="font-bold text-sm">Repositorio Oficial</span>
          </a>
          <a href="https://github.com/StarSeedSystem/starseed-system" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-cyan-300 transition-all">
            <Icon name="Globe" size={20} />
            <span className="font-bold text-sm">Starseed OS</span>
          </a>
          <a href="https://github.com/alexbordongarrigos/audiomorphic-ar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/30 hover:border-purple-400 rounded-xl text-purple-300 transition-all">
            <Icon name="Eye" size={20} />
            <span className="font-bold text-sm">Audiomorphic AR</span>
          </a>
        </div>
      </div>
      
    </div>
  );
};

export default Introduction;
