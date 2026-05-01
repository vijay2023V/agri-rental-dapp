// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EquipmentRental
 * @dev Decentralized farming equipment rental platform on Polygon testnet
 */
contract EquipmentRental is Ownable, ReentrancyGuard {
    
    // ==================== STATE VARIABLES ====================
    
    uint256 public equipmentCount = 0;
    uint256 public bookingCount = 0;
    
    // ==================== STRUCTURES ====================
    
    struct Equipment {
        uint256 id;
        string name;
        string description;
        address owner;
        uint256 pricePerDay;
        bool isActive;
        uint256 totalBookings;
    }
    
    struct TimeSlot {
        uint256 startDate;
        uint256 endDate;
        bool isBooked;
        address bookedBy;
    }
    
    struct Booking {
        uint256 id;
        uint256 equipmentId;
        address farmer;
        uint256 startDate;
        uint256 endDate;
        uint256 totalCost;
        uint8 status; // 0: Active, 1: Completed, 2: Cancelled
        uint256 createdAt;
    }
    
    // ==================== MAPPINGS ====================
    
    mapping(uint256 => Equipment) public equipmentById;
    mapping(uint256 => Booking) public bookingById;
    mapping(uint256 => TimeSlot[]) public equipmentTimeSlots;
    mapping(address => uint256[]) public userBookings;
    mapping(address => uint256[]) public ownerEquipment;
    
    // ==================== EVENTS ====================
    
    event EquipmentAdded(
        uint256 indexed equipmentId,
        string name,
        address indexed owner,
        uint256 pricePerDay
    );
    
    event EquipmentUpdated(uint256 indexed equipmentId, uint256 newPrice);
    
    event BookingCreated(
        uint256 indexed bookingId,
        uint256 indexed equipmentId,
        address indexed farmer,
        uint256 startDate,
        uint256 endDate,
        uint256 totalCost
    );
    
    event BookingCancelled(uint256 indexed bookingId);
    
    event BookingCompleted(uint256 indexed bookingId);
    
    event PaymentReceived(address indexed from, uint256 amount);
    
    // ==================== MODIFIERS ====================
    
    modifier equipmentExists(uint256 _equipmentId) {
        require(_equipmentId > 0 && _equipmentId <= equipmentCount, "Equipment does not exist");
        _;
    }
    
    modifier onlyEquipmentOwner(uint256 _equipmentId) {
        require(msg.sender == equipmentById[_equipmentId].owner, "Not equipment owner");
        _;
    }
    
    modifier onlyBookingParty(uint256 _bookingId) {
        require(
            msg.sender == bookingById[_bookingId].farmer || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {}
    
    // ==================== EQUIPMENT FUNCTIONS ====================
    
    /**
     * @dev Add a new equipment for rental
     * @param _pricePerDay Price in Wei (1 POL = 10^18 Wei)
     */
    function addEquipment(
        string memory _name,
        string memory _description,
        uint256 _pricePerDay
    ) external returns (uint256) {
        require(_pricePerDay > 0, "Price must be greater than 0");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        equipmentCount++;
        uint256 equipmentId = equipmentCount;
        
        equipmentById[equipmentId] = Equipment({
            id: equipmentId,
            name: _name,
            description: _description,
            owner: msg.sender,
            pricePerDay: _pricePerDay,
            isActive: true,
            totalBookings: 0
        });
        
        ownerEquipment[msg.sender].push(equipmentId);
        
        emit EquipmentAdded(equipmentId, _name, msg.sender, _pricePerDay);
        return equipmentId;
    }
    
    /**
     * @dev Update equipment price
     */
    function updateEquipmentPrice(uint256 _equipmentId, uint256 _newPrice)
        external
        equipmentExists(_equipmentId)
        onlyEquipmentOwner(_equipmentId)
    {
        require(_newPrice > 0, "Price must be greater than 0");
        equipmentById[_equipmentId].pricePerDay = _newPrice;
        emit EquipmentUpdated(_equipmentId, _newPrice);
    }
    
    /**
     * @dev Toggle equipment active status
     */
    function toggleEquipmentStatus(uint256 _equipmentId)
        external
        equipmentExists(_equipmentId)
        onlyEquipmentOwner(_equipmentId)
    {
        equipmentById[_equipmentId].isActive = !equipmentById[_equipmentId].isActive;
    }
    
    /**
     * @dev Get all equipment
     */
    function getAllEquipment() external view returns (Equipment[] memory) {
        Equipment[] memory allEquipment = new Equipment[](equipmentCount);
        for (uint256 i = 1; i <= equipmentCount; i++) {
            allEquipment[i - 1] = equipmentById[i];
        }
        return allEquipment;
    }
    
    /**
     * @dev Get equipment by ID
     */
    function getEquipment(uint256 _equipmentId)
        external
        view
        equipmentExists(_equipmentId)
        returns (Equipment memory)
    {
        return equipmentById[_equipmentId];
    }
    
    // ==================== BOOKING FUNCTIONS ====================
    
    /**
     * @dev Check if equipment is available for date range
     */
    function isEquipmentAvailable(
        uint256 _equipmentId,
        uint256 _startDate,
        uint256 _endDate
    ) public view equipmentExists(_equipmentId) returns (bool) {
        require(_endDate > _startDate, "End date must be after start date");
        require(_startDate >= block.timestamp, "Start date must be in future");
        
        TimeSlot[] storage slots = equipmentTimeSlots[_equipmentId];
        
        for (uint256 i = 0; i < slots.length; i++) {
            if (slots[i].isBooked) {
                if (!(_endDate <= slots[i].startDate || _startDate >= slots[i].endDate)) {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * @dev Create a booking
     * @dev Uses ceiling division to match frontend Math.ceil(hours / 24)
     *      so sub-24h bookings correctly count as 1 day instead of reverting.
     * @dev pricePerDay is in Wei (1 POL = 10^18 Wei)
     */
    function createBooking(
        uint256 _equipmentId,
        uint256 _startDate,
        uint256 _endDate
    ) external payable nonReentrant equipmentExists(_equipmentId) returns (uint256) {
        Equipment storage equipment = equipmentById[_equipmentId];
        require(equipment.isActive, "Equipment is not active");
        require(isEquipmentAvailable(_equipmentId, _startDate, _endDate), "Equipment not available");

        // ✅ FIX: ceiling division — matches frontend Math.ceil(hours / 24)
        // e.g. 4h duration → (4h + 24h - 1) / 24h = 1 day (not 0)
        uint256 duration = _endDate - _startDate;
        require(duration > 0, "Invalid date range");
        uint256 daysCount = (duration + 1 days - 1) / 1 days;

        // Calculate total cost (pricePerDay is already in Wei)
        uint256 totalCost = equipment.pricePerDay * daysCount;
        
        // Validate received POL matches total cost
        require(msg.value == totalCost, "Insufficient POL sent");
        
        // Transfer payment immediately to equipment owner
        (bool success, ) = equipment.owner.call{value: totalCost}("");
        require(success, "Payment transfer failed");
        
        bookingCount++;
        uint256 bookingId = bookingCount;
        
        bookingById[bookingId] = Booking({
            id: bookingId,
            equipmentId: _equipmentId,
            farmer: msg.sender,
            startDate: _startDate,
            endDate: _endDate,
            totalCost: totalCost,
            status: 0,
            createdAt: block.timestamp
        });
        
        equipmentTimeSlots[_equipmentId].push(TimeSlot({
            startDate: _startDate,
            endDate: _endDate,
            isBooked: true,
            bookedBy: msg.sender
        }));
        
        equipment.totalBookings++;
        userBookings[msg.sender].push(bookingId);
        
        emit BookingCreated(bookingId, _equipmentId, msg.sender, _startDate, _endDate, totalCost);
        return bookingId;
    }
    
    /**
     * @dev Complete a booking
     */
    function completeBooking(uint256 _bookingId) external onlyBookingParty(_bookingId) {
        Booking storage booking = bookingById[_bookingId];
        require(booking.status == 0, "Booking is not active");
        require(block.timestamp >= booking.endDate, "Rental period not ended yet");
        
        booking.status = 1;
        
        emit BookingCompleted(_bookingId);
    }
    
    /**
     * @dev Cancel a booking - refund from equipment owner
     */
    function cancelBooking(uint256 _bookingId) external nonReentrant onlyBookingParty(_bookingId) {
        Booking storage booking = bookingById[_bookingId];
        require(booking.status == 0, "Booking is not active");
        require(block.timestamp < booking.startDate, "Cannot cancel ongoing/past bookings");
        
        booking.status = 2;
        
        // Refund from equipment owner to farmer
        Equipment storage equipment = equipmentById[booking.equipmentId];
        (bool success, ) = booking.farmer.call{value: booking.totalCost}("");
        require(success, "Refund transfer failed");
        
        TimeSlot[] storage slots = equipmentTimeSlots[booking.equipmentId];
        for (uint256 i = 0; i < slots.length; i++) {
            if (
                slots[i].bookedBy == msg.sender &&
                slots[i].startDate == booking.startDate &&
                slots[i].endDate == booking.endDate
            ) {
                slots[i].isBooked = false;
                break;
            }
        }
        
        emit BookingCancelled(_bookingId);
    }
    
    /**
     * @dev Get user bookings
     */
    function getUserBookings(address _user) external view returns (Booking[] memory) {
        uint256[] storage bookingIds = userBookings[_user];
        Booking[] memory userBookingsList = new Booking[](bookingIds.length);
        for (uint256 i = 0; i < bookingIds.length; i++) {
            userBookingsList[i] = bookingById[bookingIds[i]];
        }
        return userBookingsList;
    }
    
    /**
     * @dev Get owner's equipment
     */
    function getOwnerEquipment(address _owner) external view returns (Equipment[] memory) {
        uint256[] storage equipmentIds = ownerEquipment[_owner];
        Equipment[] memory ownerEquipmentList = new Equipment[](equipmentIds.length);
        for (uint256 i = 0; i < equipmentIds.length; i++) {
            ownerEquipmentList[i] = equipmentById[equipmentIds[i]];
        }
        return ownerEquipmentList;
    }
    
    /**
     * @dev Get booking details
     */
    function getBooking(uint256 _bookingId) external view returns (Booking memory) {
        return bookingById[_bookingId];
    }
    
    /**
     * @dev Get equipment time slots
     */
    function getEquipmentTimeSlots(uint256 _equipmentId)
        external
        view
        equipmentExists(_equipmentId)
        returns (TimeSlot[] memory)
    {
        return equipmentTimeSlots[_equipmentId];
    }
    
    /**
     * @dev Allow contract to receive POL
     */
    receive() external payable {}
}