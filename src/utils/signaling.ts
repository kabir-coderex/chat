import { v4 as uuidv4 } from 'uuid';

import { PeerData } from "../types";

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate';
  payload: PeerData['data'];
  target: string;
  sender: string;
}

export class SignalingService {
  private channel: BroadcastChannel;
  private peerId: string;
  private onMessageCallback: (message: SignalingMessage) => void = () => {};

  constructor(peerId?: string) {
    this.peerId = peerId || uuidv4();
    this.channel = new BroadcastChannel('webrtc-signaling');
    this.channel.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const message: SignalingMessage = event.data;
    if (message.target === this.peerId) {
      this.onMessageCallback(message);
    }
  }

  public getPeerId(): string {
    return this.peerId;
  }

  public sendMessage(target: string, type: 'offer' | 'answer' | 'candidate', payload: PeerData['data']) {
    const message: SignalingMessage = {
      type,
      payload,
      target,
      sender: this.peerId,
    };
    this.channel.postMessage(message);
  }

  public onMessage(callback: (message: SignalingMessage) => void) {
    this.onMessageCallback = callback;
  }

  public close() {
    this.channel.close();
  }
}
