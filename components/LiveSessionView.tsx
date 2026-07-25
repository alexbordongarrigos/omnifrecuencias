import React, { useEffect, useState, useRef } from 'react';
import Icon from './Icon';
import { LiveSession, ChatMessage } from '../types';
import { WebRTCManager } from '../services/webrtc';
import { getCurrentStarseedUser, StarseedUser, supabase } from '../services/starseedAuth';

interface Props {
  session: LiveSession;
  onLeave: () => void;
}

const LiveSessionView: React.FC<Props> = ({ session, onLeave }) => {
  const [user, setUser] = useState<StarseedUser | null>(null);
  const [rtcManager, setRtcManager] = useState<WebRTCManager | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState<{id: string, name: string}[]>([]);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentStarseedUser();
      if (!currentUser) {
        alert("Debes iniciar sesión en Starseed OS para unirte.");
        onLeave();
        return;
      }
      setUser(currentUser);

      const manager = new WebRTCManager(session.id, currentUser.id);
      
      const hasMic = await manager.initializeMicrophone();
      if (!hasMic) {
        console.warn("No microphone access. You can still listen and chat.");
      }
      manager.toggleMute(true); // Muted by default
      
      manager.onRemoteStream = (peerId, stream) => {
        if (!audioContainerRef.current) return;
        let audioEl = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.id = `audio-${peerId}`;
          audioEl.autoplay = true;
          audioContainerRef.current.appendChild(audioEl);
        }
        audioEl.srcObject = stream;
      };

      manager.onPeerDisconnected = (peerId) => {
        const audioEl = document.getElementById(`audio-${peerId}`);
        if (audioEl) audioEl.remove();
        setParticipants(prev => prev.filter(p => p.id !== peerId));
      };

      await manager.joinRoom();
      setRtcManager(manager);

      // Listen for chat via Supabase channel
      const channel = supabase.channel(`chat:${session.id}`);
      channel
        .on('broadcast', { event: 'message' }, (payload: any) => {
          setChatMessages(prev => [...prev, payload.payload]);
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const presentUsers = Object.values(state).map((u: any) => ({
            id: u[0].user_id,
            name: u[0].user_name
          }));
          setParticipants(presentUsers);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ user_id: currentUser.id, user_name: currentUser.displayName });
          }
        });

      return () => {
        manager.leaveRoom();
        supabase.removeChannel(channel);
      };
    };
    init();
  }, [session.id, onLeave]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const toggleMute = () => {
    if (rtcManager) {
      rtcManager.toggleMute(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;
    
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      senderName: user.displayName,
      text: chatInput,
      timestamp: Date.now()
    };

    supabase.channel(`chat:${session.id}`).send({
      type: 'broadcast',
      event: 'message',
      payload: msg
    });

    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  return (
    <div className="flex h-full border-t border-white/5 bg-black/50">
      <div ref={audioContainerRef} className="hidden"></div>
      
      {/* Main Area */}
      <div className="flex-1 flex flex-col p-6">
         <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-bold animate-pulse">
                  <Icon name="Radio" size={10} /> EN VIVO
                </span>
                <h2 className="text-2xl font-black text-white">{session.presetName}</h2>
              </div>
              <p className="text-slate-400 text-sm">Host: {session.hostName}</p>
            </div>
            
            <div className="flex items-center gap-3">
               <button 
                 onClick={toggleMute}
                 className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.5)]'}`}
               >
                 <Icon name={isMuted ? "MicOff" : "Mic"} size={20} />
               </button>
               
               <button 
                 onClick={onLeave}
                 className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors text-sm flex items-center gap-2"
               >
                 <Icon name="LogOut" size={16} /> Salir
               </button>
            </div>
         </div>

         <div className="flex-1 bg-black/30 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent pointer-events-none"></div>
             
             <Icon name="Activity" size={64} className="text-purple-400/50 mb-4 animate-pulse" />
             <h3 className="text-xl font-bold text-white mb-2">Entonación Colectiva</h3>
             <p className="text-slate-400 text-center max-w-md text-sm">
                Las frecuencias de este preset están sincronizadas. {session.allowOpenModifications ? 'Cualquiera puede modificar la onda y el espiral.' : 'Solo el host puede modificar los parámetros.'}
             </p>
         </div>
      </div>

      {/* Sidebar / Chat */}
      <div className="w-80 bg-black/80 border-l border-white/5 flex flex-col">
         {/* Participants */}
         <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Conectados ({participants.length})</h3>
            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto custom-scrollbar">
               {participants.map(p => (
                 <div key={p.id} className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                     {p.name.charAt(0)}
                   </div>
                   <span className="text-sm text-slate-300 truncate">{p.name}</span>
                 </div>
               ))}
            </div>
         </div>

         {/* Chat Messages */}
         <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
            {chatMessages.map(msg => (
               <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-500 mb-1">{msg.senderName}</span>
                  <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${msg.senderId === user?.id ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white/10 text-slate-200 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
               </div>
            ))}
            <div ref={chatEndRef} />
         </div>

         {/* Chat Input */}
         <form onSubmit={sendChatMessage} className="p-4 border-t border-white/5 flex gap-2">
            <input 
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Mensaje..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
            />
            <button type="submit" className="w-10 h-10 bg-purple-600 hover:bg-purple-500 rounded-xl flex items-center justify-center text-white transition-colors">
               <Icon name="Send" size={16} />
            </button>
         </form>
      </div>
    </div>
  );
};

export default LiveSessionView;
