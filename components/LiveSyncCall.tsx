import React, { useEffect, useRef, useState } from 'react';
import { useWebRTC, RemoteStream } from '../hooks/useWebRTC';
import { useMeshSync } from '../hooks/useMeshSync';
import Icon from './Icon';
import { StarseedUser } from '../services/starseedAuth';
import { LiveSession } from '../types';

interface Props {
  session: LiveSession;
  currentUser: StarseedUser;
  onLeave: () => void;
  currentOscillators: any[];
  activeVizTab?: '2d' | '3d' | 'spiral';
  onSyncReceive: (oscillators: any[], latencyMs?: number, vizTab?: string) => void;
  onPermissionsChange?: (perms: any) => void;
}

const VideoPlayer: React.FC<{ stream: MediaStream; isLocal?: boolean; displayName: string }> = ({ stream, isLocal, displayName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black/90 border border-white/10 group aspect-video shadow-[0_0_20px_rgba(0,0,0,0.8)]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
      />
      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-white border border-white/10 flex items-center gap-1.5 shadow">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
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
  
  // UI Panels State
  const [showHostPanel, setShowHostPanel] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  // Call Scope Mode (General, Solo Mesh Local, Cuentas Especificas)
  const [callScope, setCallScope] = useState<'general' | 'mesh_only' | 'select_accounts'>('general');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [handRaised, setHandRaised] = useState(false);
  const [personalOffset, setPersonalOffset] = useState<number>(0);
  const [directCallTarget, setDirectCallTarget] = useState<string | null>(null);

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
    // If user has personal resonance offset, apply offset to frequencies
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

  return (
    <div className="relative flex flex-col gap-3 p-4 w-full max-h-[85vh] overflow-hidden bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.9)]">
      
      {/* Top Header Card */}
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <h2 className="text-base md:text-lg font-bold text-white truncate drop-shadow-md">
                {session.presetName}
              </h2>
            </div>
            <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider truncate mt-0.5">
              Anfitrión: {session.hostName} {isHost && '(Tú)'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Host Controls Toggle */}
            {isHost && (
              <button 
                onClick={() => setShowHostPanel(!showHostPanel)}
                className={`p-2 rounded-xl border transition-all ${showHostPanel ? 'bg-purple-500 text-black border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'}`}
                title="Panel de Control del Anfitrión"
              >
                <Icon name="Shield" size={16} />
              </button>
            )}

            {/* Settings Modal Toggle */}
            <button 
              onClick={() => setShowSettingsModal(!showSettingsModal)}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition-all"
              title="Ajustes Personales"
            >
              <Icon name="Sliders" size={16} />
            </button>
          </div>
        </div>

        {/* Network & Latency Indicators */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="flex items-center gap-1.5 bg-black/50 p-2 rounded-xl border border-white/5 text-[9px] font-mono text-slate-300">
            <Icon name="Wifi" size={12} className="text-cyan-400 shrink-0" />
            <span className="truncate">Red: {meshState === 'connected' ? 'Híbrida P2P' : 'WebRTC Global'}</span>
          </div>

          <div className="flex items-center justify-between bg-black/50 p-2 rounded-xl border border-white/5 text-[9px] font-mono text-amber-300">
            <span className="flex items-center gap-1">
              <Icon name="Activity" size={12} className="text-amber-400 shrink-0" /> Desfase:
            </span>
            <span className="font-bold">Δ {Math.round(latencyDelta)}ms</span>
          </div>
        </div>

        {/* Participants & Hand Raise Bar */}
        <div className="flex items-center justify-between gap-2 mt-1 bg-white/5 p-2 rounded-xl border border-white/5">
          <button 
            onClick={() => setShowParticipantsModal(true)}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <Icon name="Users" size={14} className="text-purple-400" />
            <span>{participants.length} Participantes</span>
          </button>

          {!isHost && (
            <button
              onClick={() => setHandRaised(!handRaised)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                handRaised 
                  ? 'bg-amber-500 text-black border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]' 
                  : 'bg-white/5 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <Icon name="Hand" size={14} />
              {handRaised ? 'Mano Levantada' : 'Pedir Palabra'}
            </button>
          )}
        </div>
      </div>

      {/* HOST ADMIN DASHBOARD PANEL */}
      {isHost && showHostPanel && (
        <div className="bg-black/90 backdrop-blur-2xl border border-purple-500/50 rounded-2xl p-4 animate-fade-in flex flex-col gap-4 shadow-[0_0_35px_rgba(168,85,247,0.2)] relative z-20 overflow-y-auto max-h-[50vh] custom-scrollbar">
          <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
            <span className="text-xs uppercase font-black text-purple-300 tracking-wider flex items-center gap-2">
              <Icon name="Shield" size={14} /> Panel Maestro de Administración
            </span>
            <button onClick={() => setShowHostPanel(false)} className="text-slate-400 hover:text-white">
              <Icon name="X" size={14} />
            </button>
          </div>

          {/* Scope of Call / Llamadas por Ámbito */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Ámbito y Filtro de Llamada (Voz y Video)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCallScope('general')}
                className={`p-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                  callScope === 'general'
                    ? 'bg-purple-500/30 border-purple-500 text-purple-200'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Icon name="Globe" size={14} />
                General (Todos)
              </button>
              <button
                type="button"
                onClick={() => setCallScope('mesh_only')}
                className={`p-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                  callScope === 'mesh_only'
                    ? 'bg-green-500/30 border-green-500 text-green-200'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Icon name="Radio" size={14} />
                Solo Red Mesh
              </button>
              <button
                type="button"
                onClick={() => setCallScope('select_accounts')}
                className={`p-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                  callScope === 'select_accounts'
                    ? 'bg-cyan-500/30 border-cyan-500 text-cyan-200'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Icon name="UserCheck" size={14} />
                Seleccionar
              </button>
            </div>
          </div>

          {/* If Select Accounts option is chosen */}
          {callScope === 'select_accounts' && (
            <div className="bg-black/60 p-3 rounded-xl border border-cyan-500/30">
              <span className="text-[10px] font-bold text-cyan-300 block mb-2">
                Selecciona los participantes autorizados a usar micrófono y cámara:
              </span>
              <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                {participants.map((p) => (
                  <label key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                    <span className="text-xs text-white">{p.displayName}</span>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(p.id)}
                      onChange={() => toggleSelectUserForCall(p.id)}
                      className="accent-cyan-500 w-3.5 h-3.5"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Granular Permissions */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
              Permisos Globales de los Entonadores
            </span>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
              <span className="text-xs text-slate-200">Permitir Modificar Frecuencias</span>
              <input
                type="checkbox"
                checked={activePermissions.canEditFrequencies}
                onChange={e => updateHostPermissions({ canEditFrequencies: e.target.checked })}
                className="accent-purple-500 w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
              <span className="text-xs text-slate-200">Uso de Micrófono</span>
              <input
                type="checkbox"
                checked={activePermissions.canUseMic}
                onChange={e => updateHostPermissions({ canUseMic: e.target.checked })}
                className="accent-purple-500 w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
              <span className="text-xs text-slate-200">Uso de Cámara</span>
              <input
                type="checkbox"
                checked={activePermissions.canUseVideo}
                onChange={e => updateHostPermissions({ canUseVideo: e.target.checked })}
                className="accent-purple-500 w-4 h-4"
              />
            </label>
          </div>
        </div>
      )}

      {/* PERSONAL SETTINGS MODAL / OVERLAY */}
      {showSettingsModal && (
        <div className="bg-black/90 backdrop-blur-2xl border border-cyan-500/50 rounded-2xl p-4 animate-fade-in flex flex-col gap-4 shadow-[0_0_35px_rgba(34,211,238,0.2)] relative z-20">
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
            <span className="text-xs uppercase font-black text-cyan-300 tracking-wider flex items-center gap-2">
              <Icon name="Sliders" size={14} /> Ajustes Personales de Sintonización
            </span>
            <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white">
              <Icon name="X" size={14} />
            </button>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-300 font-bold mb-1">
              <span>Sintonización Fina Personal ($\pm \Delta$ Hz)</span>
              <span className="text-cyan-400 font-mono">{personalOffset > 0 ? `+${personalOffset}` : personalOffset} Hz</span>
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
            <span className="text-[10px] text-slate-400 mt-1 block">
              Ajusta una desviación de frecuencia personal en tu dispositivo sin alterar la transmisión del Host.
            </span>
          </div>
        </div>
      )}

      {/* PARTICIPANTS LIST & DIRECT P2P CALL MODAL */}
      {showParticipantsModal && (
        <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 animate-fade-in flex flex-col gap-3 relative z-20">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Icon name="Users" size={14} className="text-purple-400" /> Participantes en Línea ({participants.length})
            </span>
            <button onClick={() => setShowParticipantsModal(false)} className="text-slate-400 hover:text-white">
              <Icon name="X" size={14} />
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-bold text-xs">
                    {p.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{p.displayName}</div>
                    <div className="text-[9px] text-slate-400">{p.id === session.hostId ? 'Anfitrión' : 'Entonador'}</div>
                  </div>
                </div>

                {p.id !== currentUser.id && (
                  <button
                    onClick={() => {
                      setDirectCallTarget(p.id);
                      alert(`Iniciando llamada P2P directa privada con ${p.displayName}`);
                    }}
                    className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 rounded-lg text-[10px] font-bold border border-cyan-500/30 flex items-center gap-1 transition-all"
                  >
                    <Icon name="PhoneCall" size={12} /> Llamar P2P
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Grid */}
      {(localStream || remoteStreams.length > 0) && (
        <div className="grid grid-cols-2 gap-2 mt-1">
          {localStream && isVideoEnabled && (
            <VideoPlayer stream={localStream} isLocal displayName={currentUser.displayName} />
          )}
          {remoteStreams.map((rs: RemoteStream) => (
            <VideoPlayer key={rs.userId} stream={rs.stream} displayName={rs.displayName} />
          ))}
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="flex flex-col bg-black/60 border border-white/10 rounded-2xl overflow-hidden h-44 shadow-inner">
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[8px] text-slate-400 mb-0.5">{msg.senderName}</span>
                <div className={`px-3 py-1.5 rounded-xl text-xs ${msg.senderId === currentUser.id ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/30' : 'bg-white/10 text-slate-200 border border-white/10'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-2 border-t border-white/10 bg-black/80">
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={!activePermissions.canChat && !isHost}
              placeholder={(!activePermissions.canChat && !isHost) ? "Chat deshabilitado" : "Escribe un mensaje..."}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </form>
        </div>
      )}

      {/* Bottom Action Controls Bar */}
      <div className="flex items-center justify-between mt-1 bg-black/60 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl shadow-xl">
        <div className="flex gap-2">
          <button 
            onClick={toggleAudio}
            disabled={!activePermissions.canUseMic && !isHost}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 shadow-inner ${!activePermissions.canUseMic && !isHost ? 'opacity-50 cursor-not-allowed bg-slate-800 border border-transparent' : isAudioEnabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40'}`}
            title={isAudioEnabled ? "Silenciar Micrófono" : "Activar Micrófono"}
          >
            <Icon name={isAudioEnabled ? "Mic" : "MicOff"} size={18} />
          </button>
          
          <button 
            onClick={toggleVideo}
            disabled={!activePermissions.canUseVideo && !isHost}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 shadow-inner ${!activePermissions.canUseVideo && !isHost ? 'opacity-50 cursor-not-allowed bg-slate-800 border border-transparent' : isVideoEnabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40'}`}
            title={isVideoEnabled ? "Apagar Cámara" : "Encender Cámara"}
          >
            <Icon name={isVideoEnabled ? "Video" : "VideoOff"} size={18} />
          </button>

          <button 
            onClick={() => setShowChat(!showChat)}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 shadow-inner border relative ${showChat ? 'bg-purple-500/30 text-purple-200 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}
            title="Abrir Chat"
          >
            <Icon name="MessageSquare" size={18} />
            {chatMessages.length > 0 && !showChat && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-ping" />
            )}
          </button>
        </div>

        <button 
          onClick={() => isHost ? setShowExitModal(true) : onLeave()} 
          className="group relative flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 hover:border-red-500 rounded-xl px-4 h-11 font-bold text-xs uppercase tracking-wider transition-all duration-300 overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        >
          <Icon name="LogOut" size={16} />
          <span className="hidden sm:inline">Desconectar</span>
        </button>
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
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
};

export default LiveSyncCall;
