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

  // ✅ Get current datetime in local format for min value
  const getNowDatetime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const calculateCost = () => {
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      if (end <= start) {
        setValidationError('End date must be after start date');
        setTotalCost(0);
        return;
      }

      const hours = (end - start) / (1000 * 60 * 60);
      const days = Math.ceil(hours / 24);
      const cost = days * parseFloat(equipment.pricePerDay);
      setTotalCost(cost);
      setValidationError('');
    }
  };

  // ✅ Helper: fetch network gas fees dynamically (fixes "gas tip below minimum" error)
  const getGasOverrides = async (provider) => {
    try {
      const feeData = await provider.getFeeData();
      return {
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        maxFeePerGas: feeData.maxFeePerGas,
      };
    } catch {
      // Fallback: hardcode safe values for Polygon Amoy (25+ GWEI tip required)
      return {
        maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'),
        maxFeePerGas: ethers.parseUnits('60', 'gwei'),
      };
    }
  };

  const handleBooking = async () => {
    try {
      setValidationError('');
      setStatusMsg('');

      if (!startDate || !endDate) {
        setValidationError('Please select both dates and times');
        return;
      }

      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      const nowTimestamp = Math.floor(Date.now() / 1000);

      if (startTimestamp <= nowTimestamp) {
        setValidationError('Start time must be in the future');
        return;
      }

      if (endTimestamp <= startTimestamp) {
        setValidationError('End time must be after start time');
        return;
      }

      // ✅ Step 1: Get signer & gas overrides
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const gasOverrides = await getGasOverrides(provider); // 🔧 FIX: fetch gas dynamically

      // ✅ Step 2: Approve ERC20 token spending
      const tokenAddress = process.env.REACT_APP_TEST_TOKEN_ADDRESS;

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

      const currentAllowance = await tokenContract.allowance(userAddress, contractAddress);

      if (currentAllowance < costInWei) {
        setApproving(true);
        setStatusMsg('Step 1/2: Approving token spending...');

        // 🔧 FIX: pass gasOverrides to approve so tip meets Polygon minimum
        const approveTx = await tokenContract.approve(contractAddress, costInWei, gasOverrides);
        await approveTx.wait();

        setApproving(false);
        setStatusMsg('✅ Approved! Step 2/2: Creating booking...');
      } else {
        setStatusMsg('Creating booking...');
      }

      // ✅ Step 3: Create booking
      // 🔧 FIX: pass gasOverrides to createBooking as well
      const tx = await write(
        'createBooking',
        equipment.id,
        startTimestamp,
        endTimestamp,
        gasOverrides  // pass as last argument — your useContract hook's write() should spread this
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

  const getRentalDuration = () => {
    if (!startDate || !endDate) return null;
    const hours = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60));
    const days = Math.ceil(hours / 24);
    return `${hours} hours (${days} day${days > 1 ? 's' : ''})`;
  };

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
            <p><strong>Owner:</strong> {equipment.owner?.slice(0, 8)}...{equipment.owner?.slice(-6)}</p>
          </div>

          <div className="form-group">
            <label>📅 Start Date & Time</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={getNowDatetime()}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>📅 End Date & Time</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || getNowDatetime()}
              className="form-input"
            />
          </div>

          {startDate && endDate && !validationError && (
            <div className="duration-info">
              <p>⏱️ <strong>Duration:</strong> {getRentalDuration()}</p>
            </div>
          )}

          {totalCost > 0 && (
            <div className="cost-summary">
              <p><strong>Total Cost:</strong> {totalCost.toFixed(4)} MATIC</p>
            </div>
          )}

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