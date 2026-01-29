const hre = require("hardhat");

const PROPERTY_NFT = "0x2a3CcDEf8994Ec2Fe27625dedAE15095525e893c";
const GAME_MANAGER = "0x433B688AE86339f364f623696e148cFaE64dfd0B";

async function main() {
  console.log("Approbation des NFTs pour le GameManager...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Owner:", deployer.address);

  const propertyNFT = await hre.ethers.getContractAt("PropertyNFT", PROPERTY_NFT);

  // Approuver le GameManager pour tous les NFTs
  console.log("Approbation en cours...");
  const tx = await propertyNFT.setApprovalForAll(GAME_MANAGER, true);
  await tx.wait(1);
  
  console.log("OK ! Le GameManager peut maintenant transferer les NFTs.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });