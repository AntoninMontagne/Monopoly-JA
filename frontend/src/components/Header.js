import React from 'react';
import './Header.css';

function Header({ account, balance, onConnect, loading }) {
  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="header">
      <div className="header-logo">
        <span className="logo-icon">🎲</span>
        <h1>Monopoly DApp</h1>
      </div>
      
      <div className="header-wallet">
        {!account ? (
          <button 
            onClick={onConnect} 
            disabled={loading}
            className="connect-btn"
          >
            {loading ? 'Connexion...' : '🦊 Connecter MetaMask'}
          </button>
        ) : (
          <div className="wallet-connected">
            <span className="balance">💰 {balance} ETH</span>
            <span className="address">{formatAddress(account)}</span>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;