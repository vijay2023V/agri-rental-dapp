/* eslint-disable no-undef */
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
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    calculateCost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, equipment.pricePerDay]);

  const getNowDatetime = () => {
    const now = new Date();
    // Add 1 hour buffer to account for blockchain clock being ahead
    now.setHours(now.getHours() + 1);
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

      try {
        // pricePerDay comes as "7.0" string from EquipmentList (already formatted from Wei)
        // So we must parseEther it back to Wei for the contract
        let priceInWei;

        if (typeof equipment.pricePerDay === 'bigint') {
          // Already Wei BigInt — use directly
          priceInWei = equipment.pricePerDay;
        } else if (typeof equipment.pricePerDay === 'string') {
          // Formatted string like "7.0" — convert back to Wei
          priceInWei = ethers.parseEther(equipment.pricePerDay);
        } else {
          // Numeric Wei — convert to BigInt
          priceInWei = BigInt(equipment.pricePerDay.toString());
        }

        const costInWei = priceInWei * BigInt(days);
        setTotalCost(costInWei);
        setValidationError('');
      } catch (err) {
        console.error('Error calculating cost:', err);
        setValidationError('Error calculating booking cost');
        setTotalCost(0);
      }
    }
  };

  // Polygon Amoy uses legacy gas — NOT EIP-1559
  const getGasOverrides = async (provider) => {
    try {
      const gasPrice = await provider.send('eth_gasPrice', []);
      const gasPriceBigInt = BigInt(gasPrice);
      // Add 20% buffer
      const bufferedGasPrice = (gasPriceBigInt * BigInt(120)) / BigInt(100);
      console.log('gasPrice (Gwei):', ethers.formatUnits(bufferedGasPrice, 'gwei'));
      return { gasPrice: bufferedGasPrice };
    } catch (e) {
      console.warn('eth_gasPrice failed, fallback 30 Gwei', e);
      return { gasPrice: ethers.parseUnits('30', 'gwei') };
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

      if (totalCost === 0 || !totalCost) {
        setValidationError('Invalid total cost. Please check your booking dates.');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // ✅ Get REAL blockchain timestamp — not JS Date.now()
      // Polygon Amoy chain clock can be different from your system clock
      setStatusMsg('Checking blockchain time...');
      const latestBlock = await provider.getBlock('latest');
      const chainTimestamp = latestBlock.timestamp;
      const jsTimestamp = Math.floor(Date.now() / 1000);

      console.log('=== Time Debug ===');
      console.log('Chain block.timestamp:', chainTimestamp);
      console.log('JS Date.now():', jsTimestamp);
      console.log('Chain is ahead by (seconds):', chainTimestamp - jsTimestamp);
      console.log('==================');

      // Convert selected dates to Unix timestamps
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      console.log('=== Booking Debug ===');
      console.log('pricePerDay raw:', equipment.pricePerDay, typeof equipment.pricePerDay);
      console.log('totalCost in Wei:', totalCost.toString());
      console.log('totalCost in POL:', ethers.formatEther(totalCost));
      console.log('startTimestamp:', startTimestamp);
      console.log('endTimestamp:', endTimestamp);
      console.log('equipmentId:', equipment.id);
      console.log('=====================');

      // ✅ Validate against CHAIN time, not JS time
      if (startTimestamp <= chainTimestamp) {
        const chainDate = new Date(chainTimestamp * 1000).toLocaleString();
        setValidationError(
          `Start time must be after blockchain time (${chainDate}). Please select a later time.`
        );
        return;
      }

      if (endTimestamp <= startTimestamp) {
        setValidationError('End time must be after start time');
        return;
      }

      const gasOverrides = await getGasOverrides(provider);
      setStatusMsg('Confirm the transaction in MetaMask...');

      const tx = await write(
        'createBooking',
        equipment.id,
        startTimestamp,
        endTimestamp,
        {
          ...gasOverrides,
          value: totalCost,
        }
      );

      if (tx) {
        setStatusMsg('');
        alert('🎉 Booking created successfully!');
        onSuccess();
      }
    } catch (err) {
      setStatusMsg('');
      const errorMsg = err.reason || err.message || 'Booking failed';
      setValidationError(errorMsg);
      console.error('Booking error:', {
        message: errorMsg,
        error: err,
        totalCost: totalCost?.toString(),
        equipment: equipment,
      });
    }
  };

  const getRentalDuration = () => {
    if (!startDate || !endDate) return null;
    const hours = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60));
    const days = Math.ceil(hours / 24);
    return `${hours} hours (${days} day${days > 1 ? 's' : ''})`;
  };

  const formatPrice = () => {
    try {
      if (typeof equipment.pricePerDay === 'string') {
        return parseFloat(equipment.pricePerDay).toFixed(4);
      }
      if (typeof equipment.pricePerDay === 'bigint') {
        return parseFloat(ethers.formatEther(equipment.pricePerDay)).toFixed(4);
      }
      return parseFloat(ethers.formatEther(BigInt(equipment.pricePerDay.toString()))).toFixed(4);
    } catch {
      return '0.0000';
    }
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
            <p><strong>Price:</strong> {formatPrice()} POL/day</p>
            <p>
              <strong>Owner:</strong> {equipment.owner?.slice(0, 8)}...{equipment.owner?.slice(-6)}
            </p>
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
              <p>
                <strong>Total Cost:</strong>{' '}
                {typeof totalCost === 'bigint'
                  ? parseFloat(ethers.formatEther(totalCost)).toFixed(4)
                  : parseFloat(totalCost).toFixed(4)
                } POL
              </p>
            </div>
          )}

          {statusMsg && <div className="status-message">{statusMsg}</div>}
          {validationError && <div className="error-message">{validationError}</div>}
          {error && !validationError && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn-confirm"
            onClick={handleBooking}
            disabled={loading || !startDate || !endDate || totalCost <= 0}
          >
            {loading ? '⏳ Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
