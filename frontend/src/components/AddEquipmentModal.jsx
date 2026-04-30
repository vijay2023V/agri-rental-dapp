import React, { useState } from 'react';
import { useContract } from '../hooks/useContract';
import { ethers } from 'ethers';
import '../styles/AddEquipmentModal.css';

const AddEquipmentModal = ({ contractAddress, contractABI, onClose, onSuccess }) => {
  const { write, loading, error: contractError } = useContract(contractAddress, contractABI);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerDay: '',
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.name || !formData.description || !formData.pricePerDay) {
        setError('Please fill in all fields');
        return;
      }

      if (parseFloat(formData.pricePerDay) <= 0) {
        setError('Price must be greater than 0');
        return;
      }

      // Convert price to wei
      const priceInWei = ethers.parseEther(formData.pricePerDay);

      // Call contract method
      const tx = await write(
        'addEquipment',
        formData.name,
        formData.description,
        priceInWei
      );

      if (tx) {
        alert('Equipment added successfully!');
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to add equipment');
      console.error('Error adding equipment:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Add New Equipment</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Equipment Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Tractor JCB 3DX"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your equipment..."
              rows="4"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price per Day (MATIC) *</label>
            <input
              id="price"
              type="number"
              name="pricePerDay"
              value={formData.pricePerDay}
              onChange={handleInputChange}
              placeholder="0.1"
              step="0.01"
              min="0"
              className="form-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {contractError && <div className="error-message">{contractError}</div>}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-confirm" disabled={loading}>
              {loading ? 'Adding...' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEquipmentModal;
