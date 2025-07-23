import { PeerData, Message } from '../types';

export class WebRTCConnection {
  private pc: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  private onMessageCallback: (message: Message) => void = () => {};
  private onConnectionStateCallback: (state: string) => void = () => {};

  constructor() {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state change:', this.pc.iceConnectionState);
      this.onConnectionStateCallback(this.pc.iceConnectionState);
    };

    this.pc.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannel(channel);
    };
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log('Data channel opened');
    };

    channel.onmessage = (event) => {
      console.log('Data channel message:', event.data);
      try {
        const data: PeerData = JSON.parse(event.data);
        if (data.type === 'message') {
          this.onMessageCallback(data.data);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    this.dataChannel = channel;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    console.log('Creating offer...');
    this.dataChannel = this.pc.createDataChannel('messages');
    this.setupDataChannel(this.dataChannel);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    console.log('Offer created and local description set:', offer);

    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    console.log('Creating answer...');
    await this.pc.setRemoteDescription(offer);
    console.log('Remote description set');

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    console.log('Answer created and local description set:', answer);

    return answer;
  }

  async acceptAnswer(answer: RTCSessionDescriptionInit) {
    console.log('Accepting answer...');
    await this.pc.setRemoteDescription(answer);
    console.log('Remote description set');
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    console.log('Adding ICE candidate:', candidate);
    await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('ICE candidate added');
  }

  sendMessage(message: Message) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const data: PeerData = {
        type: 'message',
        data: message,
        messageId: message.id
      };
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  onMessage(callback: (message: Message) => void) {
    this.onMessageCallback = callback;
  }

  onConnectionStateChange(callback: (state: string) => void) {
    this.onConnectionStateCallback = callback;
  }

  onIceCandidate(callback: (candidate: RTCIceCandidateInit) => void) {
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
        callback(event.candidate.toJSON());
      }
    };
  }

  isConnected(): boolean {
    return this.pc.iceConnectionState === 'connected';
  }

  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    this.pc.close();
  }
}