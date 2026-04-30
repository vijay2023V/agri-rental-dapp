# Quick Start Guide

## 🚀 Getting Started (5 minutes)

### Step 1: Setup & Installation
```bash
git clone your-repo
cd farming-dapp
npm install

# Setup environment
cp .env.example .env
# Edit .env with your private key and RPC URL

cd frontend
npm install
cd ..
```

### Step 2: Deploy Smart Contracts
```bash
# Compile contracts
npx hardhat compile

# Deploy to Polygon Amoy testnet
npx hardhat run scripts/deploy.js --network polygonAmoy

# Copy contract addresses from deployment-addresses.json
```

### Step 3: Configure Frontend
```bash
cd frontend

# Copy deployment addresses
cp .env.example .env

# Edit frontend/.env
REACT_APP_EQUIPMENT_RENTAL_ADDRESS=0x...
REACT_APP_TEST_TOKEN_ADDRESS=0x...
```

### Step 4: Run Frontend
```bash
npm start
# Opens at http://localhost:3000
```

---

## 📝 User Workflow

### For Equipment Owners:
1. Connect MetaMask wallet
2. Click "Add Equipment" on Equipment tab
3. Fill in equipment details and price
4. Approve transaction
5. Equipment is now available for rental

### For Equipment Renters:
1. Connect MetaMask wallet
2. Browse Equipment page
3. Click "Book Now" on desired equipment
4. Select dates and confirm booking
5. Approve token payment
6. Booking confirmed on blockchain

---

## 🧪 Testing Smart Contracts

```bash
# Run tests
npx hardhat test

# Run with gas report
REPORT_GAS=true npx hardhat test

# Run specific test
npx hardhat test test/EquipmentRental.test.js
```

---

## 🔍 Debugging

### Frontend Issues
- Check browser console for errors
- Verify contract addresses in frontend/.env
- Ensure MetaMask is connected to Polygon Amoy

### Contract Issues
- Verify compilation: `npx hardhat compile`
- Check deployment: `cat deployment-addresses.json`
- View events: Use Polygon scan explorer

---

## 📚 Important Addresses

After deployment, save these:
- **TestToken**: 0x...
- **EquipmentRental**: 0x...
- **Your Address**: 0x...

Add to `frontend/.env` for the app to work.

---

## ⚠️ Common Issues & Solutions

### Issue: "Contract not initialized"
**Solution**: Ensure contract addresses are in `frontend/.env`

### Issue: "User rejected the transaction"
**Solution**: Approve the token spending in MetaMask

### Issue: "Equipment not available"
**Solution**: Check availability dates - must be in future and not overlap

### Issue: "Gas estimation failed"
**Solution**: Ensure you have enough MATIC tokens on testnet

---

## 🔗 Useful Links

- Polygon Amoy Faucet: https://faucet.polygon.technology/
- PolygonScan: https://www.oklink.com/amoy
- MetaMask: https://metamask.io/

---

**Ready to test? Start by connecting your wallet!** 🚀
