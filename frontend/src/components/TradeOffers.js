import React, { useState, useEffect } from 'react';
import './TradeOffers.css';

function TradeOffers({ account, contracts, onAccept, onCancel, properties }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contracts && account) {
      loadOffers();
    }
  }, [contracts, account]);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const gameManager = contracts.gameManager;
      const nextTradeId = await gameManager.nextTradeId();
      
      const loadedOffers = [];
      for (let i = 0; i < Number(nextTradeId); i++) {
        const offer = await gameManager.getTradeOffer(i);
        if (offer.active) {
          const property = properties.find(p => p.id === Number(offer.propertyId));
          loadedOffers.push({
            id: i,
            from: offer.from,
            to: offer.to,
            propertyId: Number(offer.propertyId),
            propertyName: property ? property.name : `Propriete #${offer.propertyId}`,
            price: offer.price,
            isForMe: offer.to.toLowerCase() === account.toLowerCase(),
            isMine: offer.from.toLowerCase() === account.toLowerCase()
          });
        }
      }
      setOffers(loadedOffers);
    } catch (error) {
      console.error('Erreur chargement offres:', error);
    }
    setLoading(false);
  };

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatPrice = (priceWei) => {
    try {
      const priceEth = Number(priceWei) / 1e18;
      return priceEth.toString();
    } catch {
      return '0';
    }
  };

  if (loading) {
    return <div className="trade-offers"><p>Chargement des offres...</p></div>;
  }

  const offersForMe = offers.filter(o => o.isForMe);
  const myOffers = offers.filter(o => o.isMine);

  if (offersForMe.length === 0 && myOffers.length === 0) {
    return null;
  }

  return (
    <div className="trade-offers">
      <h2>Offres d'echange</h2>
      
      {offersForMe.length > 0 && (
        <div className="offers-section">
          <h3>Offres recues</h3>
          {offersForMe.map(offer => (
            <div key={offer.id} className="offer-card received">
              <div className="offer-info">
                <span className="offer-property">{offer.propertyName}</span>
                <span className="offer-from">De: {formatAddress(offer.from)}</span>
                <span className="offer-price">Prix: {formatPrice(offer.price)} MONO</span>
              </div>
              <button 
                className="accept-btn"
                onClick={() => onAccept(offer.id, formatPrice(offer.price))}
              >
                ✅ Accepter
              </button>
            </div>
          ))}
        </div>
      )}
      
      {myOffers.length > 0 && (
        <div className="offers-section">
          <h3>Mes offres en cours</h3>
          {myOffers.map(offer => (
            <div key={offer.id} className="offer-card sent">
              <div className="offer-info">
                <span className="offer-property">{offer.propertyName}</span>
                <span className="offer-to">A: {formatAddress(offer.to)}</span>
                <span className="offer-price">Prix: {formatPrice(offer.price)} MONO</span>
              </div>
              <button 
                className="cancel-btn"
                onClick={() => onCancel(offer.id)}
              >
                ❌ Annuler
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TradeOffers;