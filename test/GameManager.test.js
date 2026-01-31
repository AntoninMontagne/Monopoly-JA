const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("GameManager", function () {
    
    async function deployFixture() {
        const [owner, player1, player2, player3] = await ethers.getSigners();
        
        const MonopolyToken = await ethers.getContractFactory("MonopolyToken");
        const token = await MonopolyToken.deploy(owner.address);
        
        const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
        const nft = await PropertyNFT.deploy(owner.address);
        
        const GameManager = await ethers.getContractFactory("GameManager");
        const game = await GameManager.deploy(await token.getAddress(), await nft.getAddress());
        
        await token.setGameManager(await game.getAddress());
        await nft.setGameManager(await game.getAddress());
        
        return { token, nft, game, owner, player1, player2, player3 };
    }
    
    describe("Deployment", function () {
        it("should set correct token and NFT addresses", async function () {
            const { token, nft, game } = await loadFixture(deployFixture);
            
            expect(await game.monopolyToken()).to.equal(await token.getAddress());
            expect(await game.propertyNFT()).to.equal(await nft.getAddress());
        });
        
        it("should set correct owner", async function () {
            const { game, owner } = await loadFixture(deployFixture);
            
            expect(await game.owner()).to.equal(owner.address);
        });
        
        it("should have correct cooldown time", async function () {
            const { game } = await loadFixture(deployFixture);
            
            expect(await game.COOLDOWN_TIME()).to.equal(5 * 60);
        });
        
        it("should have correct lock time", async function () {
            const { game } = await loadFixture(deployFixture);
            
            expect(await game.LOCK_TIME()).to.equal(10 * 60);
        });
    });
    
    describe("Player Registration", function () {
        it("should register a new player", async function () {
            const { game, player1 } = await loadFixture(deployFixture);
            
            await game.connect(player1).registerPlayer();
            
            expect(await game.isPlayerRegistered(player1.address)).to.be.true;
        });
        
        it("should give initial balance to registered player", async function () {
            const { game, player1 } = await loadFixture(deployFixture);
            
            await game.connect(player1).registerPlayer();
            
            const balance = await game.getPlayerBalance(player1.address);
            expect(balance).to.equal(ethers.parseEther("1500"));
        });
        
        it("should emit PlayerRegistered event", async function () {
            const { game, player1 } = await loadFixture(deployFixture);
            
            await expect(game.connect(player1).registerPlayer())
                .to.emit(game, "PlayerRegistered")
                .withArgs(player1.address);
        });
        
        it("should revert if player already registered", async function () {
            const { game, player1 } = await loadFixture(deployFixture);
            
            await game.connect(player1).registerPlayer();
            
            await expect(game.connect(player1).registerPlayer())
                .to.be.revertedWithCustomError(game, "PlayerAlreadyRegistered");
        });
    });
    
    describe("Property Minting", function () {
        it("should allow owner to mint property", async function () {
            const { game, nft, owner, player1 } = await loadFixture(deployFixture);
            
            await game.connect(owner).mintProperty(
                player1.address,
                "Boulevard de Belleville",
                0,
                60,
                2,
                "ipfs://test/0.json"
            );
            
            expect(await nft.balanceOf(player1.address)).to.equal(1);
        });
        
        it("should revert if non-owner tries to mint", async function () {
            const { game, player1, player2 } = await loadFixture(deployFixture);
            
            await expect(game.connect(player1).mintProperty(
                player2.address,
                "Test Property",
                0,
                100,
                5,
                "ipfs://test"
            )).to.be.revertedWithCustomError(game, "NotOwner");
        });
    });
    
    describe("Cooldown", function () {
        it("should enforce cooldown between transactions", async function () {
            const { game, nft, owner, player1 } = await loadFixture(deployFixture);
            
            await game.connect(player1).registerPlayer();
            
            await game.connect(owner).mintProperty(
                owner.address, "Prop1", 0, 60, 2, "ipfs://1"
            );
            await game.connect(owner).mintProperty(
                owner.address, "Prop2", 0, 60, 2, "ipfs://2"
            );
            
            await nft.connect(owner).approve(await game.getAddress(), 0);
            await nft.connect(owner).approve(await game.getAddress(), 1);
            
            const token = await ethers.getContractAt("MonopolyToken", await game.monopolyToken());
            await token.connect(player1).approve(await game.getAddress(), ethers.parseEther("1000"));
            
            await game.connect(player1).buyPropertyFromBank(0, ethers.parseEther("60"));
            
            await expect(game.connect(player1).buyPropertyFromBank(1, ethers.parseEther("60")))
                .to.be.reverted;
        });
        
        it("should allow transaction after cooldown", async function () {
            const { game, nft, owner, player1 } = await loadFixture(deployFixture);
            
            await game.connect(player1).registerPlayer();
            
            await game.connect(owner).mintProperty(owner.address, "Prop1", 0, 60, 2, "ipfs://1");
            await game.connect(owner).mintProperty(owner.address, "Prop2", 0, 60, 2, "ipfs://2");
            
            await nft.connect(owner).approve(await game.getAddress(), 0);
            await nft.connect(owner).approve(await game.getAddress(), 1);
            
            const token = await ethers.getContractAt("MonopolyToken", await game.monopolyToken());
            await token.connect(player1).approve(await game.getAddress(), ethers.parseEther("1000"));
            
            await game.connect(player1).buyPropertyFromBank(0, ethers.parseEther("60"));
            
            await time.increase(11 * 60);
            
            await expect(game.connect(player1).buyPropertyFromBank(1, ethers.parseEther("60")))
                .to.not.be.reverted;
        });
    });
    
    describe("Max Properties Limit", function () {
        it("should enforce max 4 properties per player", async function () {
            const { game, nft, owner, player1 } = await loadFixture(deployFixture);
            
            await game.connect(player1).registerPlayer();
            
            const token = await ethers.getContractAt("MonopolyToken", await game.monopolyToken());
            await token.connect(player1).approve(await game.getAddress(), ethers.parseEther("10000"));
            
            for (let i = 0; i < 4; i++) {
                await game.connect(owner).mintProperty(
                    owner.address, `Prop${i}`, 0, 60, 2, `ipfs://${i}`
                );
                await nft.connect(owner).approve(await game.getAddress(), i);
                await game.connect(player1).buyPropertyFromBank(i, ethers.parseEther("60"));
                await time.increase(11 * 60);
            }
            
            await game.connect(owner).mintProperty(
                owner.address, "Prop4", 0, 60, 2, "ipfs://4"
            );
            await nft.connect(owner).approve(await game.getAddress(), 4);
            
            await expect(game.connect(player1).buyPropertyFromBank(4, ethers.parseEther("60")))
                .to.be.revertedWithCustomError(game, "MaxPropertiesReached");
        });
    });
    
    describe("Trade Offers", function () {
        it("should create trade offer", async function () {
            const { game, nft, owner, player1, player2 } = await loadFixture(deployFixture);
            
            await game.connect(player1).registerPlayer();
            await game.connect(player2).registerPlayer();
            
            await game.connect(owner).mintProperty(
                player1.address, "Prop1", 0, 60, 2, "ipfs://1"
            );
            
            await nft.connect(player1).approve(await game.getAddress(), 0);
            
            await expect(game.connect(player1).createTradeOffer(
                player2.address, 0, ethers.parseEther("100")
            )).to.emit(game, "TradeOfferCreated");
        });
        
        it("should accept trade offer", async function () {
            const { game, nft, owner, player1, player2 } = await loadFixture(deployFixture);
            
            await game.connect(player1).registerPlayer();
            await game.connect(player2).registerPlayer();
            
            await game.connect(owner).mintProperty(
                player1.address, "Prop1", 0, 60, 2, "ipfs://1"
            );
            
            await nft.connect(player1).approve(await game.getAddress(), 0);
            
            await game.connect(player1).createTradeOffer(
                player2.address, 0, ethers.parseEther("100")
            );
            
            const token = await ethers.getContractAt("MonopolyToken", await game.monopolyToken());
            await token.connect(player2).approve(await game.getAddress(), ethers.parseEther("100"));
            
            await time.increase(11 * 60);
            
            await expect(game.connect(player2).acceptTradeOffer(0))
                .to.emit(game, "TradeOfferAccepted");
            
            expect(await nft.ownerOf(0)).to.equal(player2.address);
        });
        
        it("should cancel trade offer", async function () {
            const { game, nft, owner, player1, player2 } = await loadFixture(deployFixture);
            
            await game.connect(player1).registerPlayer();
            
            await game.connect(owner).mintProperty(
                player1.address, "Prop1", 0, 60, 2, "ipfs://1"
            );
            
            await nft.connect(player1).approve(await game.getAddress(), 0);
            
            await game.connect(player1).createTradeOffer(
                player2.address, 0, ethers.parseEther("100")
            );
            
            await expect(game.connect(player1).cancelTradeOffer(0))
                .to.emit(game, "TradeOfferCancelled");
        });
        
        it("should revert if trading with self", async function () {
            const { game, nft, owner, player1 } = await loadFixture(deployFixture);
            
            await game.connect(player1).registerPlayer();
            
            await game.connect(owner).mintProperty(
                player1.address, "Prop1", 0, 60, 2, "ipfs://1"
            );
            
            await nft.connect(player1).approve(await game.getAddress(), 0);
            
            await expect(game.connect(player1).createTradeOffer(
                player1.address, 0, ethers.parseEther("100")
            )).to.be.revertedWithCustomError(game, "CannotTradeWithSelf");
        });
    });
    
    describe("View Functions", function () {
        it("should return cooldown remaining", async function () {
            const { game, nft, owner, player1 } = await loadFixture(deployFixture);
            
            await game.connect(player1).registerPlayer();
            
            await game.connect(owner).mintProperty(
                owner.address, "Prop1", 0, 60, 2, "ipfs://1"
            );
            await nft.connect(owner).approve(await game.getAddress(), 0);
            
            const token = await ethers.getContractAt("MonopolyToken", await game.monopolyToken());
            await token.connect(player1).approve(await game.getAddress(), ethers.parseEther("100"));
            
            await game.connect(player1).buyPropertyFromBank(0, ethers.parseEther("60"));
            
            const remaining = await game.getCooldownRemaining(player1.address);
            expect(remaining).to.be.greaterThan(0);
        });
        
        it("should return zero cooldown for new player", async function () {
            const { game, player1 } = await loadFixture(deployFixture);
            
            const remaining = await game.getCooldownRemaining(player1.address);
            expect(remaining).to.equal(0);
        });
    });
});