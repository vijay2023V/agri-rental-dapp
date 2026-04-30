import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import '../styles/WalletConnect.css';

const WalletConnect = () => {
  const {
    account,
    balance,
    isConnected,
    loading,
    error,
    chainId,
    connectWallet,
    disconnectWallet,
    switchToPolygonTestnet,
  } = useWeb3();

  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (chainId && chainId !== 80002) {
      console.warn('Not on Polygon Testnet. Chain ID:', chainId);
    }
  }, [chainId]);

  const handleConnectClick = async () => {
    try {
      await connectWallet();
      await switchToPolygonTestnet();
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const formatAddress = (address) => {
    return `${address?.slice(0, 6)}...${address?.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="wallet-connect">
        <button className="connect-btn loading" disabled>
          Connecting...
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-connect">
        <div className="error-message">{error}</div>
        <button className="connect-btn error" onClick={handleConnectClick}>
          Retry Connection
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="wallet-connect">
        <button className="connect-btn" onClick={handleConnectClick}>
          🔗 Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <div className="wallet-info">
        <div className="wallet-dropdown">
          <button
            className="wallet-btn connected"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="status-indicator">●</span>
            {formatAddress(account)}
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item">
                <span>Address:</span>
                <span className="value">{account}</span>
              </div>
              <div className="dropdown-item">
                <span>Balance:</span>
                <span className="value">{parseFloat(balance).toFixed(4)} MATIC</span>
              </div>
              <div className="dropdown-item">
                <span>Network:</span>
                <span className="value">{chainId === 80002 ? '✓ Polygon Testnet' : '✗ Wrong Network'}</span>
              </div>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-disconnect"
                onClick={() => {
                  disconnectWallet();
                  setShowDropdown(false);
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
