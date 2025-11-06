import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Lobby from './Lobby';
import DrawingCanvas from './DrawingCanvas';
import TextInput from './TextInput';
import Results from './Results';
import './Room.css';

// Use the current host with port 3001 for socket connection
// For production, set REACT_APP_SOCKET_URL environment variable
const getSocketUrl = () => {
  // Check for environment variable first (for production)
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  
  // For local development or when on same domain, use the current host
  // Use HTTPS protocol if page is served over HTTPS (for secure WebSocket WSS)
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const host = window.location.hostname;
  // If we're on HTTPS (production), use same host without port (default 443)
  // If we're on HTTP (local), use port 3001
  const url = protocol === 'https:' 
    ? `${protocol}//${host}` 
    : `${protocol}//${host}:3001`;
  
  console.log('Connecting to socket server at:', url);
  return url;
};

const socket = io(getSocketUrl(), {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

function Room() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerName = searchParams.get('name') || 'Player';
  const isHost = searchParams.get('host') === 'true';
  
  const [room, setRoom] = useState(null);
  const [currentChain, setCurrentChain] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnecting(false);
      
      // Get current room state first (in case reconnecting)
      socket.emit('get-room-state', roomId);
      
      // Then create or join room
      if (isHost) {
        socket.emit('create-room', { roomId, playerName });
      } else {
        socket.emit('join-room', { roomId, playerName });
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnecting(false);
      const socketUrl = getSocketUrl();
      setError(`Failed to connect to server at ${socketUrl}. Make sure the server is running on port 3001.`);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected the socket, try to reconnect manually
        socket.connect();
      }
    });

    socket.on('room-created', ({ roomId }) => {
      console.log('Room created:', roomId);
    });

    socket.on('joined-room', ({ roomId }) => {
      console.log('Joined room:', roomId);
    });

    socket.on('room-updated', (roomData) => {
      setRoom(roomData);
      updateCurrentChain(roomData);
    });

    socket.on('game-started', (roomData) => {
      setRoom(roomData);
      updateCurrentChain(roomData);
    });

    socket.on('entry-submitted', ({ playerId: submittedPlayerId, room: roomData }) => {
      setRoom(roomData);
      updateCurrentChain(roomData);
    });

    socket.on('round-complete', (roomData) => {
      setRoom(roomData);
      updateCurrentChain(roomData);
    });

    socket.on('game-complete', (roomData) => {
      setRoom(roomData);
    });

    socket.on('join-error', ({ message }) => {
      setError(message);
      setConnecting(false);
      setTimeout(() => navigate('/'), 3000);
    });

    socket.on('start-error', ({ message }) => {
      alert(message);
    });

    socket.on('room-state', (roomData) => {
      setRoom(roomData);
      updateCurrentChain(roomData);
    });

    // If already connected, emit immediately
    if (socket.connected) {
      socket.emit('get-room-state', roomId);
      if (isHost) {
        socket.emit('create-room', { roomId, playerName });
      } else {
        socket.emit('join-room', { roomId, playerName });
      }
    }

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('room-created');
      socket.off('joined-room');
      socket.off('room-updated');
      socket.off('game-started');
      socket.off('entry-submitted');
      socket.off('round-complete');
      socket.off('game-complete');
      socket.off('join-error');
      socket.off('start-error');
      socket.off('room-state');
    };
  }, [roomId, playerName, isHost, navigate]);

  const updateCurrentChain = (roomData) => {
    if (!roomData || !socket.id) return;
    
    // Find the chain that this player should currently work on
    const chain = roomData.chains?.find(c => c.currentOwnerId === socket.id);
    if (chain) {
      setCurrentChain(chain);
    }
  };

  const handleStartGame = () => {
    socket.emit('start-game', { roomId });
  };

  const handleSubmitEntry = (entry) => {
    socket.emit('submit-entry', { roomId, entry });
  };

  const getCurrentTask = () => {
    if (!currentChain || !room) return null;
    
    const lastEntry = currentChain.entries[currentChain.entries.length - 1];
    if (!lastEntry) return null;
    
    // If last entry was a prompt or text, next is drawing
    // If last entry was a drawing, next is text
    if (lastEntry.type === 'prompt' || lastEntry.type === 'text') {
      return {
        type: 'draw',
        content: lastEntry.content,
        round: room.currentRound
      };
    } else {
      return {
        type: 'text',
        content: lastEntry.content, // This would be the image data
        round: room.currentRound
      };
    }
  };

  if (error && !error.includes('Failed to connect')) {
    // Only auto-redirect for join errors, not connection errors
    return (
      <div className="room-container">
        <div className="error-message">
          <h2>Error: {error}</h2>
          <p>Redirecting to home...</p>
        </div>
      </div>
    );
  }

  if (error && error.includes('Failed to connect')) {
    // Connection error - show helpful message without redirecting
    const socketUrl = `${window.location.protocol}//${window.location.hostname}:3001`;
    return (
      <div className="room-container">
        <div className="error-message">
          <h2>⚠️ Connection Error</h2>
          <p>{error}</p>
          <div className="connection-help">
            <p><strong>Troubleshooting steps:</strong></p>
            <ol>
              <li>Make sure the server is running: <code>npm run dev</code></li>
              <li>Check if the server is accessible at: <code>{socketUrl}</code></li>
              <li>Verify the server console shows: "Server running on http://0.0.0.0:3001"</li>
              <li>Check firewall settings - port 3001 must be open</li>
            </ol>
            <button 
              className="btn-retry" 
              onClick={() => {
                setError(null);
                setConnecting(true);
                socket.disconnect();
                socket.connect();
              }}
            >
              Retry Connection
            </button>
            <button 
              className="btn-home" 
              onClick={() => navigate('/')}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="room-container">
        <div className="loading">
          {connecting ? 'Connecting to server...' : 'Loading room...'}
          {error && <div className="error-text">{error}</div>}
        </div>
      </div>
    );
  }

  // Show results screen
  if (room.gameState === 'results') {
    return <Results room={room} playerId={socket.id} />;
  }

  // Show lobby if game hasn't started
  if (room.gameState === 'waiting') {
    return (
      <Lobby
        room={room}
        playerId={socket.id}
        isHost={isHost}
        onStartGame={handleStartGame}
      />
    );
  }

  // Show game screen
  const currentTask = getCurrentTask();
  const hasSubmitted = currentChain?.entries.length > room.currentRound + 1;

  if (!currentTask || hasSubmitted) {
    return (
      <div className="room-container">
        <div className="waiting-screen">
          <h2>Waiting for other players...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-container">
      <div className="game-header">
        <h2>Room: {roomId}</h2>
        <div className="round-info">
          Round {room.currentRound + 1} of {room.players.length}
        </div>
      </div>

      {currentTask.type === 'draw' ? (
        <DrawingCanvas
          prompt={currentTask.content}
          onSubmit={(imageData) => handleSubmitEntry({ type: 'drawing', content: imageData })}
        />
      ) : (
        <TextInput
          imageData={currentTask.content}
          onSubmit={(text) => handleSubmitEntry({ type: 'text', content: text })}
        />
      )}
    </div>
  );
}

export default Room;

