import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { useMeshSync } from '../hooks/useMeshSync';

interface MeshSignalMapProps {
  onSelectNode?: (nodeId: string) => void;
}

export interface AntennaStatus {
  id: string;
  name: string;
  type: 'ble' | 'wifi' | 'lora' | 'webrtc';
  frequency: string;
  active: boolean;
  nodesCount: number;
  snr: string;
}

const MeshSignalMap: React.FC<MeshSignalMapProps> = ({ onSelectNode }) => {
  const { nodes, connectionState, connectToMesh, injectMockNode, latencyDelta } = useMeshSync();
  const [privacyMode, setPrivacyMode] = useState<'public' | 'contacts' | 'stealth'>('public');
  const [selectedBand, setSelectedBand] = useState<string>('all');
  const [radarAngle, setRadarAngle] = useState(0);

  // Antenna Hardware States
  const [antennas, setAntennas] = useState<AntennaStatus[]>([
    { id: 'ble', name: 'Bluetooth LE Mesh', type: 'ble', frequency: '2.4 GHz', active: true, nodesCount: 3, snr: '12 dB' },
    { id: 'wifi', name: 'Wi-Fi Direct Subnet', type: 'wifi', frequency: '5.0 GHz', active: true, nodesCount: 5, snr: '24 dB' },
    { id: 'lora', name: 'LoRa Meshtastic Serial', type: 'lora', frequency: '915 MHz', active: connectionState === 'connected', nodesCount: nodes.length, snr: `${Math.round(latencyDelta)} ms` },
    { id: 'webrtc', name: 'WebRTC Quantum Relay', type: 'webrtc', frequency: 'Cloud IP', active: true, nodesCount: 8, snr: '18 dB' }
  ]);

  // Radar sweep animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const toggleAntenna = (id: string) => {
    setAntennas((prev) =>
      prev.map((ant) => (ant.id === id ? { ...ant, active: !ant.active } : ant))
    );
  };

  // Simulated & Detected Nodes
  const allNodes = [
    { id: 'node-1', name: 'Nodo Resonante Alfa', distance: 85, snr: 14, band: 'wifi', status: 'online', lat: 0.3, lng: 0.4 },
    { id: 'node-2', name: 'Antena Cuántica Sol 915', distance: 340, snr: 9, band: 'lora', status: 'online', lat: -0.5, lng: 0.2 },
    { id: 'node-3', name: 'Transmisor Mesh BLE', distance: 45, snr: 22, band: 'ble', status: 'online', lat: 0.1, lng: -0.3 },
    { id: 'node-4', name: 'Servidor Relay Quantum', distance: 1200, snr: 18, band: 'webrtc', status: 'online', lat: -0.7, lng: -0.6 },
    ...nodes.map((n, idx) => ({
      id: n.num || `mesh-${idx}`,
      name: n.longName || n.shortName || 'Nodo Meshtastic',
      distance: 150 + idx * 50,
      snr: n.snr || 10,
      band: 'lora',
      status: 'online',
      lat: (idx % 2 === 0 ? 1 : -1) * 0.4,
      lng: (idx % 3 === 0 ? 1 : -1) * 0.5
    }))
  ].filter((n) => selectedBand === 'all' || n.band === selectedBand);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Banner & Control Bar */}
      <div className="bg-black/60 border border-cyan-500/30 rounded-3xl p-5 backdrop-blur-xl relative overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)]">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-xl font-bold text-white tracking-wide">Mapa de Señales y Red Mesh Starseed OS</h2>
            </div>
            <p className="text-xs text-slate-400">
              Escaneo multibanda de antenas inteligentes P2P (BLE, Wi-Fi Direct, Sub-GHz LoRa y WebRTC)
            </p>
          </div>

          {/* Privacy Level Selector */}
          <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-2xl border border-white/10">
            <Icon name="Shield" size={14} className="text-amber-400 ml-1" />
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">Privacidad:</span>
            <select
              value={privacyMode}
              onChange={(e) => setPrivacyMode(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer pr-2"
            >
              <option value="public" className="bg-slate-900 text-white">Mapa Público (Visible)</option>
              <option value="contacts" className="bg-slate-900 text-white">Solo Contactos Vinculados</option>
              <option value="stealth" className="bg-slate-900 text-white">Modo Fantasma (Invisible)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar View & Hardware Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RADAR VISUALIZER CANVAS (8 Cols) */}
        <div className="lg:col-span-7 bg-black/80 border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[420px] shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/30 via-black to-black pointer-events-none" />
          
          {/* Radar Container */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-cyan-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.15)]">
            {/* Concentric Circles */}
            <div className="absolute inset-4 rounded-full border border-cyan-500/20 border-dashed" />
            <div className="absolute inset-16 rounded-full border border-cyan-500/20" />
            <div className="absolute inset-28 rounded-full border border-cyan-500/10 border-dashed" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-cyan-500/20" />
              <div className="h-full w-px bg-cyan-500/20 absolute" />
            </div>

            {/* Sweep Line */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `conic-gradient(from ${radarAngle}deg at 50% 50%, rgba(34, 211, 238, 0.4) 0deg, rgba(34, 211, 238, 0) 60deg)`
              }}
            />

            {/* Center User Node */}
            <div className="relative z-20 w-6 h-6 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_20px_rgba(34,211,238,1)] flex items-center justify-center text-[10px] font-black text-black">
              YO
            </div>

            {/* Plotted Signal Nodes */}
            {allNodes.map((node) => {
              const x = node.lng * 120;
              const y = node.lat * 120;
              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode && onSelectNode(node.id)}
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                  className="absolute z-30 cursor-pointer group flex flex-col items-center"
                >
                  <div className="w-4 h-4 rounded-full bg-purple-500 border border-white shadow-[0_0_12px_rgba(168,85,247,0.8)] group-hover:scale-125 transition-transform flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>
                  <div className="absolute top-5 bg-black/90 text-[9px] font-mono text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">
                    {node.name} ({node.distance}m)
                  </div>
                </div>
              );
            })}
          </div>

          {/* Radar Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 relative z-10">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Mi Ubicación
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Nodos P2P Detectados ({allNodes.length})
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-300">
              Desfase: Δ {Math.round(latencyDelta)}ms
            </span>
          </div>
        </div>

        {/* HARDWARE ANTENNAS & SPECTRUM PANEL (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Hardware Interfaces Status */}
          <div className="bg-black/60 border border-white/10 rounded-3xl p-5 backdrop-blur-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-2">
                <Icon name="Radio" size={14} /> Antenas del Dispositivo
              </h3>
              <button
                onClick={connectToMesh}
                className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold transition-all"
              >
                Escanear Antena USB/Serial
              </button>
            </div>

            <div className="space-y-2.5">
              {antennas.map((ant) => (
                <div
                  key={ant.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    ant.active
                      ? 'bg-white/5 border-cyan-500/30'
                      : 'bg-black/40 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        ant.active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon name="Wifi" size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{ant.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Banda: {ant.frequency} | SNR: {ant.snr}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleAntenna(ant.id)}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${
                      ant.active ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${
                        ant.active ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Mock Mesh Tester */}
          <div className="bg-black/60 border border-white/10 rounded-3xl p-5 backdrop-blur-xl flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-purple-400 flex items-center gap-2">
              <Icon name="Activity" size={14} /> Diagnóstico de Señal
            </h3>
            <div className="flex gap-2">
              <button
                onClick={injectMockNode}
                className="flex-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Icon name="Plus" size={14} /> Inyectar Nodo Test
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MeshSignalMap;
