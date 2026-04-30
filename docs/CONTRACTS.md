# Smart Contract Documentation

## EquipmentRental Contract

### Overview
The main contract managing all farming equipment rentals and bookings on the Polygon blockchain.

### State Variables

#### Key Mappings
```solidity
mapping(uint256 => Equipment) equipmentById
mapping(uint256 => Booking) bookingById
mapping(uint256 => TimeSlot[]) equipmentTimeSlots
mapping(address => uint256[]) userBookings
mapping(address => uint256[]) ownerEquipment
```

### Data Structures

#### Equipment
```solidity
struct Equipment {
    uint256 id;
    string name;
    string description;
    address owner;
    uint256 pricePerDay;
    bool isActive;
    uint256 totalBookings;
}
```

#### Booking
```solidity
struct Booking {
    uint256 id;
    uint256 equipmentId;
    address farmer;
    uint256 startDate;      // timestamp
    uint256 endDate;        // timestamp
    uint256 totalCost;      // in wei
    uint8 status;           // 0: Active, 1: Completed, 2: Cancelled
    uint256 createdAt;
}
```

#### TimeSlot
```solidity
struct TimeSlot {
    uint256 startDate;
    uint256 endDate;
    bool isBooked;
    address bookedBy;
}
```

### Events

#### Equipment Events
```solidity
event EquipmentAdded(
    uint256 indexed equipmentId,
    string name,
    address indexed owner,
    uint256 pricePerDay
)

event EquipmentUpdated(uint256 indexed equipmentId, uint256 newPrice)
```

#### Booking Events
```solidity
event BookingCreated(
    uint256 indexed bookingId,
    uint256 indexed equipmentId,
    address indexed farmer,
    uint256 startDate,
    uint256 endDate,
    uint256 totalCost
)

event BookingCancelled(uint256 indexed bookingId)
event BookingCompleted(uint256 indexed bookingId)
```

### Functions

#### Equipment Management

##### addEquipment
```solidity
function addEquipment(
    string memory _name,
    string memory _description,
    uint256 _pricePerDay
) external returns (uint256)
```
- Adds new equipment to the platform
- Returns: equipment ID
- Requirements: price > 0, name not empty
- Emits: EquipmentAdded

##### updateEquipmentPrice
```solidity
function updateEquipmentPrice(
    uint256 _equipmentId,
    uint256 _newPrice
) external
```
- Only callable by equipment owner
- Updates daily rental price
- Emits: EquipmentUpdated

##### toggleEquipmentStatus
```solidity
function toggleEquipmentStatus(uint256 _equipmentId) external
```
- Toggle between active/inactive
- Only owner can call
- Inactive equipment can't be booked

##### getAllEquipment
```solidity
function getAllEquipment() external view returns (Equipment[] memory)
```
- Returns all equipment in the system

##### getEquipment
```solidity
function getEquipment(uint256 _equipmentId) 
    external view returns (Equipment)
```
- Get details of specific equipment

#### Booking Management

##### isEquipmentAvailable
```solidity
function isEquipmentAvailable(
    uint256 _equipmentId,
    uint256 _startDate,
    uint256 _endDate
) public view returns (bool)
```
- Check if equipment is available for date range
- Validates no overlaps with existing bookings
- Requirements: endDate > startDate, startDate >= now

##### createBooking
```solidity
function createBooking(
    uint256 _equipmentId,
    uint256 _startDate,
    uint256 _endDate
) external nonReentrant returns (uint256)
```
- Creates a new booking
- Transfers payment token to contract
- Creates time slot entry
- Returns: booking ID
- Emits: BookingCreated
- Requirements:
  - Equipment must be active
  - Must be available for dates
  - Valid date range
  - Sufficient token balance & approval

##### completeBooking
```solidity
function completeBooking(uint256 _bookingId) external
```
- Mark booking as completed
- Transfer payment to equipment owner
- Requirements:
  - Booking must be active
  - Current time must be >= endDate

##### cancelBooking
```solidity
function cancelBooking(uint256 _bookingId) external nonReentrant
```
- Cancel an active booking
- Full refund to farmer
- Mark time slot as available
- Requirements:
  - Booking must be active
  - Current time must be < startDate

#### Query Functions

##### getUserBookings
```solidity
function getUserBookings(address _user) 
    external view returns (Booking[] memory)
```
- Get all bookings for a user

##### getOwnerEquipment
```solidity
function getOwnerEquipment(address _owner) 
    external view returns (Equipment[] memory)
```
- Get all equipment owned by address

##### getBooking
```solidity
function getBooking(uint256 _bookingId) 
    external view returns (Booking)
```
- Get booking details

##### getEquipmentTimeSlots
```solidity
function getEquipmentTimeSlots(uint256 _equipmentId) 
    external view returns (TimeSlot[] memory)
```
- Get all time slots for equipment

---

## TestToken Contract

### Functions

#### Minting

##### mint
```solidity
function mint(address to, uint256 amount) public onlyOwner
```
- Admin only
- Create new tokens

##### faucet
```solidity
function faucet(uint256 amount) public
```
- Anyone can call
- Max 1000 tokens per call
- For testing purposes

#### Standard ERC20

```solidity
transfer(address to, uint256 amount)
transferFrom(address from, address to, uint256 amount)
approve(address spender, uint256 amount)
balanceOf(address account)
```

---

## Error Handling

### Custom Errors
- "Price must be greater than 0"
- "Name cannot be empty"
- "Equipment does not exist"
- "Not equipment owner"
- "Not authorized"
- "Equipment is not active"
- "Equipment not available"
- "Invalid date range"
- "Booking is not active"
- "Cannot cancel ongoing/past bookings"
- "Refund transfer failed"
- "Payment transfer failed"

---

## Security Considerations

1. **ReentrancyGuard**: Prevents reentrancy attacks
2. **Access Control**: Owner-based permission checks
3. **Time Validation**: Booking dates are validated
4. **Token Safety**: Uses OpenZeppelin's IERC20 standard
5. **Immutable Data**: Booking history is preserved

---

## Gas Optimization

- Uses mappings for O(1) lookups
- Avoids unnecessary storage writes
- Efficient loop operations for arrays
- Proper use of view functions

---

## Deployment Notes

1. Deploy TestToken first
2. Pass TestToken address to EquipmentRental constructor
3. Ensure sufficient gas for deployment (~3M gas)
4. Verify on block explorer for transparency

---

For implementation details, see contract code at:
`contracts/EquipmentRental.sol`
`contracts/TestToken.sol`
