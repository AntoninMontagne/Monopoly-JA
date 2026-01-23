import React, { useState } from 'react';
import PropertyCard from './PropertyCard';
import './PropertyList.css';

function PropertyList({ properties, ownedIds, onBuy, onTrade, canBuy }) {
  const [filter, setFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'Toutes' },
    { id: 'owned', label: 'Mes proprietes' },
    { id: 'available', label: 'Disponibles' }
  ];

  const filteredProperties = properties.filter(prop => {
    const isOwned = ownedIds.includes(prop.id);
    if (filter === 'owned') return isOwned;
    if (filter === 'available') return !isOwned && prop.forSale;
    return true;
  });

  return (
    <div className="property-list">
      <div className="property-list-header">
        <h2>Proprietes</h2>
        <div className="filter-buttons">
          {filters.map(f => (
            <button
              key={f.id}
              className={`filter-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="property-grid">
        {filteredProperties.length === 0 ? (
          <p className="no-properties">Aucune propriete trouvee</p>
        ) : (
          filteredProperties.map(prop => (
            <PropertyCard
              key={prop.id}
              property={prop}
              isOwned={ownedIds.includes(prop.id)}
              canBuy={prop.forSale && canBuy}
              onBuy={onBuy}
              onTrade={onTrade}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default PropertyList;