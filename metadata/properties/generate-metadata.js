const fs = require('fs');
const path = require('path');

const properties = require('./properties.json').properties;

const outputDir = path.join(__dirname, 'nft-metadata');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

properties.forEach((prop) => {
  const metadata = {
    name: prop.name,
    description: `Propriete Monopoly: ${prop.name}. Type: ${prop.type}`,
    image: `ipfs://bafybeicp4qrz7a5l5hyvoujka5eijau2qtas4rmglwuwthzpzbjmun5krm/${prop.image}`,
    attributes: [
      { trait_type: "Type", value: prop.type },
      { trait_type: "Valeur", value: prop.value },
      { trait_type: "Loyer de base", value: prop.rent },
      { trait_type: "Couleur", value: prop.color },
      { trait_type: "Position", value: prop.position }
    ],
    properties: {
      type: prop.type,
      value: prop.value,
      rent: prop.rent,
      color: prop.color,
      position: prop.position,
      previousOwners: [],
      createdAt: Date.now(),
      lastTransferAt: Date.now()
    }
  };

  const filename = `${prop.id}.json`;
  fs.writeFileSync(
    path.join(outputDir, filename),
    JSON.stringify(metadata, null, 2),
    'utf8'
  );

  console.log(`Created: ${filename} - ${prop.name}`);
});

console.log(`\n${properties.length} metadata files created in ${outputDir}`);