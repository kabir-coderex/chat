import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Scan, MessageSquare, Shield } from 'lucide-react';
import { QRGenerator } from './QRGenerator';
import { QRScanner } from './QRScanner';
import { WebRTCConnection } from '../utils/webrtc';
import { storageUtils } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { SignalingService, SignalingMessage } from '../utils/signaling';

interface StartupPageProps {
  onConnected: (connection: WebRTCConnection) => void;
}

export const StartupPage: React.FC<StartupPageProps> = ({ onConnected }) => {
  const [mode, setMode] = useState<'home' | 'generate' | 'scan'>('home');
  const [connectionData, setConnectionData] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  const connectionRef = useRef<WebRTCConnection | null>(null);
  const signalingRef = useRef<SignalingService | null>(null);

  useEffect(() => {
    // Check for existing connection
    const existingConnection = storageUtils.getConnection();
    if (existingConnection) {
      // Try to reconnect
      handleReconnect();
    }

    return () => {
      signalingRef.current?.close();
    };
  }, []);

  const handleReconnect = async () => {
    setIsConnecting(true);
    try {
      new WebRTCConnection();
      // In a real implementation, you'd need to store the connection offer/answer
      // For this demo, we'll clear the old connection and start fresh
      storageUtils.clearConnection();
      setIsConnecting(false);
    } catch {
      setError('Failed to reconnect. Please create a new connection.');
      setIsConnecting(false);
    }
  };

  const handleGenerateQR = async () => {
    setIsConnecting(true);
    setError('');

    try {
      const connection = new WebRTCConnection();
      connectionRef.current = connection;

      const signaling = new SignalingService();
      signalingRef.current = signaling;

      const offer = await connection.createOffer();
      const peerId = signaling.getPeerId();
      
      setConnectionData(JSON.stringify({ peerId }));
      setMode('generate');

      const intervalId = setInterval(() => {
        if (connection.isConnected()) {
          clearInterval(intervalId);
          return;
        }
        signaling.sendMessage(peerId, 'request-offer', {});
      }, 5000);

      signaling.onMessage(async (message: SignalingMessage) => {
        if (message.type === 'answer') {
          await connection.acceptAnswer(message.payload);
        } else if (message.type === 'candidate') {
          await connection.addIceCandidate(message.payload);
        } else if (message.type === 'request-offer') {
          const offer = await connection.createOffer();
          await signaling.sendMessage(message.sender, 'offer', offer);
        }
      });

      connection.onIceCandidate((candidate) => {
        signaling.sendMessage(signaling.getPeerId(), 'candidate', candidate);
      });

      connection.onConnectionStateChange((state) => {
        if (state === 'connected') {
          clearInterval(intervalId);
          storageUtils.saveConnection({
            id: uuidv4(),
            peerId: 'unknown', // You might want to get this from signaling
            created: Date.now(),
            lastSeen: Date.now()
          });
          onConnected(connection);
        } else if (state === 'failed') {
          clearInterval(intervalId);
          setError('Connection failed. Please try again.');
          setIsConnecting(false);
        }
      });

      await signaling.sendMessage(peerId, 'offer', offer);

    } catch {
      setError('Failed to create connection. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleScanQR = (data: string) => {
    setIsConnecting(true);
    setError('');
    setMode('home');

    try {
      const parsedData = JSON.parse(data);
      if (!parsedData.peerId) {
        throw new Error('Invalid QR code data');
      }

      connectToPeer(parsedData.peerId);
    } catch {
      setError('Invalid QR code. Please scan a valid chat QR code.');
      setIsConnecting(false);
    }
  };

  const connectToPeer = async (peerId: string) => {
    try {
      const connection = new WebRTCConnection();
      connectionRef.current = connection;

      const signaling = new SignalingService();
      signalingRef.current = signaling;

      signaling.onMessage(async (message: SignalingMessage) => {
        if (message.type === 'offer') {
          const answer = await connection.createAnswer(message.payload);
          await signaling.sendMessage(peerId, 'answer', answer);
        } else if (message.type === 'candidate') {
          await connection.addIceCandidate(message.payload);
        }
      });

      connection.onIceCandidate((candidate) => {
        signaling.sendMessage(peerId, 'candidate', candidate);
      });

      connection.onConnectionStateChange((state) => {
        if (state === 'connected') {
          storageUtils.saveConnection({
            id: uuidv4(),
            peerId: peerId,
            created: Date.now(),
            lastSeen: Date.now()
          });
          onConnected(connection);
        } else if (state === 'failed') {
          setError('Connection failed. Please try again.');
          setIsConnecting(false);
        }
      });
    } catch {
      setError('Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  };

  if (mode === 'generate') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Share Your QR Code</h2>
            <p className="text-white/80">Someone needs to scan this to connect</p>
          </div>

          <QRGenerator 
            connectionData={connectionData}
            onShare={() => console.log('QR shared')}
          />

          {isConnecting && (
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-white/80">Waiting for connection...</p>
            </div>
          )}

          <button
            onClick={() => {
              setMode('home');
              setIsConnecting(false);
              connectionRef.current?.close();
              signalingRef.current?.close();
            }}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'scan') {
    return (
      <QRScanner
        onScan={handleScanQR}
        onClose={() => setMode('home')}
      />
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4">
            <MessageSquare className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Secure P2P Chat</h1>
          <p className="text-white/80">Connect directly with someone for private messaging</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl">
            <Shield className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-white/90 text-sm">End-to-End Encrypted</p>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl">
            <MessageSquare className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <p className="text-white/90 text-sm">Direct Connection</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={handleGenerateQR}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-xl transition-colors shadow-lg btn"
          >
            <QrCode size={24} />
            Generate QR Code
          </button>

          <button
            onClick={() => setMode('scan')}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-xl transition-colors shadow-lg btn"
          >
            <Scan size={24} />
            Scan QR Code
          </button>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter peer ID"
              className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-xl px-4 py-2 backdrop-blur-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                const peerId = (document.querySelector('input[type="text"]') as HTMLInputElement).value;
                if (peerId) {
                  connectToPeer(peerId);
                }
              }}
              disabled={isConnecting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-xl transition-colors shadow-lg btn"
            >
              Connect
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl text-center">
            {error}
          </div>
        )}

        {isConnecting && (
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-white/80">Connecting...</p>
          </div>
        )}

        {/* Info */}
        <div className="text-center text-white/60 text-sm">
          <p>Messages disappear after 24 hours</p>
          <p>No data is stored on servers</p>
        </div>
      </div>
    </div>
  );
};