# 🌾🚜 FarmEquip - Decentralized Farming Equipment Rental DApp

A blockchain-based rental platform where farmers can directly book equipment with transparent, tamper-proof scheduling on Polygon testnet.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Frontend Setup](#frontend-setup)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Contributing](#contributing)

---

## 🎯 Project Overview

**Problem Solved:**
- Farmers don't own expensive equipment (tractors, harvesters)
- Availability conflicts with middlemen
- Lack of transparency in booking & pricing

**Solution:**
A decentralized rental platform with:
- Direct farmer-to-farmer equipment booking
- Transparent, tamper-proof scheduling on blockchain
- Secure payments using ERC20 tokens
- No middlemen required

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│            Frontend (React)                 │
│  ┌──────────────────────────────────────┐  │
│  │  Components:                         │  │
│  │  - WalletConnect                     │  │
│  │  - EquipmentList                     │  │
│  │  - BookingModal                      │  │
│  │  - Dashboard                         │  │
│  └──────────────────────────────────────┘  │
└─────────────┬──────────────────────────────┘
              │
              │ ethers.js
              │
┌─────────────▼──────────────────────────────┐
│         Smart Contracts (Solidity)         │
│  ┌──────────────────────────────────────┐  │
│  │  EquipmentRental.sol                 │  │
│  │  TestToken.sol                       │  │
│  └──────────────────────────────────────┘  │
└─────────────┬──────────────────────────────┘
              │
              │ RPC
              │
┌─────────────▼──────────────────────────────┐
│    Polygon Amoy Testnet                    │
│    Chain ID: 80002                         │
└──────────────────────────────────────────────┘
```

---

## ✨ Features

### Core Modules

#### 1. 🔐 Wallet Connection
- MetaMask integration
- Automatic network switching to Polygon Testnet
- Session persistence
- Balance display

#### 2. 🚜 Equipment Management
- Add equipment with name, description, and daily price
- Toggle equipment active/inactive status
- Update pricing
- View all equipment listings

#### 3. 📅 Booking System
- Select equipment and date range
- Real-time availability checking
- Automatic cost calculation
- On-chain booking confirmation

#### 4. 💰 Payment System
- ERC20 token payments (FARM tokens)
- Secure booking confirmation
- Refundable bookings before start date
- Automatic payment to equipment owner on completion

#### 5. 📊 Dashboard
- User bookings view
- Owner equipment management
- Booking status tracking (Active/Completed/Cancelled)
- Rental statistics

---

## 🚀 Installation

### Prerequisites
- Node.js 16+ and npm
- MetaMask browser extension
- Polygon Amoy testnet tokens (get from faucet)

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/farming-dapp.git
cd farming-dapp

# Install root dependencies
npm install

# Install contract dependencies
npm install --save-dev @openzeppelin/hardhat-upgrades @nomicfoundation/hardhat-toolbox hardhat dotenv

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Environment Setup

```bash
# Create .env file in root
cp .env.example .env

# Create .env file in frontend
cp frontend/.env.example frontend/.env

# Edit .env with your values
# PRIVATE_KEY=your_private_key_here
# POLYGON_RPC_URL=https://rpc-amoy.polygon.technology/
```

---

## 🔧 Smart Contract Deployment

### 1. Compile Contracts
```bash
npx hardhat compile
```

### 2. Deploy to Polygon Amoy Testnet
```bash
npx hardhat run scripts/deploy.js --network polygonAmoy
```

### 3. Save Contract Addresses
After deployment, you'll get `deployment-addresses.json`:
```json
{
  "testToken": "0x...",
  "equipmentRental": "0x...",
  "deployer": "0x...",
  "network": "polygonAmoy",
  "timestamp": "2026-04-26T10:00:00.000Z"
}
```

### 4. Update Frontend Configuration
```bash
# In frontend/.env
REACT_APP_TEST_TOKEN_ADDRESS=0x...
REACT_APP_EQUIPMENT_RENTAL_ADDRESS=0x...
```

---

## 💻 Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm start
```

The app will open at `http://localhost:3000`

### 3. Build for Production
```bash
npm run build
```

---

## 📖 Usage Guide

### For Equipment Owners

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Select Polygon Amoy network

2. **Add Equipment**
   - Go to Equipment tab
   - Click "Add Equipment" button
   - Fill in:
     - Equipment Name (e.g., "Tractor JCB 3DX")
     - Description (features, condition, etc.)
     - Price per Day (in MATIC)
   - Confirm transaction

3. **Manage Listings**
   - View all your equipment in Dashboard
   - Toggle equipment active/inactive
   - Update pricing anytime

### For Equipment Renters

1. **Browse Equipment**
   - Go to Equipment page
   - Browse available equipment
   - View price and details

2. **Make a Booking**
   - Click "Book Now" on equipment card
   - Select start and end dates
   - Review total cost
   - Confirm booking (requires token approval)
   - Pay booking fee

3. **Track Bookings**
   - Go to Dashboard
   - View all your bookings
   - Cancel bookings before start date (get refund)

---

## 📚 API Reference

### Smart Contract Functions

#### Equipment Functions

```solidity
// Add equipment for rental
function addEquipment(
  string memory _name,
  string memory _description,
  uint256 _pricePerDay
) external returns (uint256)

// Update equipment price
function updateEquipmentPrice(
  uint256 _equipmentId,
  uint256 _newPrice
) external

// Get all equipment
function getAllEquipment() external view returns (Equipment[] memory)

// Get specific equipment
function getEquipment(uint256 _equipmentId) external view returns (Equipment)
```

#### Booking Functions

```solidity
// Create a booking
function createBooking(
  uint256 _equipmentId,
  uint256 _startDate,
  uint256 _endDate
) external returns (uint256)

// Check availability
function isEquipmentAvailable(
  uint256 _equipmentId,
  uint256 _startDate,
  uint256 _endDate
) public view returns (bool)

// Get user bookings
function getUserBookings(address _user) external view returns (Booking[] memory)

// Complete a booking
function completeBooking(uint256 _bookingId) external

// Cancel a booking
function cancelBooking(uint256 _bookingId) external
```

---

## 🧪 Testing

### Run Smart Contract Tests
```bash
npx hardhat test
```

### Test Coverage
```bash
npx hardhat coverage
```

### Test Scenarios Included
- ✅ Equipment creation
- ✅ Booking creation
- ✅ Availability checking
- ✅ Payment handling
- ✅ Error handling
- ✅ Permission checks

---

## 📁 Project Structure

```
farming-dapp/
├── contracts/
│   ├── EquipmentRental.sol          # Main rental contract
│   └── TestToken.sol                 # ERC20 test token
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── WalletConnect.jsx
│   │   │   ├── EquipmentList.jsx
│   │   │   ├── EquipmentCard.jsx
│   │   │   ├── BookingModal.jsx
│   │   │   ├── AddEquipmentModal.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── context/                 # Web3 context
│   │   │   └── Web3Context.jsx
│   │   ├── hooks/                   # Custom hooks
│   │   │   ├── useWeb3.js
│   │   │   └── useContract.js
│   │   ├── styles/                  # CSS files
│   │   ├── utils/                   # ABIs and utilities
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── public/
│   └── package.json
├── scripts/
│   └── deploy.js                    # Deployment script
├── test/
│   └── EquipmentRental.test.js     # Contract tests
├── docs/                            # Documentation
├── hardhat.config.js                # Hardhat configuration
├── package.json
└── README.md
```

---

## 🔐 Security Features

- ✅ ReentrancyGuard for contract protection
- ✅ Ownership-based access control
- ✅ Date/time validation
- ✅ Token approval verification
- ✅ Booking status tracking
- ✅ Automatic refunds for cancellations

---

## 🌐 Network Details

**Polygon Amoy Testnet**
- Chain ID: 80002
- RPC URL: https://rpc-amoy.polygon.technology/
- Block Explorer: https://www.oklink.com/amoy
- Faucet: https://faucet.polygon.technology/

---

## 💡 Future Enhancements

- [ ] IPFS integration for equipment images
- [ ] NFT-based equipment certificates
- [ ] Dispute resolution system
- [ ] Equipment insurance
- [ ] Rating and review system
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] Multi-chain support

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the no License - see file for details.

---

## 👥 Authors

- **Your Name** - Initial work
- GitHub: https://github.com/vijay2023V

---

## 📞 Support

For support, email support@farmequip.com or open an issue on GitHub.



**Built with ❤️ for farmers worldwide** 🌾
