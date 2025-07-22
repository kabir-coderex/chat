export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'peer';
  timestamp: number;
  type: 'text' | 'image' | 'file';
  imageData?: string;
}

export interface Connection {
  id: string;
  peerId: string;
  created: number;
  lastSeen: number;
}

export interface PeerData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'message' | 'request-offer';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit | Message | object;
  messageId?: string;
}