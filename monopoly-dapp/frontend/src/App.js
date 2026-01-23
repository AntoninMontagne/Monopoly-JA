import React, { useState, useEffect } from 'react';
import './App.css';
import { connectWallet, getAccount, getBalance } from './utils/ethereum';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const acc = await getAccount();
    if (acc) {
      setAccount(acc);
      const bal = await getBalance(acc);
      setBalance(bal);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const acc = await connectWallet();
      setAccount(acc);
      const bal = await getBalance(acc);
      setBalance(bal);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎲 Monopoly DApp</h1>
        
        {!account ? (
          <div className="connect-section">
            <p>Connecte ton wallet pour jouer</p>
            <button 
              onClick={handleConnect} 
              disabled={loading}
              className="connect-btn"
            >
              {loading ? 'Connexion...' : '🦊 Connecter MetaMask'}
            </button>
            {error && <p className="error">{error}</p>}
          </div>
        ) : (
          <div className="wallet-info">
            <p>✅ Connecté : <span className="address">{formatAddress(account)}</span></p>
            <p>💰 Balance : <span className="balance">{balance} ETH</span></p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;