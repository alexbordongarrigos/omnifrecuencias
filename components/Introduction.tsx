import React from 'react';
import Icon from './Icon';

const Introduction: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in text-slate-300 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)] mb-4">
          <Icon name="Info" size={48} className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        </div>
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
          Bienvenidos a OmniFrecuencias
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Un motor avanzado de resonancias, secuencias binaurales y cimática holográfica diseñado para sintonizar tu mente, cuerpo y entorno mediante geometrías cuánticas.
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
