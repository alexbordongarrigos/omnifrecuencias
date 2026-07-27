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

const LiveSyncCall: React.FC<Props> = ({ session, currentUser, onLeave }) => {
  const {
    localStream,
    remoteStreams,
    participants,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    chatMessages,
    sendChatMessage
    sendChatMessage
  } = useWebRTC(session.id, currentUser.id, currentUser.displayName);

  const {
    nodes: meshNodes,
    connectionState: meshState,
    latencyDelta,
    connectToMesh
  } = useMeshSync();

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
    <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Top Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            {session.presetName}
          </h2>
          <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
            Sincronización Cuántica • Host: {session.hostName}
          </p>
          <div className="mt-2 text-xs text-slate-300 flex items-center gap-4">
            <span>{participants.length} resonancias conectadas</span>
            
            {/* Mesh Status */}
            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-full border border-white/10">
              {meshState === 'connected' ? (
                <>
                  <Icon name="RadioReceiver" size={12} className="text-green-400" />
                  <span className="text-green-400 font-bold">{meshNodes.length} Nodos Mesh (Δ {Math.round(latencyDelta)}ms)</span>
                </>
              ) : meshState === 'connecting' ? (
                <>
                  <Icon name="Loader" size={12} className="text-amber-400 animate-spin" />
                  <span className="text-amber-400">Escaneando P2P...</span>
                </>
              ) : (
                <>
                  <Icon name="Radio" size={12} className="text-slate-500" />
                  <button onClick={connectToMesh} className="text-slate-400 hover:text-cyan-300 transition-colors">
                    Conectar Antena
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <button 
          onClick={onLeave}
          className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        >
          Desconectar
        </button>
      </div>

      {/* Video Grid & Chat Area */}
      <div className="flex-1 flex items-end justify-between gap-6 pointer-events-none mt-6">
        
        {/* Videos Container */}
        <div className="flex-1 max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pointer-events-auto">
          {localStream && isVideoEnabled && (
            <VideoPlayer stream={localStream} isLocal displayName={currentUser.displayName} />
          )}
          {remoteStreams.map((rs: RemoteStream) => (
            <VideoPlayer key={rs.userId} stream={rs.stream} displayName={rs.displayName} />
          ))}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 h-96 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden pointer-events-auto shadow-2xl">
            <div className="bg-white/5 border-b border-white/10 p-3 flex justify-between items-center">
              <span className="font-bold text-sm text-cyan-300">Transmisiones (Chat)</span>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">
                <Icon name="X" size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-500 mb-1">{msg.senderName}</span>
                  <div className={`px-3 py-2 rounded-xl text-sm ${msg.senderId === currentUser.id ? 'bg-cyan-600/50 text-white' : 'bg-white/10 text-slate-200'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 bg-black/40">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Transmite un mensaje..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500"
              />
            </form>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex justify-center mt-6 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <button 
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-all ${isAudioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/50'}`}
          >
            <Icon name={isAudioEnabled ? "Mic" : "MicOff"} size={20} />
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-all ${isVideoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/50'}`}
          >
            <Icon name={isVideoEnabled ? "Video" : "VideoOff"} size={20} />
          </button>

          <div className="w-px h-8 bg-white/10 self-center mx-2"></div>

          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full transition-all ${showChat ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
          >
            <Icon name="MessageSquare" size={20} />
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default LiveSyncCall;
