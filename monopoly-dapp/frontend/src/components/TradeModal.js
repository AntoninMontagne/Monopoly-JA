import React, { useState } from 'react';
import './TradeModal.css';

function TradeModal({ property, onClose, onSubmit }) {
  const [toAddress, setToAddress] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toAddress || price === '') return;
    
    setLoading(true);
    try {
      await onSubmit(property.id, toAddress, price);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <h2>Proposer un echange</h2>
        <p className="modal-property-name">{property.name}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adresse du destinataire</label>
            <input
              type="text"
              placeholder="0x..."
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Prix (MONO)</label>
            <input
              type="number"
              placeholder="0"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <span className="hint">Mets 0 pour un don gratuit</span>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'En cours...' : 'Creer offre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TradeModal;