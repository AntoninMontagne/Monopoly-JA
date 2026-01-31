const hre = require("hardhat");
const properties = require("../metadata/properties/properties.json").properties;

const GAME_MANAGER = "0x433B688AE86339f364f623696e148cFaE64dfd0B";
const IPFS_BASE = "ipfs://bafybeicuhnu5e3evh6acwzizymp675sfato5mmkoe7d6kq2pkkapem4dji/";

const propertyTypes = {
  "STREET_BROWN": 0,
  "STREET_LIGHTBLUE": 1,
  "STREET_PINK": 2,
  "STREET_ORANGE": 3,
  "STREET_RED": 4,
  "STREET_YELLOW": 5,
  "STREET_GREEN": 6,
  "STREET_DARKBLUE": 7,
  "STATION": 8,
  "UTILITY": 9
};

async function main() {
  console.log("Mint des proprietes...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Owner:", deployer.address);

  const gameManager = await hre.ethers.getContractAt("GameManager", GAME_MANAGER);

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const uri = `${IPFS_BASE}${prop.id}.json`;
    const propType = propertyTypes[prop.type];

    console.log(`Mint #${prop.id}: ${prop.name}...`);
    
    try {
      const tx = await gameManager.mintProperty(
        deployer.address,
        prop.name,
        propType,
        prop.value,
        prop.rent,
        uri
      );
      await tx.wait(1);
      console.log(`   OK`);
    } catch (error) {
      console.log(`   ERREUR: ${error.message}`);
    }
  }

  console.log("\nMint termine !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });