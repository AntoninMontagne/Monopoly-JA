import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import PlayerInfo from './components/PlayerInfo';
import PropertyList from './components/PropertyList';
import TradeModal from './components/TradeModal';
import { connectWallet, getAccount, getBalance } from './utils/ethereum';
import propertiesData from './data/properties.json';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [monoBalance, setMonoBalance] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [ownedPropertyIds, setOwnedPropertyIds] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [lock, setLock] = useState(0);
  
  const [properties, setProperties] = useState([]);
  const [tradeModalProperty, setTradeModalProperty] = useState(null);

  useEffect(() => {
    checkConnection();
    loadProperties();
  }, []);

  useEffect(() => {
    if (cooldown > 0 || lock > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => Math.max(0, prev - 1));
        setLock(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown, lock]);

  const checkConnection = async () => {
    const acc = await getAccount();
    if (acc) {
      setAccount(acc);
      const bal = await getBalance(acc);
      setBalance(bal);
    }
  };

  const loadProperties = () => {
    const propsWithStatus = propertiesData.properties.map(prop => ({
      ...prop,
      forSale: true
    }));
    setProperties(propsWithStatus);
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

  const handleRegister = async () => {
    setIsRegistered(true);
    setMonoBalance(1500);
    alert('Inscription reussie ! Tu as recu 1500 MONO.');
  };

  const handleBuy = async (property) => {
    if (cooldown > 0) {
      alert(`Cooldown actif ! Attends encore ${cooldown} secondes.`);
      return;
    }
    if (lock > 0) {
      alert(`Lock actif ! Attends encore ${lock} secondes.`);
      return;
    }
    if (propertyCount >= 4) {
      alert('Tu as deja 4 proprietes ! Vends-en une avant d\'acheter.');
      return;
    }
    if (monoBalance < property.value) {
      alert('Pas assez de MONO !');
      return;
    }

    setMonoBalance(prev => prev - property.value);
    setPropertyCount(prev => prev + 1);
    setOwnedPropertyIds(prev => [...prev, property.id]);
    setCooldown(300);
    setLock(600);

    setProperties(prev => prev.map(p => 
      p.id === property.id ? { ...p, forSale: false } : p
    ));

    alert(`Tu as achete ${property.name} pour ${property.value} MONO !`);
  };

  const handleTrade = (property) => {
    if (cooldown > 0) {
      alert(`Cooldown actif ! Attends encore ${cooldown} secondes.`);
      return;
    }
    setTradeModalProperty(property);
  };

  const handleTradeSubmit = async (propertyId, toAddress, price) => {
    setCooldown(300);
    alert(`Offre d'echange creee pour ${toAddress} au prix de ${price} MONO !`);
  };

  return (
    <div className="App">
      <Header 
        account={account}
        balance={balance}
        onConnect={handleConnect}
        loading={loading}
      />
      
      <main className="main-content">
        {error && <p className="error-message">{error}</p>}
        
        {account ? (
          <>
            <PlayerInfo 
              monoBalance={monoBalance}
              propertyCount={propertyCount}
              cooldown={cooldown}
              lock={lock}
              isRegistered={isRegistered}
              onRegister={handleRegister}
            />
            
            {isRegistered && (
              <PropertyList 
                properties={properties}
                ownedIds={ownedPropertyIds}
                onBuy={handleBuy}
                onTrade={handleTrade}
                canBuy={propertyCount < 4 && cooldown === 0 && lock === 0}
              />
            )}
          </>
        ) : (
          <div className="welcome-section">
            <h2>Bienvenue sur Monopoly DApp</h2>
            <p>Connecte ton wallet MetaMask pour commencer a jouer !</p>
          </div>
        )}
      </main>
      
      {tradeModalProperty && (
        <TradeModal 
          property={tradeModalProperty}
          onClose={() => setTradeModalProperty(null)}
          onSubmit={handleTradeSubmit}
        />
      )}
    </div>
  );
}

export default App;