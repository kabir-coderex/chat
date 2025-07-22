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

  async createOffer(): Promise<string> {
    this.dataChannel = this.pc.createDataChannel('messages');
    this.setupDataChannel(this.dataChannel);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    return new Promise((resolve) => {
      this.pc.onicecandidate = (event) => {
        if (!event.candidate) {
          resolve(JSON.stringify(this.pc.localDescription));
        }
      };
    });
  }

  async createAnswer(offerString: string): Promise<string> {
    const offer = JSON.parse(offerString);
    await this.pc.setRemoteDescription(offer);

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    return new Promise((resolve) => {
      this.pc.onicecandidate = (event) => {
        if (!event.candidate) {
          resolve(JSON.stringify(this.pc.localDescription));
        }
      };
    });
  }

  async acceptAnswer(answerString: string) {
    const answer = JSON.parse(answerString);
    await this.pc.setRemoteDescription(answer);
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