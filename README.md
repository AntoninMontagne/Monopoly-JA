# Monopoly DApp

Une version décentralisée du Monopoly sur Ethereum (Sepolia).

## Aperçu

Ce projet permet de jouer au Monopoly sur la blockchain. Les propriétés sont des NFTs, la monnaie est un token ERC-20, et toutes les règles sont gérées par des smart contracts.

## Fonctionnalités

- Inscription et réception de 1500 MONO
- 28 propriétés à acheter (rues, gares, services publics)
- Système d'échange entre joueurs
- Limite de 4 propriétés par joueur
- Cooldown de 5 minutes entre les transactions
- Lock de 10 minutes après un achat
- Métadonnées des NFTs sur IPFS

## Stack technique

- Solidity 0.8.28
- Hardhat
- OpenZeppelin Contracts
- React + ethers.js
- IPFS (Pinata)
- Sepolia Testnet

## Installation

### Prérequis

- Node.js >= 18
- MetaMask avec des SepoliaETH
- Compte Alchemy (pour le RPC)

### Installer les dépendances

```bash
# Backend (smart contracts)
npm install

# Frontend
cd frontend
npm install
cd ..
```

### Configuration

Crée un fichier `.env` à la racine :

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/TA_CLE_API
PRIVATE_KEY=ta_cle_privee_sans_0x
REPORT_GAS=true
```

## Utilisation

### Compiler les contrats

```bash
npx hardhat compile
```

### Lancer les tests

```bash
npx hardhat test
```

### Déployer sur Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/mint-properties.js --network sepolia
npx hardhat run scripts/approve-nfts.js --network sepolia
```

### Lancer le frontend

```bash
cd frontend
npm start
```

## Contrats déployés (Sepolia)

| Contrat | Adresse |
|---------|---------|
| MonopolyToken | `0xd657296ad0960d0E87C3305d52D0c3e7b856db28` |
| PropertyNFT | `0x2a3CcDEf8994Ec2Fe27625dedAE15095525e893c` |
| GameManager | `0x433B688AE86339f364f623696e148cFaE64dfd0B` |

## Structure du projet

```
├── contracts/           # Smart contracts Solidity
├── test/               # Tests unitaires
├── scripts/            # Scripts de déploiement
├── frontend/           # Application React
├── metadata/           # Métadonnées IPFS
├── docs/               # Documentation
└── hardhat.config.js
```

## Comment jouer

1. Connecte MetaMask sur Sepolia
2. Clique sur "S'inscrire" pour recevoir 1500 MONO
3. Achète des propriétés (max 4)
4. Propose des échanges à d'autres joueurs

## Ajouter le token MONO dans MetaMask

1. Ouvre MetaMask
2. Clique sur "Importer des tokens"
3. Colle l'adresse : `0xd657296ad0960d0E87C3305d52D0c3e7b856db28`

## Documentation

Voir `docs/documentation.pdf` pour la documentation complète.

## Contributeurs

- **Antonin MONTAGNE**
- **Jérome PHILIPPE** 

## Licence

Ce projet est sous licence MIT.
