import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContract } from '../hooks/useContract';
import { useWeb3 } from '../hooks/useWeb3';
import EquipmentCard from './EquipmentCard';
import AddEquipmentModal from './AddEquipmentModal';
import '../styles/EquipmentList.css';

const EquipmentList = ({ contractAddress, contractABI }) => {
  const { account, isConnected } = useWeb3();
  const { call, loading, error } = useContract(contractAddress, contractABI);
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchEquipment();
  }, [isConnected, refreshKey]);

  const fetchEquipment = async () => {
    try {
      if (!isConnected) return;
      if (!contractAddress) {
        console.warn('Contract address not set');
        setEquipment([]);
        setFilteredEquipment([]);
        return;
      }
      const allEquipment = await call('getAllEquipment');
      
      // Convert to readable format
      const formattedEquipment = allEquipment.map((eq) => ({
        id: Number(eq.id),
        name: eq.name,
        description: eq.description,
        owner: eq.owner,
        pricePerDay: ethers.formatEther(eq.pricePerDay),
        isActive: eq.isActive,
        totalBookings: Number(eq.totalBookings),
      }));

      setEquipment(formattedEquipment);
      setFilteredEquipment(formattedEquipment);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setEquipment([]);
      setFilteredEquipment([]);
    }
  };

  useEffect(() => {
    filterEquipment(selectedFilter);
  }, [equipment, selectedFilter]);

  const filterEquipment = (filter) => {
    let filtered = equipment;

    if (filter === 'active') {
      filtered = equipment.filter((eq) => eq.isActive);
    } else if (filter === 'myEquipment') {
      filtered = equipment.filter((eq) => eq.owner.toLowerCase() === account?.toLowerCase());
    }

    setFilteredEquipment(filtered);
  };

  const handleEquipmentAdded = () => {
    setShowAddModal(false);
    setRefreshKey((prev) => prev + 1);
  };

  if (!isConnected) {
    return (
      <div className="equipment-list">
        <div className="message-container">
          <p className="connect-message">Please connect your wallet to view equipment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="equipment-list">
      <div className="equipment-header">
        <h2>🚜 Available Equipment</h2>
        {account && (
          <button 
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            + Add Equipment
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="equipment-filters">
        <button
          className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('all')}
        >
          All Equipment ({equipment.length})
        </button>
        <button
          className={`filter-btn ${selectedFilter === 'active' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('active')}
        >
          Active ({equipment.filter((eq) => eq.isActive).length})
        </button>
        <button
          className={`filter-btn ${selectedFilter === 'myEquipment' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('myEquipment')}
        >
          My Equipment ({equipment.filter((eq) => eq.owner.toLowerCase() === account?.toLowerCase()).length})
        </button>
      </div>

      {loading && <div className="loading">Loading equipment...</div>}

      <div className="equipment-grid">
        {filteredEquipment.length > 0 ? (
          filteredEquipment.map((eq) => (
            <EquipmentCard
              key={eq.id}
              equipment={eq}
              contractAddress={contractAddress}
              contractABI={contractABI}
              onBookingSuccess={() => setRefreshKey((prev) => prev + 1)}
            />
          ))
        ) : (
          <div className="no-equipment">No equipment found</div>
        )}
      </div>

      {showAddModal && (
        <AddEquipmentModal
          contractAddress={contractAddress}
          contractABI={contractABI}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleEquipmentAdded}
        />
      )}
    </div>
  );
};

export default EquipmentList;
