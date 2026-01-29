import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import addresses from '../contracts/addresses.json';
import MonopolyTokenABI from '../contracts/MonopolyToken.json';
import PropertyNFTABI from '../contracts/PropertyNFT.json';
import GameManagerABI from '../contracts/GameManager.json';

export function useContracts(account) {
  const [contracts, setContracts] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account && window.ethereum) {
      initContracts();
    }
  }, [account]);

  const initContracts = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const monopolyToken = new ethers.Contract(
        addresses.contracts.MonopolyToken,
        MonopolyTokenABI.abi,
        signer
      );

      const propertyNFT = new ethers.Contract(
        addresses.contracts.PropertyNFT,
        PropertyNFTABI.abi,
        signer
      );

      const gameManager = new ethers.Contract(
        addresses.contracts.GameManager,
        GameManagerABI.abi,
        signer
      );

      setContracts({ monopolyToken, propertyNFT, gameManager });
    } catch (error) {
      console.error('Erreur initialisation contrats:', error);
    }
    setLoading(false);
  };

  const registerPlayer = async () => {
    if (!contracts) return;
    const tx = await contracts.gameManager.registerPlayer();
    const receipt = await tx.wait(1);
    return receipt;
  };

  const isPlayerRegistered = async (address) => {
    if (!contracts) return false;
    return await contracts.gameManager.isPlayerRegistered(address);
  };

  const getPlayerBalance = async (address) => {
    if (!contracts) return 0;
    const balance = await contracts.gameManager.getPlayerBalance(address);
    return ethers.formatEther(balance);
  };

  const getPlayerPropertyCount = async (address) => {
    if (!contracts) return 0;
    const count = await contracts.gameManager.getPlayerPropertyCount(address);
    return Number(count);
  };

  const getCooldownRemaining = async (address) => {
    if (!contracts) return 0;
    const remaining = await contracts.gameManager.getCooldownRemaining(address);
    return Number(remaining);
  };

  const getLockRemaining = async (address) => {
    if (!contracts) return 0;
    const remaining = await contracts.gameManager.getLockRemaining(address);
    return Number(remaining);
  };

  const buyProperty = async (propertyId, price) => {
    if (!contracts) return;
    
    const priceWei = ethers.parseEther(price.toString());
    
    const approveTx = await contracts.monopolyToken.approve(
      addresses.contracts.GameManager,
      priceWei
    );
    await approveTx.wait();
    
    const buyTx = await contracts.gameManager.buyPropertyFromBank(propertyId, priceWei);
    await buyTx.wait();
  };

  const createTradeOffer = async (to, propertyId, price) => {
    if (!contracts) return;
    
    const approveTx = await contracts.propertyNFT.approve(
      addresses.contracts.GameManager,
      propertyId
    );
    await approveTx.wait();
    
    const priceWei = ethers.parseEther(price.toString());
    const tradeTx = await contracts.gameManager.createTradeOffer(to, propertyId, priceWei);
    await tradeTx.wait();
  };

  const acceptTradeOffer = async (tradeId, price) => {
    if (!contracts) return;
    
    const priceWei = ethers.parseEther(price.toString());
    
    const approveTx = await contracts.monopolyToken.approve(
      addresses.contracts.GameManager,
      priceWei
    );
    await approveTx.wait();
    
    const acceptTx = await contracts.gameManager.acceptTradeOffer(tradeId);
    await acceptTx.wait();
  };

  const cancelTradeOffer = async (tradeId) => {
    if (!contracts) return;
    const tx = await contracts.gameManager.cancelTradeOffer(tradeId);
    await tx.wait();
  };

  const getPropertyOwner = async (propertyId) => {
    if (!contracts) return null;
    try {
      const owner = await contracts.propertyNFT.ownerOf(propertyId);
      return owner;
    } catch (error) {
      return null;
    }
  };

  const getPropertiesOwners = async (totalProperties) => {
    if (!contracts) return {};
    const owners = {};
    for (let i = 0; i < totalProperties; i++) {
      try {
        const owner = await contracts.propertyNFT.ownerOf(i);
        owners[i] = owner;
      } catch (error) {
        owners[i] = null;
      }
    }
    return owners;
  };

  return {
    contracts,
    loading,
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
    getPropertyOwner,
    getPropertiesOwners
  };
}