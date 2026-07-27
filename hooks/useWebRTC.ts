import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/starseedAuth';

export interface RemoteStream {
  userId: string;
  stream: MediaStream;
  displayName: string;
}

export const useWebRTC = (
  sessionId: string, 
  currentUserId: string, 
  displayName: string, 
  enabled: boolean = true,
  onSyncReceive?: (oscillators: any[]) => void
) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [participants, setParticipants] = useState<{id: string, displayName: string}[]>([]);

  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});
  const channelRef = useRef<any>(null);

  // Initialize Channel & WebRTC
  useEffect(() => {
    if (!enabled || !sessionId || !currentUserId) return;

    const channel = supabase.channel(`sync_room_${sessionId}`, {
      config: { broadcast: { self: false }, presence: { key: currentUserId } }
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeUsers = Object.keys(state).map(key => ({
          id: key,
          displayName: (state[key][0] as any).displayName
        }));
        setParticipants(activeUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // When someone new joins, we (the existing users) initiate a connection offer
        if (key !== currentUserId) {
          initiateCall(key, newPresences[0].displayName);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (peerConnections.current[key]) {
          peerConnections.current[key].close();
          delete peerConnections.current[key];
        }
        setRemoteStreams(prev => prev.filter(rs => rs.userId !== key));
      })
      .on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
        const { target, sender, senderName, signal } = payload;
        
        if (target !== currentUserId) return; // Only process signals aimed at us

        try {
          let pc = peerConnections.current[sender];
          if (!pc) {
            pc = createPeerConnection(sender, senderName);
          }

          if (signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            channel.send({
              type: 'broadcast',
              event: 'webrtc_signal',
              payload: {
                target: sender,
                sender: currentUserId,
                signal: pc.localDescription
              }
            });
          } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
          } else if (signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal));
          }
        } catch (err) {
          console.error("WebRTC Error handling signal:", err);
        }
      })
      .on('broadcast', { event: 'oscillator_sync' }, ({ payload }) => {
        if (payload.sender !== currentUserId && onSyncReceive) {
          onSyncReceive(payload.oscillators);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ displayName });
        }
      });

    return () => {
      channel.unsubscribe();
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId, currentUserId]);

  const createPeerConnection = (targetUserId: string, targetName: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });

    peerConnections.current[targetUserId] = pc;

    // Add local tracks if they exist
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc_signal',
          payload: {
            target: targetUserId,
            sender: currentUserId,
            signal: event.candidate
          }
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => {
        if (prev.find(rs => rs.userId === targetUserId)) return prev;
        return [...prev, { userId: targetUserId, displayName: targetName, stream: remoteStream }];
      });
    };

    return pc;
  };

  const initiateCall = async (targetUserId: string, targetName: string) => {
    const pc = createPeerConnection(targetUserId, targetName);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    channelRef.current?.send({
      type: 'broadcast',
      event: 'webrtc_signal',
      payload: {
        target: targetUserId,
        sender: currentUserId,
        senderName: displayName,
        signal: pc.localDescription
      }
    });
  };

  const startLocalStream = async (video: boolean, audio: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      setLocalStream(stream);
      setIsVideoEnabled(video);
      setIsAudioEnabled(audio);

      // Add tracks to all existing connections
      Object.values(peerConnections.current).forEach(pc => {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
        // Might need renegotiation in complex scenarios, but for simple mesh it often just triggers 'negotiationneeded'
      });
    } catch (err) {
      console.error("Failed to get local media", err);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      } else {
        startLocalStream(true, isAudioEnabled);
      }
    } else {
      startLocalStream(true, isAudioEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      } else {
        startLocalStream(isVideoEnabled, true);
      }
    } else {
      startLocalStream(isVideoEnabled, true);
    }
  };

  // Chat functionality through the same channel
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!channelRef.current) return;
    
    const chatHandler = channelRef.current.on('broadcast', { event: 'chat_message' }, ({ payload }: any) => {
      setChatMessages(prev => [...prev, payload]);
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.off('broadcast', chatHandler);
      }
    };
  }, [channelRef.current]);

  const sendChatMessage = (text: string) => {
    if (!channelRef.current) return;
    const msg = { senderId: currentUserId, senderName: displayName, text, timestamp: Date.now() };
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: msg
    });
    setChatMessages(prev => [...prev, msg]);
  };

  const broadcastOscillatorSync = (oscillators: any[]) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'oscillator_sync',
      payload: {
        sender: currentUserId,
        oscillators
      }
    });
  };

  return {
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
  };
};
