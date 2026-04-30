import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContract } from '../hooks/useContract';
import '../styles/BookingModal.css';

const BookingModal = ({ equipment, contractAddress, contractABI, onClose, onSuccess }) => {
  const { write, loading, error } = useContract(contractAddress, contractABI);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [approving, setApproving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    calculateCost();
  }, [startDate, endDate]);

  const calculateCost = () => {
    if (startDate && endDate) {
      const start = new Date(startDate + 'T12:00:00').getTime();
      const end = new Date(endDate + 'T12:00:00').getTime();

      if (end <= start) {
        setValidationError('End date must be after start date');
        setTotalCost(0);
        return;
      }

      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const cost = days * parseFloat(equipment.pricePerDay);
      setTotalCost(cost);
      setValidationError('');
    }
  };

  const getTodayDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleBooking = async () => {
    try {
      setValidationError('');
      setStatusMsg('');

      if (!startDate || !endDate) {
        setValidationError('Please select both dates');
        return;
      }

      const startTimestamp = Math.floor(new Date(startDate + 'T12:00:00').getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate + 'T12:00:00').getTime() / 1000);

      if (endTimestamp <= startTimestamp) {
        setValidationError('End date must be after start date');
        return;
      }

      // ✅ Step 1: Get signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // ✅ Step 2: Approve ERC20 token spending
      const tokenAddress = process.env.REACT_APP_TOKEN_ADDRESS;

      if (!tokenAddress) {
        setValidationError('Token address not configured. Check your .env file.');
        return;
      }

      const tokenABI = [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)"
      ];

      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
      const costInWei = ethers.parseEther(totalCost.toString());
      const userAddress = await signer.getAddress();

      // Check existing allowance first
      const currentAllowance = await tokenContract.allowance(userAddress, contractAddress);

      if (currentAllowance < costInWei) {
        setApproving(true);
        setStatusMsg('Step 1/2: Approving token spending...');
        const approveTx = await tokenContract.approve(contractAddress, costInWei);
        await approveTx.wait();
        setApproving(false);
        setStatusMsg('✅ Approved! Step 2/2: Creating booking...');
      } else {
        setStatusMsg('Creating booking...');
      }

      // ✅ Step 3: Create booking
      const tx = await write(
        'createBooking',
        equipment.id,
        startTimestamp,
        endTimestamp
      );

      if (tx) {
        setStatusMsg('');
        alert('🎉 Booking created successfully!');
        onSuccess();
      }
    } catch (err) {
      setApproving(false);
      setStatusMsg('');
      setValidationError(err.reason || err.message || 'Booking failed');
      console.error('Booking error:', err);
    }
  };

  const isLoading = loading || approving;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 Book {equipment.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="booking-info">
            <p><strong>Price:</strong> {equipment.pricePerDay} MATIC/day</p>
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={getTodayDate()}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || getTodayDate()}
              className="form-input"
            />
          </div>

          {totalCost > 0 && (
            <div className="cost-summary">
              <p><strong>Total Cost:</strong> {totalCost.toFixed(4)} MATIC</p>
            </div>
          )}

          {/* Status message */}
          {statusMsg && (
            <div className="status-message">{statusMsg}</div>
          )}

          {validationError && (
            <div className="error-message">{validationError}</div>
          )}

          {error && !validationError && (
            <div className="error-message">{error}</div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn-confirm"
            onClick={handleBooking}
            disabled={isLoading || !startDate || !endDate || totalCost <= 0}
          >
            {approving ? '⏳ Approving...' : loading ? '⏳ Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;