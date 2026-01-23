import React from 'react';
import './PropertyCard.css';

function PropertyCard({ property, onBuy, onTrade, isOwned, canBuy }) {
  const getTypeColor = (type) => {
    const colors = {
      'STREET_BROWN': '#8B4513',
      'STREET_LIGHTBLUE': '#87CEEB',
      'STREET_PINK': '#FF69B4',
      'STREET_ORANGE': '#FFA500',
      'STREET_RED': '#FF0000',
      'STREET_YELLOW': '#FFFF00',
      'STREET_GREEN': '#008000',
      'STREET_DARKBLUE': '#00008B',
      'STATION': '#333333',
      'UTILITY': '#FFD700'
    };
    return colors[type] || '#666';
  };

  return (
    <div className={`property-card ${isOwned ? 'owned' : ''}`}>
      <div 
        className="property-color-bar" 
        style={{ backgroundColor: getTypeColor(property.type) }}
      />
      
      <div className="property-content">
        <h3 className="property-name">{property.name}</h3>
        <p className="property-type">{property.type.replace('STREET_', '').replace('_', ' ')}</p>
        
        <div className="property-stats">
          <div className="stat">
            <span className="stat-label">Prix</span>
            <span className="stat-value">{property.value} MONO</span>
          </div>
          <div className="stat">
            <span className="stat-label">Loyer</span>
            <span className="stat-value">{property.rent} MONO</span>
          </div>
        </div>
        
        {isOwned ? (
          <button 
            className="property-btn trade-btn"
            onClick={() => onTrade(property)}
          >
            🔄 Proposer echange
          </button>
        ) : canBuy ? (
          <button 
            className="property-btn buy-btn"
            onClick={() => onBuy(property)}
          >
            🛒 Acheter
          </button>
        ) : (
          <span className="property-status">Non disponible</span>
        )}
      </div>
    </div>
  );
}

export default PropertyCard;