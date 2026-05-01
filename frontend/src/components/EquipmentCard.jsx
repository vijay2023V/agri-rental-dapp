import React, { useState } from 'react';
import { ethers } from 'ethers';
import BookingModal from './BookingModal';
import '../styles/EquipmentCard.css';

const EquipmentCard = ({ equipment, contractAddress, contractABI, onBookingSuccess }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Safely convert price from Wei to POL for display
  const displayPrice = () => {
    try {
      // If it's already a string like "7.0", it's already formatted
      if (typeof equipment.pricePerDay === 'string') {
        const num = parseFloat(equipment.pricePerDay);
        return isNaN(num) ? '0.0000' : num.toFixed(4);
      }
      // If it's a BigInt or number in Wei, convert it
      return parseFloat(ethers.formatEther(equipment.pricePerDay)).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  return (
    <>
      <div className="equipment-card">
        <div className="card-header">
          <h3>{equipment.name}</h3>
          {equipment.isActive ? (
            <span className="badge-active">Active</span>
          ) : (
            <span className="badge-inactive">Inactive</span>
          )}
        </div>

        <div className="card-content">
          <p className="description">{equipment.description}</p>
          <div className="card-details">
            <div className="detail-item">
              <span className="label">Price:</span>
              <span className="value">{displayPrice()} POL/day</span>
            </div>
            <div className="detail-item">
              <span className="label">Owner:</span>
              <span className="value">{equipment.owner.slice(0, 8)}...{equipment.owner.slice(-6)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Total Bookings:</span>
              <span className="value">{equipment.totalBookings}</span>
            </div>
          </div>
        </div>

        <div className="card-footer">
          {equipment.isActive && (
            <button
              className="btn-book"
              onClick={() => setShowBookingModal(true)}
            >
              📅 Book Now
            </button>
          )}
        </div>
      </div>

      {/* ✅ Modal is NOW outside the card div */}
      {showBookingModal && (
        <BookingModal
          equipment={equipment}
          contractAddress={contractAddress}
          contractABI={contractABI}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            onBookingSuccess?.();
          }}
        />
      )}
    </>
  );
};

export default EquipmentCard;
