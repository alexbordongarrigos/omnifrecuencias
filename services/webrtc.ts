import { supabase } from './starseedAuth';

export interface PeerConnectionInfo {
  peerId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peers: Map<string, PeerConnectionInfo> = new Map();
  private roomId: string;
  private localUserId: string;
  private channel: any;

  public onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  public onPeerDisconnected?: (peerId: string) => void;

  constructor(roomId: string, localUserId: string) {
    this.roomId = roomId;
    this.localUserId = localUserId;
    this.channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false } }
    });
  }

  public async initializeMicrophone() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      return true;
    } catch (e) {
      console.error("Microphone access denied:", e);
      return false;
    }
  }

  public toggleMute(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  public async joinRoom() {
    this.channel
      .on('broadcast', { event: 'webrtc-signal' }, (payload: any) => this.handleSignalingData(payload))
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Announce presence so others can initiate connections
          this.channel.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: { type: 'join', senderId: this.localUserId }
          });
        }
      });
  }

  public leaveRoom() {
    this.peers.forEach(peer => peer.connection.close());
    this.peers.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
    }
    supabase.removeChannel(this.channel);
  }

  private async handleSignalingData(payload: any) {
    const data = payload.payload;
    if (data.senderId === this.localUserId) return; // Ignore own messages
    
    // Target specific user or broadcast
    if (data.targetId && data.targetId !== this.localUserId) return;

    switch (data.type) {
      case 'join':
        // A new user joined, we (as an existing user) create an offer
        await this.createOffer(data.senderId);
        break;
      case 'offer':
        await this.handleOffer(data.senderId, data.sdp);
        break;
      case 'answer':
        await this.handleAnswer(data.senderId, data.sdp);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(data.senderId, data.candidate);
        break;
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.channel.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: { type: 'ice-candidate', senderId: this.localUserId, targetId: peerId, candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.stream = stream;
      }
      if (this.onRemoteStream) {
        this.onRemoteStream(peerId, stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.peers.delete(peerId);
        if (this.onPeerDisconnected) this.onPeerDisconnected(peerId);
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream!));
    }

    this.peers.set(peerId, { peerId, connection: pc });
    return pc;
  }

  private async createOffer(peerId: string) {
    const pc = this.createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    this.channel.send({
      type: 'broadcast',
      event: 'webrtc-signal',
      payload: { type: 'offer', senderId: this.localUserId, targetId: peerId, sdp: pc.localDescription }
    });
  }

  private async handleOffer(peerId: string, sdp: RTCSessionDescriptionInit) {
    let pc = this.peers.get(peerId)?.connection;
    if (!pc) {
      pc = this.createPeerConnection(peerId);
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.channel.send({
      type: 'broadcast',
      event: 'webrtc-signal',
      payload: { type: 'answer', senderId: this.localUserId, targetId: peerId, sdp: pc.localDescription }
    });
  }

  private async handleAnswer(peerId: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.peers.get(peerId)?.connection;
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(peerId)?.connection;
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }
}
