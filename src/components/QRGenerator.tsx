import React, { useState, useEffect } from 'react';
import { Download, Share2, MessageCircle } from 'lucide-react';
import { qrUtils } from '../utils/qrUtils';

interface QRGeneratorProps {
  connectionData: string;
  onShare?: () => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ connectionData, onShare }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      setIsLoading(true);
      const dataUrl = await qrUtils.generateQR(connectionData);
      setQrDataUrl(dataUrl);
      setIsLoading(false);
    };

    if (connectionData) {
      generateQR();
    }
  }, [connectionData]);

  const handleDownload = () => {
    if (qrDataUrl) {
      qrUtils.downloadQR(qrDataUrl);
    }
  };

  const handleWhatsAppShare = () => {
    qrUtils.shareViaWhatsApp(connectionData);
    onShare?.();
  };

  const handleMessengerShare = () => {
    qrUtils.shareViaMessenger(connectionData);
    onShare?.();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
        <div className="w-64 h-64 bg-gray-300 animate-pulse rounded-xl mb-4"></div>
        <p className="text-white/80">Generating QR Code...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
      <div className="mb-4">
        <img 
          src={qrDataUrl} 
          alt="Connection QR Code" 
          className="w-64 h-64 rounded-xl shadow-lg"
        />
      </div>
      
      <p className="text-white/90 text-center mb-6 text-sm max-w-sm">
        Share this QR code with someone to start a secure peer-to-peer chat
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Download size={16} />
          Download
        </button>
        
        <button
          onClick={handleWhatsAppShare}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <MessageCircle size={16} />
          WhatsApp
        </button>
        
        <button
          onClick={handleMessengerShare}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
        >
          <Share2 size={16} />
          Messenger
        </button>
      </div>
    </div>
  );
};