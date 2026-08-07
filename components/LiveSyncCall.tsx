import React, { useEffect, useRef, useState } from 'react';
import { useWebRTC, RemoteStream } from '../hooks/useWebRTC';
import { useMeshSync } from '../hooks/useMeshSync';
import Icon from './Icon';
import { StarseedUser, supabase } from '../services/starseedAuth';
import { LiveSession, OscillatorState, FileSystemNode, PresetContent } from '../types';
import MeshSignalMap from './MeshSignalMap';
import VirtualVRRoom from './VirtualVRRoom';
import Visualizer from './Visualizer';
import { CymaticsVisualizer3D } from './CymaticsVisualizer3D';
import { SpiralVisualizer } from './SpiralVisualizer';
import OscillatorControls from './OscillatorControls';
import { useFileSystem } from '../hooks/useFileSystem';

interface Props {
  session: LiveSession;
  currentUser: StarseedUser;
  audio?: any;
  onLeave: () => void;
  currentOscillators: any[];
  activeVizTab?: '2d' | '3d' | 'spiral';
  onSyncReceive: (oscillators: any[], latencyMs?: number, vizTab?: string) => void;
  onPermissionsChange?: (perms: any) => void;
  onEndSession?: () => void;
}

const VideoPlayer: React.FC<{ stream: MediaStream; isLocal?: boolean; displayName: string }> = ({ stream, isLocal, displayName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black/90 border border-cyan-500/40 group aspect-video shadow-[0_0_25px_rgba(0,0,0,0.9)]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
      />
      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/10 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        {displayName} {isLocal && '(Tú)'}
      </div>
    </div>
  );
};

const LiveSyncCall: React.FC<Props> = ({
  session,
  currentUser,
  audio,
  onLeave,
  currentOscillators,
  activeVizTab,
  onSyncReceive,
  onPermissionsChange
}) => {
  const isHost = session.hostId === currentUser.id || (session.hostId === 'local-host' && currentUser.id === 'anonymous');
  const lastSentState = useRef<string>('');
  
  // View Modes: 'studio' (Ventana Completa) vs 'compact' (Widget Flotante)
  const [viewMode, setViewMode] = useState<'studio' | 'compact'>('studio');
  const [studioTab, setStudioTab] = useState<'visualizers' | 'generator' | 'video' | 'private_groups' | 'radar' | 'host' | 'filter'>('visualizers');

  // VR Room Overlay State
  const [showVRRoom, setShowVRRoom] = useState(false);

  // Compact Quick Mini-Popups
  const [compactPopup, setCompactPopup] = useState<'none' | 'graphics' | 'matrix' | 'radar' | 'privacy'>('none');

  // Mix & Load Preset Modal
  const [showMixModal, setShowMixModal] = useState(false);
  const [mixTab, setMixTab] = useState<'private' | 'community'>('private');
  const [communityPresets, setCommunityPresets] = useState<any[]>([]);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

  // Modals & User Personal Privacy Scope
  const [showExitModal, setShowExitModal] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [personalOffset, setPersonalOffset] = useState<number>(0);
  const [userTransmissionScope, setUserTransmissionScope] = useState<'public' | 'select' | 'listen_only'>('public');
  const [expandedViz, setExpandedViz] = useState<'2d' | '3d' | 'spiral' | null>(null);

  // Private Sub-Call states
  const [activePrivatePeer, setActivePrivatePeer] = useState<string | null>(null);
  const [privateGroupUserIds, setPrivateGroupUserIds] = useState<string[]>([]);

  // Host Permissions State
  const [localPermissions, setLocalPermissions] = useState({
    canEditFrequencies: true,
    canUseMic: true,
    canUseVideo: true,
    canChat: true,
  });

  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fs = useFileSystem();

  // Load Community Presets for Mixing
  useEffect(() => {
    if (showMixModal && mixTab === 'community') {
      setIsLoadingCommunity(true);
      supabase
        .from('omni_presets')
        .select('*')
        .eq('is_public', true)
        .then(({ data }) => {
          setCommunityPresets(data || []);
          setIsLoadingCommunity(false);
        });
    }
  }, [showMixModal, mixTab]);

  const handleSyncReceive = (oscillators: any[], latencyMs: number = 0, vizTab?: string) => {
    const adjustedOscillators = personalOffset !== 0 ? oscillators.map(osc => ({
      ...osc,
      frequency: Math.max(1, osc.frequency + personalOffset)
    })) : oscillators;

    lastSentState.current = JSON.stringify({ oscillators: adjustedOscillators, vizTab });
    onSyncReceive(adjustedOscillators, latencyMs, vizTab);
  };

  const {
    localStream,
    remoteStreams,
    participants,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    chatMessages,
    sendChatMessage,
    broadcastOscillatorSync,
    permissions: remotePermissions,
    broadcastPermissions
  } = useWebRTC(session.id, currentUser.id, currentUser.displayName, session.useGlobalWebRTC !== false, handleSyncReceive);

  const activePermissions = isHost ? localPermissions : remotePermissions;

  useEffect(() => {
    if (onPermissionsChange) {
      onPermissionsChange(activePermissions);
    }
  }, [activePermissions, onPermissionsChange]);

  const updateHostPermissions = (changes: any) => {
    if (!isHost) return;
    const newPerms = { ...localPermissions, ...changes };
    setLocalPermissions(newPerms);
    broadcastPermissions(newPerms);
  };

  const {
    connectionState: meshState,
    latencyDelta,
    broadcastData: broadcastMeshOscillators
  } = useMeshSync((payload) => {
    if (payload.type === 'oscillator_sync' && payload.sender !== currentUser.id) {
       const latency = payload.timestamp ? Date.now() - payload.timestamp : latencyDelta;
       handleSyncReceive(payload.oscillators, latency, payload.vizTab);
    }
  });

  useEffect(() => {
    const currentState = JSON.stringify({ oscillators: currentOscillators, vizTab: activeVizTab });
    if (currentState !== lastSentState.current) {
      lastSentState.current = currentState;
      const timeoutId = setTimeout(() => {
        broadcastOscillatorSync(currentOscillators, activeVizTab);
        broadcastMeshOscillators({
          type: 'oscillator_sync',
          sender: currentUser.id,
          oscillators: currentOscillators,
          vizTab: activeVizTab
        });
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [currentOscillators, activeVizTab, broadcastOscillatorSync, broadcastMeshOscillators, currentUser.id]);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const togglePrivateGroupUser = (userId: string) => {
    setPrivateGroupUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const activeFrequenciesList = currentOscillators.map(o => o.frequency);
  const analyserNode = audio?.analyser || null;

  // Mix / Replace Presets Logic
  const handleApplyPresetToLive = (presetOscillators: OscillatorState[], mode: 'replace' | 'mix') => {
    if (!audio) return;
    if (mode === 'replace') {
      audio.loadPreset({ oscillators: presetOscillators });
    } else {
      presetOscillators.forEach((osc) => {
        audio.addOscillator({
          frequency: osc.frequency,
          waveform: osc.waveform || 'sine',
          gain: osc.gain || 0.5,
          pan: osc.pan || 0
        });
      });
    }
    setShowMixModal(false);
  };

  // Helper recursive function to get all private files
  const getPrivateFiles = (node: FileSystemNode): FileSystemNode[] => {
    let res: FileSystemNode[] = [];
    if (node.type === 'file') res.push(node);
    if (node.children) {
      node.children.forEach(c => {
        res = res.concat(getPrivateFiles(c));
      });
    }
    return res;
  };

  const privateFiles = getPrivateFiles(fs.root);

  // Generator Helper Actions inside Live Studio
  const handleAddOscillator = () => {
    if (audio?.addOscillator) {
      audio.addOscillator();
    }
  };

  const handleUpdateOscillator = (id: string, updates: Partial<OscillatorState>) => {
    if (audio?.updateOscillator) {
      audio.updateOscillator(id, updates);
    }
  };

  const handleRemoveOscillator = (id: string) => {
    if (audio?.removeOscillator) {
      audio.removeOscillator(id);
    }
  };

  const handleSolfeggioAdd = (freq: number, label: string) => {
    if (audio?.addOscillator) {
      audio.addOscillator({
        frequency: freq,
        waveform: 'sine',
        gain: 0.5,
        pan: 0
      });
    }
  };

  // -------------------------------------------------------------
  // FULL STUDIO VIEW (ESTUDIO HOLOFÓNICO COMPLETO - VENTANA COMPLETA)
  // -------------------------------------------------------------
  if (viewMode === 'studio') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-2xl animate-fade-in">
        <div className="bg-[#070a14] border border-cyan-500/40 rounded-3xl w-full max-w-7xl h-[94vh] flex flex-col shadow-[0_0_90px_rgba(34,211,238,0.25)] overflow-hidden relative">
          
          {/* Virtual VR Room Launcher Modal */}
          {showVRRoom && (
            <VirtualVRRoom
              participants={participants.map((p) => ({
                id: p.id,
                name: p.displayName,
                color: p.id === currentUser.id ? '#22d3ee' : '#a855f7'
              }))}
              currentUserId={currentUser.id}
              analyser={analyserNode}
              frequencies={activeFrequenciesList}
              onClose={() => setShowVRRoom(false)}
            />
          )}

          {/* Preset Mix & Load Modal */}
          {showMixModal && (
            <div className="absolute inset-0 z-[130] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0f172a] border border-amber-500/50 p-6 rounded-3xl max-w-2xl w-full shadow-[0_0_60px_rgba(245,158,11,0.3)] flex flex-col gap-4 max-h-[85vh]">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                  <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                    <Icon name="Folder" size={20} /> Mezclar / Cargar Partículas & Presets en Vivo
                  </h3>
                  <button onClick={() => setShowMixModal(false)} className="text-slate-400 hover:text-white">
                    <Icon name="X" size={18} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-white/10 pb-2">
                  <button
                    onClick={() => setMixTab('private')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      mixTab === 'private' ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    Mi Biblioteca Privada (Folders)
                  </button>
                  <button
                    onClick={() => setMixTab('community')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      mixTab === 'community' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    Librería de la Comunidad (Partículas)
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                  {mixTab === 'private' && (
                    <div className="space-y-2">
                      {privateFiles.map((file) => (
                        <div key={file.id} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">{file.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Preset Armónico Privado</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (file.content?.oscillators) {
                                  handleApplyPresetToLive(file.content.oscillators, 'mix');
                                }
                              }}
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded-xl text-xs font-bold transition-all border border-amber-500/40"
                            >
                              + Mezclar
                            </button>
                            <button
                              onClick={() => {
                                if (file.content?.oscillators) {
                                  handleApplyPresetToLive(file.content.oscillators, 'replace');
                                }
                              }}
                              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black rounded-xl text-xs font-bold transition-all border border-cyan-500/40"
                            >
                              Reemplazar
                            </button>
                          </div>
                        </div>
                      ))}
                      {privateFiles.length === 0 && (
                        <p className="text-xs text-slate-500 italic py-8 text-center">No hay archivos en tu biblioteca privada.</p>
                      )}
                    </div>
                  )}

                  {mixTab === 'community' && (
                    <div className="space-y-2">
                      {isLoadingCommunity ? (
                        <p className="text-xs text-cyan-400 font-bold py-8 text-center flex items-center justify-center gap-2">
                          <Icon name="Loader" className="animate-spin" /> Cargando Partículas Públicas...
                        </p>
                      ) : (
                        communityPresets.map((preset) => (
                          <div key={preset.id} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-white block">{preset.name}</span>
                              <span className="text-[10px] text-purple-300">Categoría: {preset.category || 'Sol'}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (preset.content?.oscillators) {
                                    handleApplyPresetToLive(preset.content.oscillators, 'mix');
                                  }
                                }}
                                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded-xl text-xs font-bold transition-all border border-amber-500/40"
                              >
                                + Mezclar
                              </button>
                              <button
                                onClick={() => {
                                  if (preset.content?.oscillators) {
                                    handleApplyPresetToLive(preset.content.oscillators, 'replace');
                                  }
                                }}
                                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black rounded-xl text-xs font-bold transition-all border border-cyan-500/40"
                              >
                                Reemplazar
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Studio Top Header Bar */}
          <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black/60 shrink-0 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">{session.presetName}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Estudio Holofónico
                  </span>
                </div>
                <p className="text-xs text-amber-400 font-bold">
                  Host: {session.hostName} {isHost && '(Tú)'} | {participants.length} Entonadores Conectados
                </p>
              </div>
            </div>

            {/* VR Launch & Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowVRRoom(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-extrabold rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(34,211,238,0.5)] flex items-center gap-2"
              >
                <Icon name="Compass" size={16} />
                <span>Sala Virtual VR/3D</span>
              </button>

              {/* MINIMIZE TO FLOATING WIDGET BUTTON */}
              <button
                onClick={() => setViewMode('compact')}
                className="px-3.5 py-2 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black rounded-xl text-xs font-bold transition-all border border-cyan-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,211,238,0.3)] cursor-pointer"
                title="Cambiar a Widget Flotante"
              >
                <Icon name="Minimize2" size={16} />
                <span>Widget Flotante</span>
              </button>

              <button
                onClick={() => isHost ? setShowExitModal(true) : onLeave()}
                className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/40 flex items-center gap-1.5"
              >
                <Icon name="LogOut" size={14} />
                <span>Desconectar</span>
              </button>
            </div>
          </div>

          {/* Studio Navigation Tabs Bar */}
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-white/5 bg-black/40 overflow-x-auto custom-scrollbar shrink-0">
            <button
              onClick={() => setStudioTab('visualizers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                studioTab === 'visualizers' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Icon name="Activity" size={16} /> 3 Gráficas Simultáneas
            </button>

            <button
              onClick={() => setStudioTab('generator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                studioTab === 'generator' ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Icon name="Sliders" size={16} /> Matriz del Generador ({currentOscillators.length})
            </button>

            <button
              onClick={() => setStudioTab('video')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                studioTab === 'video' ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Icon name="Video" size={16} /> Llamada Abierta Audio/Video
            </button>

            <button
              onClick={() => setStudioTab('private_groups')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                studioTab === 'private_groups' ? 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Icon name="Users" size={16} /> Llamadas Privadas y Sub-Grupos
            </button>

            <button
              onClick={() => setStudioTab('radar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                studioTab === 'radar' ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Icon name="Radio" size={16} className="animate-pulse" /> Radar Mesh
            </button>

            {isHost && (
              <button
                onClick={() => setStudioTab('host')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  studioTab === 'host' ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                <Icon name="Shield" size={16} /> Panel Anfitrión
              </button>
            )}

            <button
              onClick={() => setStudioTab('filter')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                studioTab === 'filter' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Icon name="Lock" size={16} /> Privacidad y Filtros
            </button>
          </div>

          {/* Studio Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex flex-col gap-6 relative">
            
            {/* TAB 1: 3 VISUALIZERS SIMULTANEOUS GRID CONNECTED TO ANALYSER */}
            {studioTab === 'visualizers' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm uppercase tracking-wider font-bold text-cyan-300 flex items-center gap-2">
                    <Icon name="Activity" size={18} /> Visualización Simultánea Multidimensional
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Frecuencias Activas: {activeFrequenciesList.join(', ')} Hz
                  </span>
                </div>

                <div className={`grid gap-4 ${expandedViz ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
                  {/* 1. ONDAS 2D */}
                  {(!expandedViz || expandedViz === '2d') && (
                    <div className="bg-black/60 border border-cyan-500/30 rounded-3xl p-4 flex flex-col gap-3 relative overflow-hidden shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                          <Icon name="Activity" size={14} /> Ondas 2D Resonantes
                        </span>
                        <button onClick={() => setExpandedViz(expandedViz === '2d' ? null : '2d')} className="p-1 text-slate-400 hover:text-white">
                          <Icon name={expandedViz === '2d' ? "Minimize2" : "Maximize2"} size={14} />
                        </button>
                      </div>
                      <div className="h-64 bg-black/80 rounded-2xl overflow-hidden border border-white/5 relative">
                        <Visualizer analyser={analyserNode} height={256} color="#22d3ee" type="fill" />
                      </div>
                    </div>
                  )}

                  {/* 2. CIMÁTICA 3D */}
                  {(!expandedViz || expandedViz === '3d') && (
                    <div className="bg-black/60 border border-purple-500/30 rounded-3xl p-4 flex flex-col gap-3 relative overflow-hidden shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-400 flex items-center gap-2">
                          <Icon name="Hexagon" size={14} /> Cimática 3D (Patrones Chladni)
                        </span>
                        <button onClick={() => setExpandedViz(expandedViz === '3d' ? null : '3d')} className="p-1 text-slate-400 hover:text-white">
                          <Icon name={expandedViz === '3d' ? "Minimize2" : "Maximize2"} size={14} />
                        </button>
                      </div>
                      <div className="h-64 bg-black/80 rounded-2xl overflow-hidden border border-white/5 relative">
                        <CymaticsVisualizer3D analyser={analyserNode} activeFrequencies={activeFrequenciesList} height={256} />
                      </div>
                    </div>
                  )}

                  {/* 3. ESPIRAL CUÁNTICA */}
                  {(!expandedViz || expandedViz === 'spiral') && (
                    <div className="bg-black/60 border border-pink-500/30 rounded-3xl p-4 flex flex-col gap-3 relative overflow-hidden shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-pink-400 flex items-center gap-2">
                          <Icon name="Aperture" size={14} /> Espiral Cuántica Armónica
                        </span>
                        <button onClick={() => setExpandedViz(expandedViz === 'spiral' ? null : 'spiral')} className="p-1 text-slate-400 hover:text-white">
                          <Icon name={expandedViz === 'spiral' ? "Minimize2" : "Maximize2"} size={14} />
                        </button>
                      </div>
                      <div className="h-64 bg-black/80 rounded-2xl overflow-hidden border border-white/5 relative">
                        <SpiralVisualizer analyser={analyserNode} activeFrequencies={activeFrequenciesList} height={256} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: EMBEDDED GENERATOR MATRIX */}
            {studioTab === 'generator' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black/60 p-4 rounded-2xl border border-amber-500/30 gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Icon name="Sliders" size={18} /> Matriz de Frecuencias y Generador en Vivo
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isHost || activePermissions.canEditFrequencies 
                        ? 'Edita y mezcla frecuencias armónicas en tiempo real para todos los entonadores conectados.'
                        : 'Visualizando configuración activa. Los permisos de edición están restringidos por el anfitrión.'}
                    </p>
                  </div>

                  {(isHost || activePermissions.canEditFrequencies) && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setShowMixModal(true)}
                        className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-extrabold rounded-2xl text-xs transition-all border border-amber-500/40 flex items-center gap-2 shadow-lg"
                      >
                        <Icon name="Folder" size={16} />
                        <span>Mezclar Presets / Partículas</span>
                      </button>

                      <button
                        onClick={handleAddOscillator}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-2xl text-xs transition-all shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center gap-2"
                      >
                        <Icon name="Plus" size={16} />
                        <span>+ Agregar Frecuencia</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Solfeggio Frequencies Injector */}
                {(isHost || activePermissions.canEditFrequencies) && (
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Inyectar Frecuencia Armónica Solfeggio / Sagrada:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { f: 432, l: '432 Hz Sol' },
                        { f: 528, l: '528 Hz ADN' },
                        { f: 639, l: '639 Hz Conexión' },
                        { f: 741, l: '741 Hz Limpieza' },
                        { f: 852, l: '852 Hz Intuición' },
                        { f: 963, l: '963 Hz Corona' }
                      ].map((item) => (
                        <button
                          key={item.f}
                          onClick={() => handleSolfeggioAdd(item.f, item.l)}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
                        >
                          + {item.l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Oscillators Matrix List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentOscillators.map((osc: OscillatorState) => (
                    <OscillatorControls
                      key={osc.id}
                      osc={osc}
                      update={handleUpdateOscillator}
                      remove={handleRemoveOscillator}
                      analyser={analyserNode}
                    />
                  ))}
                  {currentOscillators.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-black/40 rounded-3xl border border-white/5">
                      <Icon name="Activity" size={40} className="mx-auto mb-2 opacity-30 text-amber-400" />
                      <p className="text-xs">No hay osciladores en la sesión actual. Presiona "+ Agregar Frecuencia".</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: OPEN VIDEO & AUDIO GALLERY */}
            {studioTab === 'video' && (
              <div className="flex flex-col gap-6 h-full">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-black/60 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/20">
                      <Icon name="Wifi" size={14} /> {meshState === 'connected' ? 'Red Híbrida P2P' : 'WebRTC Servidor'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-mono text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                      <Icon name="Activity" size={14} /> Δ {Math.round(latencyDelta)}ms Desfase
                    </span>
                  </div>

                  {!isHost && (
                    <button
                      onClick={() => setHandRaised(!handRaised)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        handRaised 
                          ? 'bg-amber-500 text-black border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]' 
                          : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                      }`}
                    >
                      <Icon name="Hand" size={16} />
                      {handRaised ? 'Mano Levantada' : 'Pedir Palabra al Host'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                  {localStream && isVideoEnabled && (
                    <VideoPlayer stream={localStream} isLocal displayName={currentUser.displayName} />
                  )}
                  {remoteStreams.map((rs: RemoteStream) => (
                    <VideoPlayer key={rs.userId} stream={rs.stream} displayName={rs.displayName} />
                  ))}

                  {(!localStream || !isVideoEnabled) && remoteStreams.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-black/40 rounded-3xl border border-white/5">
                      <Icon name="VideoOff" size={48} className="mb-3 opacity-30 text-cyan-400" />
                      <h4 className="text-base font-bold text-slate-300">Cámara Desactivada</h4>
                      <p className="text-xs text-slate-500 mt-1">Usa los botones de control para transmitir audio y video.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: PRIVATE CALLS AND SUB-GROUPS */}
            {studioTab === 'private_groups' && (
              <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
                <div className="bg-black/60 p-6 rounded-3xl border border-fuchsia-500/40 flex flex-col gap-6 shadow-xl">
                  <div className="border-b border-fuchsia-500/30 pb-3">
                    <h3 className="text-base font-bold text-fuchsia-300 uppercase tracking-wider flex items-center gap-2">
                      <Icon name="Users" size={18} /> Llamadas Privadas Directas y Sub-Grupos P2P
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Inicia llamadas de audio/video 1-a-1 o selecciona grupos específicos para entonaciones privadas.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-3">
                      Crear / Editar Sub-Grupo de Entonación Privado
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {participants.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => togglePrivateGroupUser(p.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            privateGroupUserIds.includes(p.id)
                              ? 'bg-fuchsia-500/20 border-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                            <span className="text-xs font-bold truncate">{p.displayName} {p.id === currentUser.id && '(Tú)'}</span>
                          </div>
                          <Icon name={privateGroupUserIds.includes(p.id) ? "CheckCircle" : "Circle"} size={16} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-3">
                      Llamadas Directas 1-a-1
                    </h4>
                    <div className="space-y-3">
                      {participants.filter(p => p.id !== currentUser.id).map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{p.displayName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActivePrivatePeer(p.id)}
                              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-cyan-500/40"
                            >
                              <Icon name="Phone" size={14} /> Audio 1-a-1
                            </button>
                            <button
                              onClick={() => setActivePrivatePeer(p.id)}
                              className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-purple-500/40"
                            >
                              <Icon name="Video" size={14} /> Video 1-a-1
                            </button>
                          </div>
                        </div>
                      ))}
                      {participants.filter(p => p.id !== currentUser.id).length === 0 && (
                        <p className="text-xs text-slate-500 italic">No hay otros entonadores conectados por el momento.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: RADAR MESH */}
            {studioTab === 'radar' && (
              <div className="flex-1">
                <MeshSignalMap />
              </div>
            )}

            {/* TAB 6: HOST ADMIN PANEL */}
            {studioTab === 'host' && isHost && (
              <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
                <div className="bg-black/60 p-6 rounded-3xl border border-purple-500/40 flex flex-col gap-4 shadow-xl">
                  <h3 className="text-base font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2 border-b border-purple-500/30 pb-3">
                    <Icon name="Shield" size={18} /> Administración de Sala y Permisos
                  </h3>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                      <span className="text-sm text-slate-200 font-bold">Permitir Modificar Frecuencias</span>
                      <input
                        type="checkbox"
                        checked={activePermissions.canEditFrequencies}
                        onChange={e => updateHostPermissions({ canEditFrequencies: e.target.checked })}
                        className="accent-purple-500 w-5 h-5"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                      <span className="text-sm text-slate-200 font-bold">Uso de Micrófono</span>
                      <input
                        type="checkbox"
                        checked={activePermissions.canUseMic}
                        onChange={e => updateHostPermissions({ canUseMic: e.target.checked })}
                        className="accent-purple-500 w-5 h-5"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                      <span className="text-sm text-slate-200 font-bold">Uso de Cámara</span>
                      <input
                        type="checkbox"
                        checked={activePermissions.canUseVideo}
                        onChange={e => updateHostPermissions({ canUseVideo: e.target.checked })}
                        className="accent-purple-500 w-5 h-5"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: PRIVACY AND FILTERS */}
            {studioTab === 'filter' && (
              <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
                <div className="bg-black/60 p-6 rounded-3xl border border-cyan-500/40 flex flex-col gap-4 shadow-xl">
                  <h3 className="text-base font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2 border-b border-cyan-500/30 pb-3">
                    <Icon name="Lock" size={18} /> Ajustes de Privacidad y Ámbito Personal
                  </h3>

                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                      Mi Ámbito de Transmisión Personal
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserTransmissionScope('public')}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                          userTransmissionScope === 'public'
                            ? 'bg-cyan-500/30 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Icon name="Globe" size={18} />
                        <span>Público</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserTransmissionScope('select')}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                          userTransmissionScope === 'select'
                            ? 'bg-purple-500/30 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Icon name="UserCheck" size={18} />
                        <span>Selección</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserTransmissionScope('listen_only')}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                          userTransmissionScope === 'listen_only'
                            ? 'bg-amber-500/30 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Icon name="EyeOff" size={18} />
                        <span>Solo Escuchar</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm text-slate-200 font-bold mb-2">
                      <span>Sintonización Fina Personal ($\pm \Delta$ Hz)</span>
                      <span className="text-cyan-400 font-mono text-base">{personalOffset > 0 ? `+${personalOffset}` : personalOffset} Hz</span>
                    </label>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      step="0.5"
                      value={personalOffset}
                      onChange={(e) => setPersonalOffset(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Studio Bottom Master Controls Bar */}
          <div className="p-4 border-t border-white/10 bg-black/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAudio}
                disabled={!activePermissions.canUseMic && !isHost}
                className={`px-4 h-12 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all ${
                  !activePermissions.canUseMic && !isHost
                    ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
                    : isAudioEnabled
                    ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
                title={isAudioEnabled ? 'Silenciar Micrófono' : 'Activar Llamada de Audio'}
              >
                <Icon name={isAudioEnabled ? 'Mic' : 'MicOff'} size={18} />
                <span>{isAudioEnabled ? 'Micrófono Activo' : 'Llamada de Audio'}</span>
              </button>

              <button
                onClick={toggleVideo}
                disabled={!activePermissions.canUseVideo && !isHost}
                className={`px-4 h-12 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all ${
                  !activePermissions.canUseVideo && !isHost
                    ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
                    : isVideoEnabled
                    ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
                title={isVideoEnabled ? 'Apagar Cámara' : 'Encender Cámara'}
              >
                <Icon name={isVideoEnabled ? 'Video' : 'VideoOff'} size={18} />
                <span>{isVideoEnabled ? 'Cámara Activa' : 'Encender Cámara'}</span>
              </button>

              <button
                onClick={() => setShowChat(!showChat)}
                className={`px-4 h-12 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all border relative ${
                  showChat
                    ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon name="MessageSquare" size={18} />
                <span>Chat</span>
                {chatMessages.length > 0 && !showChat && (
                  <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-ping" />
                )}
              </button>
            </div>

            {/* Chat Modal / Inline Overlay */}
            {showChat && (
              <div className="absolute bottom-20 right-6 w-80 bg-black/95 backdrop-blur-2xl border border-purple-500/40 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 h-72 z-50">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-purple-300">Chat de Sintonización</span>
                  <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">
                    <Icon name="X" size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-slate-400">{msg.senderName}</span>
                      <div className={`px-3 py-1.5 rounded-xl text-xs ${msg.senderId === currentUser.id ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/10 text-slate-200'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Mensaje..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-purple-500 text-white rounded-xl text-xs font-bold">
                    <Icon name="Send" size={14} />
                  </button>
                </form>
              </div>
            )}

            <button
              onClick={() => isHost ? setShowExitModal(true) : onLeave()}
              className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-2xl text-xs font-bold border border-red-500/40 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              Salir de la Sesión
            </button>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // COMPACT FLOATING WIDGET VIEW (WIDGET COMPACTO FUTURISTA ANCLADO)
  // -------------------------------------------------------------
  return (
    <div className="fixed bottom-24 right-4 z-[90] w-[calc(100vw-2rem)] sm:w-80 md:w-[380px] flex flex-col gap-3 p-4 bg-[#070a14]/95 backdrop-blur-2xl border border-cyan-500/50 rounded-3xl shadow-[0_0_50px_rgba(34,211,238,0.35)] animate-fade-in">
      
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2.5 truncate">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
          <span className="text-xs font-bold text-white truncate">{session.presetName}</span>
        </div>
        
        {/* BUTTON TO SWITCH TO FULL STUDIO WINDOW */}
        <button
          onClick={() => setViewMode('studio')}
          className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.5)] cursor-pointer"
          title="Abrir Ventana Completa de Entonación"
        >
          <Icon name="Maximize2" size={14} />
          <span>Ventana Completa</span>
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
        <span>Anfitrión: {session.hostName}</span>
        <span className="text-cyan-400 font-bold">Δ {Math.round(latencyDelta)}ms</span>
      </div>

      {/* QUICK LAUNCH POPUPS BAR */}
      <div className="grid grid-cols-4 gap-1.5 bg-black/50 p-1.5 rounded-2xl border border-white/5">
        <button
          onClick={() => setCompactPopup(compactPopup === 'graphics' ? 'none' : 'graphics')}
          className={`py-1 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
            compactPopup === 'graphics' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icon name="Activity" size={12} /> Gráficas
        </button>
        <button
          onClick={() => setCompactPopup(compactPopup === 'matrix' ? 'none' : 'matrix')}
          className={`py-1 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
            compactPopup === 'matrix' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icon name="Sliders" size={12} /> Matriz
        </button>
        <button
          onClick={() => setCompactPopup(compactPopup === 'radar' ? 'none' : 'radar')}
          className={`py-1 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
            compactPopup === 'radar' ? 'bg-green-500 text-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icon name="Radio" size={12} /> Radar
        </button>
        <button
          onClick={() => setCompactPopup(compactPopup === 'privacy' ? 'none' : 'privacy')}
          className={`py-1 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
            compactPopup === 'privacy' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Icon name="Lock" size={12} /> Filtro
        </button>
      </div>

      {/* COMPACT MINI POPUP CONTENT */}
      {compactPopup === 'graphics' && (
        <div className="h-40 bg-black/80 rounded-2xl overflow-hidden border border-cyan-500/30 p-2">
          <Visualizer analyser={analyserNode} height={140} color="#22d3ee" type="fill" />
        </div>
      )}

      {compactPopup === 'matrix' && (
        <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 bg-black/80 rounded-2xl border border-amber-500/30 space-y-2">
          <span className="text-[10px] font-bold text-amber-300 uppercase block">Frecuencias Activas ({currentOscillators.length}):</span>
          {currentOscillators.map(o => (
            <div key={o.id} className="text-xs text-white font-mono flex justify-between bg-white/5 p-2 rounded-xl">
              <span>{o.frequency} Hz ({o.waveform})</span>
              <span>Vol: {Math.round((o.gain || 0.5) * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      {compactPopup === 'radar' && (
        <div className="h-44 bg-black/80 rounded-2xl overflow-hidden border border-green-500/30">
          <MeshSignalMap />
        </div>
      )}

      {compactPopup === 'privacy' && (
        <div className="p-3 bg-black/80 rounded-2xl border border-purple-500/30 space-y-2">
          <span className="text-[10px] font-bold text-purple-300 uppercase block">Sintonización Fina Personal:</span>
          <input
            type="range"
            min="-20"
            max="20"
            step="0.5"
            value={personalOffset}
            onChange={(e) => setPersonalOffset(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="text-[10px] text-cyan-400 font-mono text-right">{personalOffset} Hz</div>
        </div>
      )}

      {/* ALL COMPACT WIDGET ACTION CONTROLS WITH ICONS */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          {/* AUDIO CALL */}
          <button
            onClick={toggleAudio}
            disabled={!activePermissions.canUseMic && !isHost}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isAudioEnabled ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(34,211,238,0.5)]' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
            title={isAudioEnabled ? 'Silenciar Micrófono' : 'Activar Llamada de Audio'}
          >
            <Icon name={isAudioEnabled ? 'Mic' : 'MicOff'} size={18} />
          </button>

          {/* VIDEO CALL */}
          <button
            onClick={toggleVideo}
            disabled={!activePermissions.canUseVideo && !isHost}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isVideoEnabled ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(34,211,238,0.5)]' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
            title={isVideoEnabled ? 'Apagar Cámara' : 'Encender Cámara'}
          >
            <Icon name={isVideoEnabled ? 'Video' : 'VideoOff'} size={18} />
          </button>

          {/* CHAT */}
          <button
            onClick={() => { setViewMode('studio'); setShowChat(true); }}
            className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center transition-all hover:bg-purple-500/40 relative"
            title="Abrir Chat"
          >
            <Icon name="MessageSquare" size={18} />
            {chatMessages.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-ping" />
            )}
          </button>

          {/* HAND RAISE */}
          {!isHost && (
            <button
              onClick={() => setHandRaised(!handRaised)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                handRaised ? 'bg-amber-500 text-black border border-amber-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
              title="Pedir Palabra"
            >
              <Icon name="Hand" size={18} />
            </button>
          )}
        </div>

        {/* DISCONNECT */}
        <button
          onClick={() => isHost ? setShowExitModal(true) : onLeave()}
          className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/40 shadow-lg"
        >
          Desconectar
        </button>
      </div>
    </div>
  );
};

export default LiveSyncCall;
