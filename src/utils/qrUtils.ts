import QRCode from 'qrcode';

export const qrUtils = {
  async generateQR(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        width: 256,
        margin: 1,
        color: {
          dark: '#3B82F6',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  },

  downloadQR(dataUrl: string, filename: string = 'chat-qr-code.png') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  shareViaWhatsApp(qrData: string) {
    const message = `Join my secure chat! Use this code: ${qrData}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },

  shareViaMessenger(qrData: string) {
    const message = `Join my secure chat! Use this code: ${qrData}`;
    const url = `https://www.messenger.com/t/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
};