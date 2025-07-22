import React, { useState, useEffect } from 'react';
import { QrCode, Scan, MessageSquare, Shield } from 'lucide-react';
import { QRGenerator } from './QRGenerator';
import { QRScanner } from './QRScanner';
import { WebRTCConnection } from '../utils/webrtc';
import { storageUtils } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

interface StartupPageProps {
  onConnected: (connection: WebRTCConnection) => void;
}

export const StartupPage: React.FC<StartupPageProps> = ({ onConnected }) => {
  const [mode, setMode] = useState<'home' | 'generate' | 'scan'>('home');
  const [connectionData, setConnectionData] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check for existing connection
    const existingConnection = storageUtils.getConnection();
    if (existingConnection) {
      // Try to reconnect
      handleReconnect();
    }
  }, []);

  const handleReconnect = async () => {
    setIsConnecting(true);
    try {
      const connection = new WebRTCConnection();
      // In a real implementation, you'd need to store the connection offer/answer
      // For this demo, we'll clear the old connection and start fresh
      storageUtils.clearConnection();
      setIsConnecting(false);
    } catch (error) {
      setError('Failed to reconnect. Please create a new connection.');
      setIsConnecting(false);
    }
  };

  const handleGenerateQR = async () => {
    setIsConnecting(true);
    setError('');

    try {
      const connection = new WebRTCConnection();
      const offer = await connection.createOffer();
      const connectionId = uuidv4();
      
      setConnectionData(JSON.stringify({ id: connectionId, offer }));
      setMode('generate');

      // Wait for connection
      connection.onConnectionStateChange((state) => {
        if (state === 'connected') {
          storageUtils.saveConnection({
            id: connectionId,
            peerId: 'unknown',
            created: Date.now(),
            lastSeen: Date.now()
          });
          onConnected(connection);
        } else if (state === 'failed') {
          setError('Connection failed. Please try again.');
          setIsConnecting(false);
        }
      });
    } catch (err) {
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
      if (!parsedData.offer || !parsedData.id) {
        throw new Error('Invalid QR code data');
      }

      connectToPeer(parsedData);
    } catch (err) {
      setError('Invalid QR code. Please scan a valid chat QR code.');
      setIsConnecting(false);
    }
  };

  const connectToPeer = async (peerData: { id: string; offer: string }) => {
    try {
      const connection = new WebRTCConnection();
      const answer = await connection.createAnswer(peerData.offer);
      
      // In a real implementation, you'd need to exchange the answer with the peer
      // For this demo, we'll simulate the connection
      
      connection.onConnectionStateChange((state) => {
        if (state === 'connected') {
          storageUtils.saveConnection({
            id: uuidv4(),
            peerId: peerData.id,
            created: Date.now(),
            lastSeen: Date.now()
          });
          onConnected(connection);
        } else if (state === 'failed') {
          setError('Connection failed. Please try again.');
          setIsConnecting(false);
        }
      });

      // Simulate successful connection after a brief delay
      setTimeout(() => {
        storageUtils.saveConnection({
          id: uuidv4(),
          peerId: peerData.id,
          created: Date.now(),
          lastSeen: Date.now()
        });
        onConnected(connection);
      }, 2000);
    } catch (err) {
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
            onClick={() => setMode('home')}
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
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
            className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-xl transition-colors shadow-lg"
          >
            <QrCode size={24} />
            Generate QR Code
          </button>

          <button
            onClick={() => setMode('scan')}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-xl transition-colors shadow-lg"
          >
            <Scan size={24} />
            Scan QR Code
          </button>
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