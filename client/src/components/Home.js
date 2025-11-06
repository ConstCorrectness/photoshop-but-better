import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    const newRoomId = generateRoomId();
    navigate(`/room/${newRoomId}?name=${encodeURIComponent(playerName)}&host=true`);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    navigate(`/room/${roomId.toUpperCase()}?name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="logo-container">
          <img src="/logo.jpg" alt="Telestrations Logo" className="logo" />
        </div>
        <h1 className="title">🎨 Telestrations</h1>
        <p className="subtitle">Draw, guess, and laugh at the hilarious results!</p>
        
        <div className="input-group">
          <label>Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && isCreating) handleCreateRoom();
              else if (e.key === 'Enter' && !isCreating) handleJoinRoom();
            }}
          />
        </div>

        <div className="button-group">
          <button 
            className="btn btn-primary" 
            onClick={handleCreateRoom}
            onMouseEnter={() => setIsCreating(true)}
            onMouseLeave={() => setIsCreating(false)}
          >
            Create Room
          </button>
          
          <div className="divider">
            <span>OR</span>
          </div>
          
          <div className="join-section">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="Enter Room ID"
              maxLength={6}
              className="room-id-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleJoinRoom();
              }}
            />
            <button 
              className="btn btn-secondary" 
              onClick={handleJoinRoom}
            >
              Join Room
            </button>
          </div>
        </div>

        <div className="instructions">
          <h3>How to Play:</h3>
          <ol>
            <li>Create or join a room (3+ players needed)</li>
            <li>Start with a word or phrase</li>
            <li>Alternate between drawing and writing</li>
            <li>See how your word transforms!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Home;

