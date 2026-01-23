import { ethers } from 'ethers';

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask n'est pas installé !");
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });

  return accounts[0];
};

export const getAccount = async () => {
  if (!window.ethereum) return null;

  const accounts = await window.ethereum.request({
    method: 'eth_accounts'
  });

  return accounts[0] || null;
};

export const getBalance = async (address) => {
  if (!window.ethereum) return null;

  const provider = new ethers.BrowserProvider(window.ethereum);
  const balance = await provider.getBalance(address);

  return parseFloat(ethers.formatEther(balance)).toFixed(4);
};

export const getProvider = () => {
  if (!window.ethereum) return null;
  return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  if (!provider) return null;
  return await provider.getSigner();
};

export const getNetwork = async () => {
  if (!window.ethereum) return null;

  const provider = getProvider();
  const network = await provider.getNetwork();

  return {
    chainId: Number(network.chainId),
    name: network.name
  };
};

export const switchToSepolia = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }] // 11155111 en hex
    });
  } catch (error) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io']
        }]
      });
    }
  }
};