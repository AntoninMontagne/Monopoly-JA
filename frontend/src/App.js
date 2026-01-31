import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import PlayerInfo from './components/PlayerInfo';
import PropertyList from './components/PropertyList';
import TradeModal from './components/TradeModal';
import TradeOffers from './components/TradeOffers';
import { connectWallet, getAccount, getBalance, switchToSepolia, getNetwork } from './utils/ethereum';
import { useContracts } from './hooks/useContracts';
import propertiesData from './data/properties.json';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txLoading, setTxLoading] = useState(false);
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [monoBalance, setMonoBalance] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [ownedPropertyIds, setOwnedPropertyIds] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [lock, setLock] = useState(0);
  
  const [properties, setProperties] = useState([]);
  const [tradeModalProperty, setTradeModalProperty] = useState(null);

  const {
    contracts,
    registerPlayer,
    isPlayerRegistered,
    getPlayerBalance,
    getPlayerPropertyCount,
    getCooldownRemaining,
    getLockRemaining,
    buyProperty,
    createTradeOffer,
    acceptTradeOffer,
    cancelTradeOffer,
    getPropertiesOwners
  } = useContracts(account);

  useEffect(() => {
    checkConnection();
    loadProperties();
  }, []);

  useEffect(() => {
    if (account && contracts) {
      loadPlayerData();
      loadPropertiesOwners();
    }
  }, [account, contracts]);

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
      await checkNetwork();
    }
  };

  const checkNetwork = async () => {
    const network = await getNetwork();
    if (network && network.chainId !== 11155111) {
      try {
        await switchToSepolia();
      } catch (err) {
        setError('Veuillez passer sur le reseau Sepolia');
      }
    }
  };

  const loadProperties = async () => {
    const propsWithStatus = propertiesData.properties.map(prop => ({
      ...prop,
      forSale: true,
      owner: null
    }));
    setProperties(propsWithStatus);
  };

  const loadPropertiesOwners = async () => {
    if (!contracts) return;
    
    try {
      const owners = await getPropertiesOwners(28);
      const ownerAddress = await contracts.propertyNFT.owner();
      
      setProperties(prev => prev.map(prop => {
        const propOwner = owners[prop.id];
        const isOwnedByBank = propOwner && propOwner.toLowerCase() === ownerAddress.toLowerCase();
        const isOwnedByMe = propOwner && account && propOwner.toLowerCase() === account.toLowerCase();
        
        return {
          ...prop,
          owner: propOwner,
          forSale: isOwnedByBank,
          isOwnedByMe: isOwnedByMe
        };
      }));
      
      const myProps = Object.entries(owners)
        .filter(([id, owner]) => owner && account && owner.toLowerCase() === account.toLowerCase())
        .map(([id]) => parseInt(id));
      
      setOwnedPropertyIds(myProps);
    } catch (error) {
      console.error('Erreur chargement proprietaires:', error);
    }
  };

  const loadPlayerData = async () => {
    try {
      const registered = await isPlayerRegistered(account);
      setIsRegistered(registered);
      
      if (registered) {
        const mono = await getPlayerBalance(account);
        setMonoBalance(parseFloat(mono));
        
        const count = await getPlayerPropertyCount(account);
        setPropertyCount(count);
        
        const cd = await getCooldownRemaining(account);
        setCooldown(cd);
        
        const lk = await getLockRemaining(account);
        setLock(lk);
      }
    } catch (err) {
      console.error('Erreur chargement donnees:', err);
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
      await checkNetwork();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setTxLoading(true);
    setError(null);
    try {
      await registerPlayer();
      
      // Attendre un peu pour la propagation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsRegistered(true);
      await loadPlayerData();
      alert('Inscription reussie ! Tu as recu 1500 MONO.');
    } catch (err) {
      console.error('Erreur inscription:', err);
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction annulee');
      } else {
        setError('Erreur lors de l\'inscription. Recharge la page.');
      }
    }
    setTxLoading(false);
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

    setTxLoading(true);
    setError(null);
    try {
      await buyProperty(property.id, property.value);
      
      setOwnedPropertyIds(prev => [...prev, property.id]);
      setProperties(prev => prev.map(p => 
        p.id === property.id ? { ...p, forSale: false } : p
      ));
      
      await loadPlayerData();
      await loadPropertiesOwners();
      alert(`Tu as achete ${property.name} pour ${property.value} MONO !`);
    } catch (err) {
      console.error('Erreur achat:', err);
      setError('Erreur lors de l\'achat');
    }
    setTxLoading(false);
  };

  const handleTrade = (property) => {
    if (cooldown > 0) {
      alert(`Cooldown actif ! Attends encore ${cooldown} secondes.`);
      return;
    }
    setTradeModalProperty(property);
  };

  const handleTradeSubmit = async (propertyId, toAddress, price) => {
    setTxLoading(true);
    setError(null);
    try {
      await createTradeOffer(toAddress, propertyId, price);
      await loadPlayerData();
      alert(`Offre d'echange creee pour ${toAddress} au prix de ${price} MONO !`);
    } catch (err) {
      console.error('Erreur creation offre:', err);
      setError('Erreur lors de la creation de l\'offre');
    }
    setTxLoading(false);
  };

  const handleAcceptOffer = async (tradeId, price) => {
    setTxLoading(true);
    setError(null);
    try {
      await acceptTradeOffer(tradeId, price);
      await loadPlayerData();
      await loadPropertiesOwners();
      alert('Echange accepte !');
    } catch (err) {
      console.error('Erreur acceptation offre:', err);
      setError('Erreur lors de l\'acceptation de l\'offre');
    }
    setTxLoading(false);
  };

  const handleCancelOffer = async (tradeId) => {
    setTxLoading(true);
    setError(null);
    try {
      await cancelTradeOffer(tradeId);
      alert('Offre annulee !');
    } catch (err) {
      console.error('Erreur annulation offre:', err);
      setError('Erreur lors de l\'annulation de l\'offre');
    }
    setTxLoading(false);
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
        {txLoading && <p className="loading-message">Transaction en cours...</p>}
        
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
              <>
                <TradeOffers
                  account={account}
                  contracts={contracts}
                  properties={properties}
                  onAccept={handleAcceptOffer}
                  onCancel={handleCancelOffer}
                />
                <PropertyList 
                  properties={properties}
                  ownedIds={ownedPropertyIds}
                  onBuy={handleBuy}
                  onTrade={handleTrade}
                  canBuy={propertyCount < 4 && cooldown === 0 && lock === 0 && !txLoading}
                />
              </>
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