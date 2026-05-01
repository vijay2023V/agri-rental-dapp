const hre = require("hardhat");

async function main() {
  console.log("Deploying smart contracts...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy EquipmentRental with native POL
  console.log("\n1. Deploying EquipmentRental...");
  const EquipmentRental = await hre.ethers.getContractFactory("EquipmentRental");
  const equipmentRental = await EquipmentRental.deploy();
  await equipmentRental.waitForDeployment();
  const equipmentRentalAddress = await equipmentRental.getAddress();
  console.log("EquipmentRental deployed to:", equipmentRentalAddress);

  // Save deployment addresses
  const fs = require("fs");
  const deploymentAddresses = {
    equipmentRental: equipmentRentalAddress,
    deployer: deployer.address,
    network: hre.network.name,
    currency: "Native POL",
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "deployment-addresses.json",
    JSON.stringify(deploymentAddresses, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("\nDeployment Addresses:");
  console.log(JSON.stringify(deploymentAddresses, null, 2));
  console.log("\nUpdate your .env file with the EquipmentRental address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
