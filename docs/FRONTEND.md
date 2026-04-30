# Frontend Architecture

## Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   ├── context/             # Global state (Web3Context)
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utilities (ABIs, helpers)
│   ├── styles/              # CSS files
│   ├── App.jsx              # Main app component
│   └── index.jsx            # Entry point
├── public/
│   └── index.html
└── package.json
```

## Core Components

### WalletConnect.jsx
Handles MetaMask wallet connection and account management.

**Features:**
- Connect/disconnect wallet
- Display account and balance
- Network switching
- Account dropdown menu

**Props:** None (uses Web3Context)

**State:**
- `showDropdown`: Toggle dropdown menu

### EquipmentList.jsx
Main page displaying all available equipment with filtering.

**Features:**
- Display all equipment cards
- Filter by status (all, active, my equipment)
- Add new equipment modal
- Real-time refresh

**Props:**
- `contractAddress`: Equipment Rental contract address
- `contractABI`: Contract ABI

**State:**
- `equipment`: All equipment array
- `filteredEquipment`: Filtered results
- `selectedFilter`: Current filter
- `showAddModal`: Toggle add equipment modal

### EquipmentCard.jsx
Individual equipment card component.

**Features:**
- Display equipment info
- Price per day
- Owner address
- Total bookings
- Book button
- Booking modal trigger

**Props:**
- `equipment`: Equipment object
- `contractAddress`: Contract address
- `contractABI`: Contract ABI
- `onBookingSuccess`: Callback function

### BookingModal.jsx
Modal for creating equipment bookings.

**Features:**
- Date range selection
- Cost calculation
- Availability checking
- Booking confirmation
- Error handling

**Props:**
- `equipment`: Equipment to book
- `contractAddress`: Contract address
- `contractABI`: Contract ABI
- `onClose`: Close modal callback
- `onSuccess`: Success callback

### AddEquipmentModal.jsx
Modal for owners to add new equipment.

**Features:**
- Equipment form
- Price input
- Description textarea
- Validation
- Transaction handling

**Props:**
- `contractAddress`: Contract address
- `contractABI`: Contract ABI
- `onClose`: Close callback
- `onSuccess`: Success callback

### Dashboard.jsx
User dashboard showing bookings and equipment.

**Features:**
- User statistics cards
- Bookings tab
- Equipment tab
- Booking status display
- Equipment management

**Props:**
- `contractAddress`: Contract address
- `contractABI`: Contract ABI

## Global State Management

### Web3Context.jsx
Manages Web3/blockchain connection state.

**State:**
```javascript
{
  provider: ethers.BrowserProvider,
  signer: ethers.Signer,
  account: string,
  balance: string (formatted),
  isConnected: boolean,
  chainId: number,
  loading: boolean,
  error: string
}
```

**Functions:**
- `connectWallet()`: Connect MetaMask
- `disconnectWallet()`: Disconnect wallet
- `switchToPolygonTestnet()`: Switch network

**Usage:**
```javascript
import { useWeb3 } from './hooks/useWeb3';

function Component() {
  const { account, isConnected, connectWallet } = useWeb3();
  // ...
}
```

## Custom Hooks

### useWeb3.js
Hook to access Web3Context.

```javascript
const {
  provider,
  signer,
  account,
  balance,
  isConnected,
  chainId,
  loading,
  error,
  connectWallet,
  disconnectWallet,
  switchToPolygonTestnet
} = useWeb3();
```

### useContract.js
Hook for interacting with smart contracts.

```javascript
const { getContract, call, write, loading, error } = useContract(
  contractAddress,
  contractABI
);

// Call read function
const result = await call('functionName', arg1, arg2);

// Call write function
await write('functionName', arg1, arg2);
```

## Styling Architecture

### CSS Organization
Each component has its own CSS file:
- `App.css`: Main app styles
- `WalletConnect.css`: Wallet button styles
- `EquipmentList.css`: Equipment list layout
- `EquipmentCard.css`: Card styles
- `BookingModal.css`: Modal styles
- `Dashboard.css`: Dashboard styles

### Design System

**Color Scheme:**
- Primary: `#667eea` (Purple)
- Secondary: `#764ba2` (Dark Purple)
- Success: `#48bb78` (Green)
- Error: `#f56565` (Red)
- Background: `#f9fafb` (Light Gray)
- Border: `#e2e8f0` (Gray)

**Spacing:**
- Base unit: 0.25rem (4px)
- Common: 1rem, 1.5rem, 2rem

**Typography:**
- Font Family: System fonts
- Heading: 1.3-3rem, bold
- Body: 1rem, regular

## Environment Configuration

### .env Variables
```
REACT_APP_EQUIPMENT_RENTAL_ADDRESS=0x...
REACT_APP_TEST_TOKEN_ADDRESS=0x...
```

## Data Flow

```
User Action
    ↓
Component triggers useContract hook
    ↓
Contract call via ethers.js
    ↓
MetaMask approval (if write operation)
    ↓
Transaction sent to blockchain
    ↓
Transaction confirmed
    ↓
UI updates with new state
```

## Error Handling

### Global Error Display
Errors are caught and displayed in modals/components:
- Contract call errors
- Validation errors
- Network errors
- User rejection errors

### Error Types
```javascript
{
  "Contract call failed": "Function error",
  "User rejected": "User action",
  "Network error": "Connection issue",
  "Invalid input": "Validation"
}
```

## Performance Optimizations

1. **Memoization**: Using React.memo for components
2. **Lazy Loading**: Components load on demand
3. **Efficient Renders**: Minimizing unnecessary re-renders
4. **Optimized Hooks**: Custom hooks prevent prop drilling

## Testing Frontend Components

### Unit Testing Setup
```javascript
import { render, screen } from '@testing-library/react';
import Component from './Component';

test('renders component', () => {
  render(<Component />);
  expect(screen.getByText('text')).toBeInTheDocument();
});
```

## Deployment

### Build Production Bundle
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel deploy
```

### Deploy to GitHub Pages
```bash
npm run build
# Upload build/ to gh-pages branch
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- **react**: ^18.2.0
- **ethers**: ^6.8.0 (Web3 library)
- **axios**: ^1.6.0 (HTTP client)
- **date-fns**: ^2.30.0 (Date utilities)

---

For component-specific details, see individual component files in `src/components/`
