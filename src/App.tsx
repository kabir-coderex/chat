import React, { useState } from 'react';
import { StartupPage } from './components/StartupPage';
import { ChatRoom } from './components/ChatRoom';
import { WebRTCConnection } from './utils/webrtc';

function App() {
  const [connection, setConnection] = useState<WebRTCConnection | null>(null);

  const handleConnected = (newConnection: WebRTCConnection) => {
    setConnection(newConnection);
  };

  const handleDisconnect = () => {
    setConnection(null);
  };

  return (
    <div className="App">
      {connection ? (
        <ChatRoom 
          connection={connection} 
          onDisconnect={handleDisconnect} 
        />
      ) : (
        <StartupPage onConnected={handleConnected} />
      )}
    </div>
  );
}

export default App;