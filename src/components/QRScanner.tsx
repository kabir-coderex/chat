import React, { useRef, useEffect, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, Upload, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initScanner = async () => {
      if (!videoRef.current) return;

      try {
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            onScan(result.data);
            qrScanner.destroy();
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        await qrScanner.start();
        setScanner(qrScanner);
      } catch (err) {
        console.error('Scanner init error:', err);
        setHasCamera(false);
        setError('Camera not available. Please upload an image instead.');
      }
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.destroy();
      }
    };
  }, [onScan]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await QrScanner.scanImage(file);
      onScan(result);
    } catch (err) {
      setError('Could not scan QR code from image. Please try another image.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold mb-4 text-center">Scan QR Code</h3>

        {hasCamera && (
          <div className="mb-4">
            <video
              ref={videoRef}
              className="w-full h-64 bg-gray-900 rounded-xl object-cover"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Upload size={20} />
            Upload Image
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <p className="text-gray-500 text-sm text-center">
            {hasCamera 
              ? 'Point camera at QR code or upload an image' 
              : 'Upload an image containing a QR code'
            }
          </p>
        </div>
      </div>
    </div>
  );
};