import React, { useEffect, useRef, useState } from 'react';
import { useWebRTC, RemoteStream } from '../hooks/useWebRTC';
import { useMeshSync } from '../hooks/useMeshSync';
import Icon from './Icon';
import { StarseedUser } from '../services/starseedAuth';
import { LiveSession } from '../types';
import MeshSignalMap from './MeshSignalMap';

interface Props {
  session: LiveSession;
  currentUser: StarseedUser;
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
    <div className="relative rounded-2xl overflow-hidden bg-black/90 border border-cyan-500/30 group aspect-video shadow-[0_0_25px_rgba(0,0,0,0.9)]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
      />
      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/10 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        {displayName} {isLocal && '(Tú)'}
      </div>
    </div>
  );
};

const LiveSyncCall: React.FC<Props> = ({
  session,
  currentUser,
  onLeave,
  currentOscillators,
  activeVizTab,
  onSyncReceive,
  onPermissionsChange
}) => {
  const isHost = session.hostId === currentUser.id || (session.hostId === 'local-host' && currentUser.id === 'anonymous');
  const lastSentState = useRef<string>('');
  
  // View Modes: 'studio' (Full Overlay Studio) vs 'compact' (Floating Widget)
  const [viewMode, setViewMode] = useState<'studio' | 'compact'>('studio');
  const [studioTab, setStudioTab] = useState<'video' | 'radar' | 'host' | 'filter'>('video');

  // Modals & Panels
  const [showExitModal, setShowExitModal] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [personalOffset, setPersonalOffset] = useState<number>(0);
  const [callScope, setCallScope] = useState<'general' | 'mesh_only' | 'select_accounts'>('general');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Permissions
  const [localPermissions, setLocalPermissions] = useState({
    canEditFrequencies: false,
    canUseMic: true,
    canUseVideo: true,
    canChat: true,
  });

  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    nodes: meshNodes,
    connectionState: meshState,
    latencyDelta,
    connectToMesh,
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

  const toggleSelectUserForCall = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // -------------------------------------------------------------
  // FULL STUDIO VIEW (ESTUDIO HOLOFÓNICO COMPLETO)
  // -------------------------------------------------------------
  if (viewMode === 'studio') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl animate-fade-in">
        <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-[0_0_80px_rgba(34,211,238,0.2)] overflow-hidden relative">
          
          {/* Studio Top Header Bar */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">{session.presetName}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Estudio de Entonación
                  </span>
                </div>
                <p className="text-xs text-amber-400 font-bold">
                  Anfitrión: {session.hostName} {isHost && '(Tú)'} | {participants.length} Participantes en Línea
                </p>
              </div>
            </div>

            {/* Top Right Action Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('compact')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-cyan-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
                title="Minimizar a widget flotante"
              >
                <Icon name="Minimize2" size={14} />
                <span className="hidden sm:inline">Minimizar</span>
              </button>

              <button
                onClick={() => isHost ? setShowExitModal(true) : onLeave()}
                className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/40 flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                <Icon name="LogOut" size={14} />
                <span>Desconectar</span>
              </button>
            </div>
          </div>

          {/* Studio Navigation Tabs Bar */}
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-white/5 bg-black/40 overflow-x-auto custom-scrollbar shrink-0">
            <button
              onClick={() => setStudioTab('video')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                studioTab === 'video' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Icon name="Video" size={16} /> Sala de Video y Voz
            </button>

            <button
              onClick={() => setStudioTab('radar')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                studioTab === 'radar' ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Icon name="Radio" size={16} className="animate-pulse" /> Radar Mesh y Antenas
            </button>

            {isHost && (
              <button
                onClick={() => setStudioTab('host')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  studioTab === 'host' ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                <Icon name="Shield" size={16} /> Panel del Anfitrión
              </button>
            )}

            <button
              onClick={() => setStudioTab('filter')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                studioTab === 'filter' ? 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]' : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              <Icon name="Sliders" size={16} /> Ajustes Personales
            </button>
          </div>

          {/* Studio Main Content View Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex flex-col gap-6 relative">
            
            {/* TAB 1: VIDEO & CALL GALLERY */}
            {studioTab === 'video' && (
              <div className="flex flex-col gap-6 h-full">
                {/* Status Bar */}
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

                {/* Video Streams Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                  {localStream && isVideoEnabled && (
                    <VideoPlayer stream={localStream} isLocal displayName={currentUser.displayName} />
                  )}
                  {remoteStreams.map((rs: RemoteStream) => (
                    <VideoPlayer key={rs.userId} stream={rs.stream} displayName={rs.displayName} />
                  ))}

                  {/* If no video active */}
                  {(!localStream || !isVideoEnabled) && remoteStreams.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-black/40 rounded-3xl border border-white/5">
                      <Icon name="VideoOff" size={48} className="mb-3 opacity-30 text-cyan-400" />
                      <h4 className="text-base font-bold text-slate-300">Cámara Desactivada</h4>
                      <p className="text-xs text-slate-500 mt-1">Activa tu cámara con los controles inferiores para unirte al video.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: RADAR MESH SIGNAL MAP */}
            {studioTab === 'radar' && (
              <div className="flex-1">
                <MeshSignalMap />
              </div>
            )}

            {/* TAB 3: HOST ADMIN PANEL */}
            {studioTab === 'host' && isHost && (
              <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
                <div className="bg-black/60 p-6 rounded-3xl border border-purple-500/40 flex flex-col gap-4 shadow-xl">
                  <h3 className="text-base font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2 border-b border-purple-500/30 pb-3">
                    <Icon name="Shield" size={18} /> Administración de Sala y Permisos
                  </h3>

                  {/* Call Scope Selector */}
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                      Ámbito y Filtro de Llamada (Voz / Video)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setCallScope('general')}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                          callScope === 'general'
                            ? 'bg-purple-500/30 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Icon name="Globe" size={18} />
                        <span>General (Todos)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCallScope('mesh_only')}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                          callScope === 'mesh_only'
                            ? 'bg-green-500/30 border-green-500 text-green-200 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Icon name="Radio" size={18} />
                        <span>Solo Red Mesh</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCallScope('select_accounts')}
                        className={`p-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                          callScope === 'select_accounts'
                            ? 'bg-cyan-500/30 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Icon name="UserCheck" size={18} />
                        <span>Selección</span>
                      </button>
                    </div>
                  </div>

                  {/* Granular Checkboxes */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block">
                      Permisos Globales de los Entonadores
                    </span>
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

            {/* TAB 4: PERSONAL FILTERS & OFFSET */}
            {studioTab === 'filter' && (
              <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
                <div className="bg-black/60 p-6 rounded-3xl border border-fuchsia-500/40 flex flex-col gap-4 shadow-xl">
                  <h3 className="text-base font-bold text-fuchsia-300 uppercase tracking-wider flex items-center gap-2 border-b border-fuchsia-500/30 pb-3">
                    <Icon name="Sliders" size={18} /> Ajustes Personales de Sintonización
                  </h3>

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
                    <p className="text-xs text-slate-400 mt-2">
                      Aplica un desvío o entonación fina en tu propio dispositivo sin modificar la frecuencia transmitida por el Host para el resto de la comunidad.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Studio Bottom Master Controls Bar */}
          <div className="p-4 border-t border-white/10 bg-black/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAudio}
                disabled={!activePermissions.canUseMic && !isHost}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  !activePermissions.canUseMic && !isHost
                    ? 'opacity-50 cursor-not-allowed bg-slate-800'
                    : isAudioEnabled
                    ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
                title={isAudioEnabled ? 'Silenciar Micrófono' : 'Activar Micrófono'}
              >
                <Icon name={isAudioEnabled ? 'Mic' : 'MicOff'} size={20} />
              </button>

              <button
                onClick={toggleVideo}
                disabled={!activePermissions.canUseVideo && !isHost}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  !activePermissions.canUseVideo && !isHost
                    ? 'opacity-50 cursor-not-allowed bg-slate-800'
                    : isVideoEnabled
                    ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
                title={isVideoEnabled ? 'Apagar Cámara' : 'Encender Cámara'}
              >
                <Icon name={isVideoEnabled ? 'Video' : 'VideoOff'} size={20} />
              </button>

              <button
                onClick={() => setShowChat(!showChat)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border relative ${
                  showChat
                    ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
                title="Abrir Chat"
              >
                <Icon name="MessageSquare" size={20} />
                {chatMessages.length > 0 && !showChat && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping" />
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

        {/* Exit Modal */}
        {showExitModal && (
          <div className="absolute inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-purple-500/50 p-6 rounded-2xl w-full max-w-sm shadow-[0_0_40px_rgba(168,85,247,0.3)]">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Icon name="LogOut" size={18} className="text-purple-400" />
                Opciones de Salida (Anfitrión)
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                ¿Cómo deseas proceder con la transmisión actual?
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => { setShowExitModal(false); onLeave(); }} 
                  className="w-full text-left px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 flex flex-col gap-1 transition-colors"
                >
                  <span className="font-bold flex items-center gap-2 text-xs"><Icon name="XCircle" size={14} /> Terminar para todos</span>
                  <span className="text-[10px] text-slate-500">Cierra la sala y desconecta la sintonización en la red.</span>
                </button>
                
                <button 
                  onClick={() => { setShowExitModal(false); onLeave(); }} 
                  className="w-full text-left px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/20 flex flex-col gap-1 transition-colors"
                >
                  <span className="font-bold flex items-center gap-2 text-xs"><Icon name="Anchor" size={14} /> Dejar Sesión Activa</span>
                  <span className="text-[10px] text-slate-500">Sales de la sala pero la frecuencia sigue transmitiéndose en la red.</span>
                </button>
              </div>
              <button 
                onClick={() => setShowExitModal(false)}
                className="mt-6 w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // COMPACT FLOATING WIDGET VIEW (WIDGET COMPACTO DE ESQUINA)
  // -------------------------------------------------------------
  return (
    <div className="flex flex-col gap-3 p-4 bg-black/90 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.9)] animate-fade-in w-full max-w-sm">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
          <span className="text-xs font-bold text-white truncate">{session.presetName}</span>
        </div>
        
        <button
          onClick={() => setViewMode('studio')}
          className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-cyan-500/40"
          title="Expandir Estudio"
        >
          <Icon name="Maximize2" size={14} />
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Anfitrión: {session.hostName}</span>
        <span className="text-cyan-400">Δ {Math.round(latencyDelta)}ms</span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            disabled={!activePermissions.canUseMic && !isHost}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isAudioEnabled ? 'bg-cyan-500 text-black' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            <Icon name={isAudioEnabled ? 'Mic' : 'MicOff'} size={16} />
          </button>

          <button
            onClick={toggleVideo}
            disabled={!activePermissions.canUseVideo && !isHost}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isVideoEnabled ? 'bg-cyan-500 text-black' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            <Icon name={isVideoEnabled ? 'Video' : 'VideoOff'} size={16} />
          </button>
        </div>

        <button
          onClick={() => isHost ? setShowExitModal(true) : onLeave()}
          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all"
        >
          Desconectar
        </button>
      </div>
    </div>
  );
};

export default LiveSyncCall;
