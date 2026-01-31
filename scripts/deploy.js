const hre = require("hardhat");

async function main() {
  console.log("Deploiement sur", hre.network.name);
  console.log("=====================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // 1. Deployer MonopolyToken
  console.log("1. Deploiement MonopolyToken...");
  const MonopolyToken = await hre.ethers.getContractFactory("MonopolyToken");
  const token = await MonopolyToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("   MonopolyToken:", tokenAddress);

  // 2. Deployer PropertyNFT
  console.log("2. Deploiement PropertyNFT...");
  const PropertyNFT = await hre.ethers.getContractFactory("PropertyNFT");
  const nft = await PropertyNFT.deploy(deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("   PropertyNFT:", nftAddress);

  // 3. Deployer GameManager
  console.log("3. Deploiement GameManager...");
  const GameManager = await hre.ethers.getContractFactory("GameManager");
  const game = await GameManager.deploy(tokenAddress, nftAddress);
  await game.waitForDeployment();
  const gameAddress = await game.getAddress();
  console.log("   GameManager:", gameAddress);

  // 4. Configurer les permissions
  console.log("\n4. Configuration des permissions...");
  
  console.log("   - MonopolyToken.setGameManager()");
  const tx1 = await token.setGameManager(gameAddress);
  await tx1.wait();
  
  console.log("   - PropertyNFT.setGameManager()");
  const tx2 = await nft.setGameManager(gameAddress);
  await tx2.wait();

  console.log("\n=====================================");
  console.log("DEPLOIEMENT TERMINE !");
  console.log("=====================================\n");
  
  console.log("Adresses des contrats:");
  console.log("  MonopolyToken:", tokenAddress);
  console.log("  PropertyNFT:  ", nftAddress);
  console.log("  GameManager:  ", gameAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });