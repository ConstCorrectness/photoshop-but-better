import React from 'react';
import './Lobby.css';

function Lobby({ room, playerId, isHost, onStartGame }) {
  const playerCount = room?.players?.length || 0;
  const minPlayers = 3;

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <div className="logo-container">
          <img src="/logo.jpg" alt="Telestrations Logo" className="logo" />
        </div>
        <h1 className="lobby-title">Room: {room?.id}</h1>
        
        <div className="players-section">
          <h2>Players ({playerCount}/{minPlayers}+)</h2>
          <div className="players-list">
            {room?.players?.map((player) => (
              <div 
                key={player.id} 
                className={`player-item ${player.id === playerId ? 'current-player' : ''}`}
              >
                <span className="player-name">{player.name}</span>
                {player.id === playerId && <span className="you-badge">You</span>}
                {player.id === room?.hostId && <span className="host-badge">Host</span>}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="start-section">
            <button
              className="btn-start"
              onClick={onStartGame}
              disabled={playerCount < minPlayers}
            >
              {playerCount < minPlayers
                ? `Need ${minPlayers - playerCount} more player(s) to start`
                : 'Start Game'}
            </button>
          </div>
        )}

        {!isHost && (
          <div className="waiting-message">
            Waiting for host to start the game...
          </div>
        )}

        <div className="share-section">
          <p>Share this room ID with your friends:</p>
          <div className="room-id-display">{room?.id}</div>
        </div>
      </div>
    </div>
  );
}

export default Lobby;

