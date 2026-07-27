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
  onSyncReceive: (oscillators: any[]) => void;
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

const LiveSyncCall: React.FC<Props> = ({ session, currentUser, onLeave, currentOscillators, onSyncReceive }) => {
  const lastSentState = useRef<string>('');

  const handleSyncReceive = (oscillators: any[]) => {
    lastSentState.current = JSON.stringify(oscillators);
    onSyncReceive(oscillators);
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
    broadcastOscillatorSync
  } = useWebRTC(session.id, currentUser.id, currentUser.displayName, session.useGlobalWebRTC !== false, handleSyncReceive);

  const {
    nodes: meshNodes,
    connectionState: meshState,
    latencyDelta,
    connectToMesh,
    broadcastData: broadcastMeshOscillators
  } = useMeshSync((payload) => {
    if (payload.type === 'oscillator_sync' && payload.sender !== currentUser.id) {
       handleSyncReceive(payload.oscillators);
    }
  });

  useEffect(() => {
    const currentState = JSON.stringify(currentOscillators);
    if (currentState !== lastSentState.current) {
      lastSentState.current = currentState;
      const timeoutId = setTimeout(() => {
        broadcastOscillatorSync(currentOscillators);
        broadcastMeshOscillators({
          type: 'oscillator_sync',
          sender: currentUser.id,
          oscillators: currentOscillators
        });
      }, 150); // Debounce to avoid flooding
      return () => clearTimeout(timeoutId);
    }
  }, [currentOscillators, broadcastOscillatorSync, broadcastMeshOscillators, currentUser.id]);

  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
            
            {/* Mesh Status */}
            <div className="flex items-center gap-1">
              {meshState === 'connected' ? (
                <>
                  <Icon name="RadioReceiver" size={10} className="text-green-400" />
                  <span className="text-green-400 font-bold">{meshNodes.length} (Δ {Math.round(latencyDelta)}ms)</span>
                </>
              ) : meshState === 'connecting' ? (
                <>
                  <Icon name="Loader" size={10} className="text-amber-400 animate-spin" />
                  <span className="text-amber-400">P2P...</span>
                </>
              ) : (
                <>
                  <Icon name="Radio" size={10} className="text-slate-500" />
                  <button onClick={connectToMesh} className="text-slate-400 hover:text-cyan-300 transition-colors">
                    Off-grid
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
        
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
              placeholder="Mensaje..."
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </form>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-2">
          <button 
            onClick={toggleAudio}
            className={`p-2 rounded-full transition-all ${isAudioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/50'}`}
          >
            <Icon name={isAudioEnabled ? "Mic" : "MicOff"} size={14} />
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`p-2 rounded-full transition-all ${isVideoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/50'}`}
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
          onClick={onLeave}
          className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-wider transition-colors shadow-[0_0_10px_rgba(239,68,68,0.2)]"
        >
          Desconectar
        </button>
      </div>
      
    </div>
  );
};

export default LiveSyncCall;
