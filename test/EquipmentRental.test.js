const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EquipmentRental", function () {
  let equipmentRental, testToken;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy TestToken
    const TestToken = await ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy();
    await testToken.waitForDeployment();

    // Deploy EquipmentRental
    const EquipmentRental = await ethers.getContractFactory("EquipmentRental");
    equipmentRental = await EquipmentRental.deploy(await testToken.getAddress());
    await equipmentRental.waitForDeployment();

    // Mint tokens to addr1
    await testToken.mint(addr1.address, ethers.parseEther("1000"));
    await testToken.mint(addr2.address, ethers.parseEther("1000"));
  });

  describe("Equipment Functions", function () {
    it("Should add equipment", async function () {
      const tx = await equipmentRental.addEquipment(
        "Tractor JCB",
        "Heavy duty tractor",
        ethers.parseEther("0.1")
      );
      const receipt = await tx.wait();
      
      const equipment = await equipmentRental.getEquipment(1);
      expect(equipment.name).to.equal("Tractor JCB");
      expect(equipment.pricePerDay).to.equal(ethers.parseEther("0.1"));
    });

    it("Should get all equipment", async function () {
      await equipmentRental.addEquipment("Tractor", "Desc1", ethers.parseEther("0.1"));
      await equipmentRental.addEquipment("Seeder", "Desc2", ethers.parseEther("0.05"));

      const allEquipment = await equipmentRental.getAllEquipment();
      expect(allEquipment.length).to.equal(2);
    });

    it("Should toggle equipment status", async function () {
      await equipmentRental.addEquipment("Tractor", "Desc", ethers.parseEther("0.1"));
      
      let equipment = await equipmentRental.getEquipment(1);
      expect(equipment.isActive).to.be.true;

      await equipmentRental.toggleEquipmentStatus(1);
      equipment = await equipmentRental.getEquipment(1);
      expect(equipment.isActive).to.be.false;
    });
  });

  describe("Booking Functions", function () {
    beforeEach(async function () {
      // Add equipment
      await equipmentRental.addEquipment(
        "Tractor",
        "Description",
        ethers.parseEther("0.1")
      );

      // Approve tokens
      await testToken.connect(addr1).approve(
        await equipmentRental.getAddress(),
        ethers.parseEther("1000")
      );
    });

    it("Should create booking", async function () {
      const now = Math.floor(Date.now() / 1000);
      const startDate = now + 86400; // tomorrow
      const endDate = startDate + 86400 * 3; // 3 days later

      const tx = await equipmentRental.connect(addr1).createBooking(
        1,
        startDate,
        endDate
      );
      const receipt = await tx.wait();

      const booking = await equipmentRental.getBooking(1);
      expect(booking.equipmentId).to.equal(1);
      expect(booking.farmer).to.equal(addr1.address);
      expect(booking.status).to.equal(0); // Active
    });

    it("Should check availability", async function () {
      const now = Math.floor(Date.now() / 1000);
      const startDate = now + 86400;
      const endDate = startDate + 86400 * 3;

      const isAvailable = await equipmentRental.isEquipmentAvailable(
        1,
        startDate,
        endDate
      );
      expect(isAvailable).to.be.true;
    });
  });

  describe("Error Handling", function () {
    it("Should revert if price is 0", async function () {
      await expect(
        equipmentRental.addEquipment("Tractor", "Desc", 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should revert if equipment does not exist", async function () {
      await expect(
        equipmentRental.getEquipment(999)
      ).to.be.revertedWith("Equipment does not exist");
    });
  });
});
