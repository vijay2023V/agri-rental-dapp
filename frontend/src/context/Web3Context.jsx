import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export const Web3Context = createContext();

const POLYGON_TESTNET_RPC = 'https://rpc-amoy.polygon.technology/';
const POLYGON_CHAIN_ID = 80002; // Amoy testnet

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Connect to MetaMask
  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Create provider
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      const network = await newProvider.getNetwork();

      setProvider(newProvider);
      setSigner(newSigner);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      // Get balance
      const balance = await newProvider.getBalance(accounts[0]);
      setBalance(ethers.formatEther(balance));

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return { provider: newProvider, signer: newSigner, account: accounts[0] };
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
      console.error('Error connecting wallet:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setBalance('0');
    setIsConnected(false);
    setChainId(null);
  }, []);

  // Handle account changes
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
    }
  };

  // Handle chain changes
  const handleChainChanged = (newChainId) => {
    setChainId(parseInt(newChainId, 16));
  };

  // Switch to Polygon Testnet
  const switchToPolygonTestnet = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + POLYGON_CHAIN_ID.toString(16) }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x' + POLYGON_CHAIN_ID.toString(16),
                chainName: 'Polygon Amoy Testnet',
                rpcUrls: [POLYGON_TESTNET_RPC],
                blockExplorerUrls: ['https://www.oklink.com/amoy'],
                nativeCurrency: {
                  name: 'POL',
                  symbol: 'POL',
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }, []);

  // Auto-connect if already connected
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum?.selectedAddress) {
        try {
          await connectWallet();
        } catch (err) {
          console.error('Auto-connect failed:', err);
        }
      }
    };

    autoConnect();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [connectWallet]);

  const value = {
    provider,
    signer,
    account,
    balance,
    isConnected,
    chainId,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    switchToPolygonTestnet,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
