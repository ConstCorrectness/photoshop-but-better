import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Results.css';

function Results({ room, playerId }) {
  const navigate = useNavigate();
  const [expandedChain, setExpandedChain] = useState(null);

  const getPlayerName = (playerId) => {
    const player = room.players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  const allChains = room.chains || [];

  return (
    <div className="results-container">
      <div className="results-card">
        <div className="logo-container">
          <img src="/logo.jpg" alt="Telestrations Logo" className="logo" />
        </div>
        <h1 className="results-title">🎉 Game Complete!</h1>
        <p className="results-subtitle">See how the words transformed...</p>

        <div className="chains-section">
          {allChains.map((chain, index) => {
            const isExpanded = expandedChain === index;
            const isYourChain = chain.originalPlayerId === playerId;
            
            return (
              <div 
                key={index} 
                className={`chain-card ${isYourChain ? 'your-chain' : ''}`}
              >
                <div 
                  className="chain-header"
                  onClick={() => setExpandedChain(isExpanded ? null : index)}
                >
                  <h3>
                    {isYourChain && '⭐ '}
                    {getPlayerName(chain.originalPlayerId)}'s Chain
                    {isYourChain && ' (Yours)'}
                  </h3>
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                </div>

                {isExpanded && (
                  <div className="chain-entries">
                    {chain.entries.map((entry, entryIndex) => (
                      <div key={entryIndex} className="chain-entry">
                        <div className="entry-header">
                          <span className="entry-round">Round {entry.round + 1}</span>
                          <span className="entry-player">{getPlayerName(entry.playerId)}</span>
                        </div>
                        
                        {entry.type === 'prompt' && (
                          <div className="entry-content prompt-entry">
                            <strong>Starting Word:</strong> {entry.content}
                          </div>
                        )}
                        
                        {entry.type === 'drawing' && (
                          <div className="entry-content drawing-entry">
                            <img src={entry.content} alt={`Drawing by ${getPlayerName(entry.playerId)}`} />
                          </div>
                        )}
                        
                        {entry.type === 'text' && (
                          <div className="entry-content text-entry">
                            <strong>Guessed:</strong> "{entry.content}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="results-actions">
          <button
            className="btn-play-again"
            onClick={() => navigate('/')}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results;

