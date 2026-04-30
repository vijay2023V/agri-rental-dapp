const hre = require("hardhat");

async function main() {
  console.log("Deploying smart contracts...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy TestToken first
  console.log("\n1. Deploying TestToken...");
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy();
  await testToken.waitForDeployment();
  const testTokenAddress = await testToken.getAddress();
  console.log("TestToken deployed to:", testTokenAddress);

  // Deploy EquipmentRental
  console.log("\n2. Deploying EquipmentRental...");
  const EquipmentRental = await hre.ethers.getContractFactory("EquipmentRental");
  const equipmentRental = await EquipmentRental.deploy(testTokenAddress);
  await equipmentRental.waitForDeployment();
  const equipmentRentalAddress = await equipmentRental.getAddress();
  console.log("EquipmentRental deployed to:", equipmentRentalAddress);

  // Save deployment addresses
  const fs = require("fs");
  const deploymentAddresses = {
    testToken: testTokenAddress,
    equipmentRental: equipmentRentalAddress,
    deployer: deployer.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "deployment-addresses.json",
    JSON.stringify(deploymentAddresses, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("\nDeployment Addresses:");
  console.log(JSON.stringify(deploymentAddresses, null, 2));
  console.log("\nUpdate your .env file with these addresses!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
