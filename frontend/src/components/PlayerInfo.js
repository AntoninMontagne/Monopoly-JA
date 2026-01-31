import React from 'react';
import './PlayerInfo.css';

function PlayerInfo({ monoBalance, propertyCount, cooldown, lock, isRegistered, onRegister }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRegistered) {
    return (
      <div className="player-info not-registered">
        <h2>Bienvenue dans Monopoly DApp !</h2>
        <p>Inscris-toi pour recevoir 1500 MONO et commencer a jouer.</p>
        <button onClick={onRegister} className="register-btn">
          📝 S'inscrire
        </button>
      </div>
    );
  }

  return (
    <div className="player-info">
      <h2>Mon Profil</h2>
      
      <div className="info-grid">
        <div className="info-card">
          <span className="info-icon">💰</span>
          <span className="info-value">{monoBalance}</span>
          <span className="info-label">MONO</span>
        </div>
        
        <div className="info-card">
          <span className="info-icon">🏠</span>
          <span className="info-value">{propertyCount}/4</span>
          <span className="info-label">Proprietes</span>
        </div>
        
        <div className={`info-card ${cooldown > 0 ? 'active' : ''}`}>
          <span className="info-icon">⏱️</span>
          <span className="info-value">
            {cooldown > 0 ? formatTime(cooldown) : 'OK'}
          </span>
          <span className="info-label">Cooldown</span>
        </div>
        
        <div className={`info-card ${lock > 0 ? 'active' : ''}`}>
          <span className="info-icon">🔒</span>
          <span className="info-value">
            {lock > 0 ? formatTime(lock) : 'OK'}
          </span>
          <span className="info-label">Lock</span>
        </div>
      </div>
    </div>
  );
}

export default PlayerInfo;