import React from 'react';
import WalletConnect from './components/WalletConnect';
import EquipmentList from './components/EquipmentList';
import Dashboard from './components/Dashboard';
import { Web3Provider } from './context/Web3Context';
import EQUIPMENT_RENTAL_ABI from './utils/EquipmentRental.json';
import './styles/App.css';

// Contract addresses - updated after deployment
const EQUIPMENT_RENTAL_ADDRESS = process.env.REACT_APP_EQUIPMENT_RENTAL_ADDRESS || '';

function App() {
  const [currentPage, setCurrentPage] = React.useState('home');

  return (
    <Web3Provider>
      <div className="app">
        <nav className="navbar">
          <div className="navbar-container">
            <div className="navbar-logo">
              <span className="logo-icon">🌾</span>
              <span className="logo-text">FarmEquip</span>
            </div>
            <div className="navbar-menu">
              <button
                className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
                onClick={() => setCurrentPage('home')}
              >
                Home
              </button>
              <button
                className={`nav-btn ${currentPage === 'equipment' ? 'active' : ''}`}
                onClick={() => setCurrentPage('equipment')}
              >
                Equipment
              </button>
              <button
                className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentPage('dashboard')}
              >
                Dashboard
              </button>
            </div>
            <WalletConnect />
          </div>
        </nav>

        <main className="main-content">
          {currentPage === 'home' && (
            <div className="home-page">
              <div className="hero">
                <h1>🌾 Decentralized Farming Equipment Rental</h1>
                <p>Connect your wallet and start renting farming equipment directly</p>
                <button
                  className="btn-get-started"
                  onClick={() => setCurrentPage('equipment')}
                >
                  Get Started →
                </button>
              </div>
            </div>
          )}

          {currentPage === 'equipment' && (
            <EquipmentList
              contractAddress={EQUIPMENT_RENTAL_ADDRESS}
              contractABI={EQUIPMENT_RENTAL_ABI}
            />
          )}

          {currentPage === 'dashboard' && (
            <Dashboard
              contractAddress={EQUIPMENT_RENTAL_ADDRESS}
              contractABI={EQUIPMENT_RENTAL_ABI}
            />
          )}
        </main>

        <footer className="footer">
          <p>&copy; 2026 FarmEquip DApp. Built on Polygon Testnet.</p>
        </footer>
      </div>
    </Web3Provider>
  );
}

export default App;