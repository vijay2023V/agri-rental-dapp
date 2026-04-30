import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContract } from '../hooks/useContract';
import { useWeb3 } from '../hooks/useWeb3';
import '../styles/Dashboard.css';

const Dashboard = ({ contractAddress, contractABI }) => {
  const { account, isConnected } = useWeb3();
  const { call, write, loading } = useContract(contractAddress, contractABI);
  const [userBookings, setUserBookings] = useState([]);
  const [ownerEquipment, setOwnerEquipment] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalEquipment: 0,
    activeBookings: 0,
  });
  const [activeTab, setActiveTab] = useState('bookings');
  const [completingId, setCompletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isConnected && account) {
      fetchDashboardData();
    }
  }, [isConnected, account]);

  const fetchDashboardData = async () => {
    try {
      const bookings = await call('getUserBookings', account);
      const formattedBookings = bookings.map((booking) => ({
        id: Number(booking.id),
        equipmentId: Number(booking.equipmentId),
        farmer: booking.farmer,
        startDate: new Date(Number(booking.startDate) * 1000),
        endDate: new Date(Number(booking.endDate) * 1000),
        totalCost: ethers.formatEther(booking.totalCost),
        status: ['Active', 'Completed', 'Cancelled'][booking.status],
        createdAt: new Date(Number(booking.createdAt) * 1000),
      }));
      setUserBookings(formattedBookings);

      const equipment = await call('getOwnerEquipment', account);
      const formattedEquipment = equipment.map((eq) => ({
        id: Number(eq.id),
        name: eq.name,
        pricePerDay: ethers.formatEther(eq.pricePerDay),
        isActive: eq.isActive,
        totalBookings: Number(eq.totalBookings),
      }));
      setOwnerEquipment(formattedEquipment);

      setStats({
        totalBookings: formattedBookings.length,
        totalEquipment: formattedEquipment.length,
        activeBookings: formattedBookings.filter((b) => b.status === 'Active').length,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  // ✅ Complete booking handler
  const handleCompleteBooking = async (bookingId, endDate) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');

      // Check if rental period has ended
      const now = new Date();
      if (now < endDate) {
        setErrorMsg(`Cannot complete yet. Rental ends on ${formatDate(endDate)}`);
        return;
      }

      setCompletingId(bookingId);
      const tx = await write('completeBooking', bookingId);

      if (tx) {
        setSuccessMsg(`✅ Booking #${bookingId} completed! Payment released to equipment owner.`);
        await fetchDashboardData(); // refresh
      }
    } catch (err) {
      setErrorMsg(err.reason || err.message || 'Failed to complete booking');
      console.error('Complete booking error:', err);
    } finally {
      setCompletingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Completed': return 'status-completed';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // ✅ Check if booking can be completed
  const canComplete = (booking) => {
    return booking.status === 'Active' && new Date() >= booking.endDate;
  };

  // ✅ Check if booking end date has passed
  const isPastEndDate = (booking) => {
    return new Date() >= booking.endDate;
  };

  if (!isConnected) {
    return (
      <div className="dashboard">
        <div className="message-container">
          <p>Please connect your wallet to view dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Dashboard</h2>
        <p className="account-info">Account: {account?.slice(0, 8)}...{account?.slice(-6)}</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.totalBookings}</span>
          <span className="stat-label">Total Bookings</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.activeBookings}</span>
          <span className="stat-label">Active Bookings</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalEquipment}</span>
          <span className="stat-label">My Equipment</span>
        </div>
      </div>

      {/* ✅ Success & Error messages */}
      {successMsg && (
        <div className="success-message">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="error-message">{errorMsg}</div>
      )}

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📅 My Bookings
        </button>
        <button
          className={`tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          🚜 My Equipment
        </button>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {activeTab === 'bookings' && (
        <div className="tab-content">
          <h3>My Bookings</h3>
          {userBookings.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Equipment ID</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Cost (MATIC)</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {userBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>#{booking.equipmentId}</td>
                      <td>{formatDate(booking.startDate)}</td>
                      <td>{formatDate(booking.endDate)}</td>
                      <td>{parseFloat(booking.totalCost).toFixed(4)}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      {/* ✅ Complete Booking Button */}
                      <td>
                        {booking.status === 'Active' && (
                          canComplete(booking) ? (
                            <button
                              className="btn-complete"
                              onClick={() => handleCompleteBooking(booking.id, booking.endDate)}
                              disabled={completingId === booking.id}
                            >
                              {completingId === booking.id ? '⏳ Processing...' : '✅ Complete'}
                            </button>
                          ) : (
                            <span className="pending-label">
                              ⏳ Ends {booking.endDate.toLocaleDateString()}
                            </span>
                          )
                        )}
                        {booking.status === 'Completed' && (
                          <span className="done-label">💰 Paid</span>
                        )}
                        {booking.status === 'Cancelled' && (
                          <span className="cancelled-label">❌ Cancelled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No bookings yet</p>
          )}
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="tab-content">
          <h3>My Equipment</h3>
          {ownerEquipment.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price/Day (MATIC)</th>
                    <th>Total Bookings</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ownerEquipment.map((equipment) => (
                    <tr key={equipment.id}>
                      <td>{equipment.name}</td>
                      <td>{parseFloat(equipment.pricePerDay).toFixed(4)}</td>
                      <td>{equipment.totalBookings}</td>
                      <td>
                        <span className={`status-badge ${equipment.isActive ? 'status-active' : 'status-inactive'}`}>
                          {equipment.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No equipment listed yet</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;