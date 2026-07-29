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
    <div className="relative rounded-2xl overflow-hidden bg-black/80 border border-white/10 group aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
      />
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white shadow">
        {displayName} {isLocal && '(Tú)'}
      </div>
    </div>
  );
};

const LiveSyncCall: React.FC<Props> = ({ session, currentUser, onLeave, currentOscillators, activeVizTab, onSyncReceive, onPermissionsChange }) => {
  const isHost = session.hostId === currentUser.id;
  const lastSentState = useRef<string>('');
  const [showHostPanel, setShowHostPanel] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
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
    lastSentState.current = JSON.stringify({ oscillators, vizTab });
    onSyncReceive(oscillators, latencyMs, vizTab);
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

  // If host, we keep local state and broadcast. If not host, we use remote state.
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
       // Si el payload incluye timestamp, calculamos latencia
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
      }, 150); // Debounce to avoid flooding
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

  return (
    <div className="relative flex flex-col gap-4 p-4 w-full max-h-[80vh] overflow-hidden">
      
      {/* Top Header */}
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="truncate">{session.presetName}</span>
          </h2>
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider truncate">
            Host: {session.hostName}
          </p>
          <div className="mt-1 text-[10px] text-slate-300 flex items-center justify-between">
            <span>{participants.length} en línea</span>
            
            {/* Smart Bands & Mesh Status */}
            <div className="flex flex-col gap-1 w-full mt-2">
              <div className="flex items-center gap-2">
                {meshState === 'connected' ? (
                  <div className="flex items-center gap-1 bg-green-500/20 px-2 py-0.5 rounded text-green-400 font-mono text-[9px] uppercase">
                    <Icon name="RadioReceiver" size={10} />
                    <span>P2P Mesh: {meshNodes.length} Nodos</span>
                  </div>
                ) : meshState === 'connecting' ? (
                  <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-mono text-[9px] uppercase">
                    <Icon name="Loader" size={10} className="animate-spin" />
                    <span>Conectando Mesh...</span>
                  </div>
                ) : (
                  <button onClick={connectToMesh} className="flex items-center gap-1 bg-slate-500/20 hover:bg-cyan-500/30 px-2 py-0.5 rounded text-slate-400 hover:text-cyan-300 font-mono text-[9px] uppercase transition-colors">
                    <Icon name="Radio" size={10} />
                    <span>Activar P2P Off-grid</span>
                  </button>
                )}
                
                {session.useGlobalWebRTC !== false && (
                  <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-0.5 rounded text-blue-400 font-mono text-[9px] uppercase">
                    <Icon name="Globe" size={10} />
                    <span>WebRTC Global</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-[9px] font-mono text-cyan-400/80 bg-black/40 p-1.5 rounded border border-cyan-500/20">
                <Icon name="Activity" size={10} />
                <span>Banda Inteligente: {meshState === 'connected' ? 'Híbrida (Mesh + Server)' : 'Servidor WebRTC'}</span>
                <span className="ml-auto text-amber-500/80">Δ {Math.round(latencyDelta)}ms de desfase neuronal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Host Controls Toggle */}
        {isHost && (
          <button 
            onClick={() => setShowHostPanel(!showHostPanel)}
            className="absolute top-4 right-4 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/50 text-purple-300 p-1.5 rounded-lg transition-colors shadow-[0_0_10px_rgba(168,85,247,0.2)]"
            title="Panel de Control del Host"
          >
            <Icon name="Shield" size={14} />
          </button>
        )}
      </div>

      {/* Host Dashboard Panel */}
      {isHost && showHostPanel && (
        <div className="bg-black/60 border border-purple-500/30 rounded-xl p-3 mb-2 animate-fade-in flex flex-col gap-2">
          <div className="text-[10px] uppercase font-bold text-purple-400 tracking-widest flex items-center gap-1 mb-1">
            <Icon name="Settings" size={10} />
            Privilegios de la Sesión
          </div>
          
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={activePermissions.canEditFrequencies}
              onChange={e => updateHostPermissions({ canEditFrequencies: e.target.checked })}
              className="accent-purple-500"
            />
            Permitir a otros modificar frecuencias y gráficas
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={activePermissions.canUseMic}
              onChange={e => updateHostPermissions({ canUseMic: e.target.checked })}
              className="accent-purple-500"
            />
            Permitir micrófonos
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={activePermissions.canUseVideo}
              onChange={e => updateHostPermissions({ canUseVideo: e.target.checked })}
              className="accent-purple-500"
            />
            Permitir cámaras
          </label>
        </div>
      )}
        
      {/* Video Grid */}
      {(localStream || remoteStreams.length > 0) && (
        <div className="grid grid-cols-2 gap-2 mt-2">
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
        <div className="flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden h-48">
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[8px] text-slate-500 mb-0.5">{msg.senderName}</span>
                <div className={`px-2 py-1 rounded-lg text-xs ${msg.senderId === currentUser.id ? 'bg-cyan-600/50 text-white' : 'bg-white/10 text-slate-200'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="p-2 border-t border-white/10 bg-black/40">
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={!activePermissions.canChat && !isHost}
              placeholder={(!activePermissions.canChat && !isHost) ? "Chat deshabilitado" : "Mensaje..."}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </form>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-2">
          <button 
            onClick={toggleAudio}
            disabled={!activePermissions.canUseMic && !isHost}
            className={`p-2 rounded-full transition-all ${!activePermissions.canUseMic && !isHost ? 'opacity-50 cursor-not-allowed bg-slate-800' : isAudioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/50'}`}
          >
            <Icon name={isAudioEnabled ? "Mic" : "MicOff"} size={14} />
          </button>
          
          <button 
            onClick={toggleVideo}
            disabled={!activePermissions.canUseVideo && !isHost}
            className={`p-2 rounded-full transition-all ${!activePermissions.canUseVideo && !isHost ? 'opacity-50 cursor-not-allowed bg-slate-800' : isVideoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/50'}`}
          >
            <Icon name={isVideoEnabled ? "Video" : "VideoOff"} size={14} />
          </button>

          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-full transition-all ${showChat ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
          >
            <Icon name="MessageSquare" size={14} />
          </button>
        </div>

        <button 
          onClick={() => isHost ? setShowExitModal(true) : onLeave()} 
          className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-wider transition-colors shadow-[0_0_10px_rgba(239,68,68,0.2)]"
        >
          Desconectar
        </button>
      </div>

      {showExitModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 p-6 rounded-2xl w-full max-w-sm shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Icon name="LogOut" size={18} className="text-purple-400" />
              Opciones de Salida (Host)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Como creador de la sesión, ¿qué deseas hacer con la transmisión actual?
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => { setShowExitModal(false); onLeave(); }} 
                className="w-full text-left px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 flex flex-col gap-1 transition-colors"
              >
                <span className="font-bold flex items-center gap-2"><Icon name="XCircle" size={14} /> Terminar para todos</span>
                <span className="text-[10px] text-slate-500">Cierra la sala y desconecta la sincronización en la red.</span>
              </button>
              
              <button 
                onClick={() => { setShowExitModal(false); onLeave(); }} 
                className="w-full text-left px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/20 flex flex-col gap-1 transition-colors"
              >
                <span className="font-bold flex items-center gap-2"><Icon name="Anchor" size={14} /> Dejar Sesión Activa</span>
                <span className="text-[10px] text-slate-500">Sales de la sala pero la frecuencia sigue transmitiéndose para los conectados. {session.fixedPermissions ? 'Tus permisos se mantienen fijos.' : ''}</span>
              </button>
              
              {participants.filter(p => p.id !== currentUser.id).length > 0 && (
                <button 
                  onClick={() => { alert("Funcionalidad de traspaso en desarrollo. La sesión quedará activa."); setShowExitModal(false); onLeave(); }} 
                  className="w-full text-left px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/20 flex flex-col gap-1 transition-colors"
                >
                  <span className="font-bold flex items-center gap-2"><Icon name="Users" size={14} /> Traspasar Host</span>
                  <span className="text-[10px] text-slate-500">Asigna a otro participante como el nuevo controlador de las frecuencias.</span>
                </button>
              )}
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
