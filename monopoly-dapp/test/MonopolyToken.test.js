const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("MonopolyToken", function () {
    
    async function deployTokenFixture() {
        const [owner, gameManager, player1, player2, player3] = await ethers.getSigners();
        
        const MonopolyToken = await ethers.getContractFactory("MonopolyToken");
        const token = await MonopolyToken.deploy(owner.address);
        
        return { token, owner, gameManager, player1, player2, player3 };
    }
    
    describe("Deployment", function () {
        it("should set the correct name and symbol", async function () {
            const { token } = await loadFixture(deployTokenFixture);
            
            expect(await token.name()).to.equal("Monopoly Token");
            expect(await token.symbol()).to.equal("MONO");
        });
        
        it("should set the correct owner", async function () {
            const { token, owner } = await loadFixture(deployTokenFixture);
            
            expect(await token.owner()).to.equal(owner.address);
        });
        
        it("should have correct initial player balance constant", async function () {
            const { token } = await loadFixture(deployTokenFixture);
            
            const expected = ethers.parseEther("1500");
            expect(await token.INITIAL_PLAYER_BALANCE()).to.equal(expected);
        });
        
        it("should revert if deployed with zero address", async function () {
            const MonopolyToken = await ethers.getContractFactory("MonopolyToken");
            
            await expect(MonopolyToken.deploy(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(MonopolyToken, "OwnableInvalidOwner");
        });
    });
    
    describe("GameManager", function () {
        it("should allow owner to set game manager", async function () {
            const { token, owner, gameManager } = await loadFixture(deployTokenFixture);
            
            await token.connect(owner).setGameManager(gameManager.address);
            
            expect(await token.gameManager()).to.equal(gameManager.address);
        });
        
        it("should emit GameManagerUpdated event", async function () {
            const { token, owner, gameManager } = await loadFixture(deployTokenFixture);
            
            await expect(token.connect(owner).setGameManager(gameManager.address))
                .to.emit(token, "GameManagerUpdated")
                .withArgs(ethers.ZeroAddress, gameManager.address);
        });
        
        it("should revert if non-owner tries to set game manager", async function () {
            const { token, player1, gameManager } = await loadFixture(deployTokenFixture);
            
            await expect(token.connect(player1).setGameManager(gameManager.address))
                .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });
        
        it("should revert if setting zero address as game manager", async function () {
            const { token, owner } = await loadFixture(deployTokenFixture);
            
            await expect(token.connect(owner).setGameManager(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(token, "ZeroAddress");
        });
    });
    
    describe("Register Player", function () {
        it("should register player and mint initial balance", async function () {
            const { token, owner, player1 } = await loadFixture(deployTokenFixture);
            
            await token.connect(owner).registerPlayer(player1.address);
            
            const expected = ethers.parseEther("1500");
            expect(await token.balanceOf(player1.address)).to.equal(expected);
            expect(await token.isPlayerRegistered(player1.address)).to.be.true;
        });
        
        it("should emit PlayerRegistered event", async function () {
            const { token, owner, player1 } = await loadFixture(deployTokenFixture);
            
            const expected = ethers.parseEther("1500");
            
            await expect(token.connect(owner).registerPlayer(player1.address))
                .to.emit(token, "PlayerRegistered")
                .withArgs(player1.address, expected);
        });
        
        it("should allow game manager to register player", async function () {
            const { token, owner, gameManager, player1 } = await loadFixture(deployTokenFixture);
            
            await token.connect(owner).setGameManager(gameManager.address);
            await token.connect(gameManager).registerPlayer(player1.address);
            
            expect(await token.isPlayerRegistered(player1.address)).to.be.true;
        });
        
        it("should revert if player already registered", async function () {
            const { token, owner, player1 } = await loadFixture(deployTokenFixture);
            
            await token.connect(owner).registerPlayer(player1.address);
            
            await expect(token.connect(owner).registerPlayer(player1.address))
                .to.be.revertedWithCustomError(token, "PlayerAlreadyRegistered")
                .withArgs(player1.address);
        });
        
        it("should revert if non-authorized tries to register", async function () {
            const { token, player1, player2 } = await loadFixture(deployTokenFixture);
            
            await expect(token.connect(player1).registerPlayer(player2.address))
                .to.be.revertedWithCustomError(token, "NotAuthorized");
        });
        
        it("should revert if registering zero address", async function () {
            const { token, owner } = await loadFixture(deployTokenFixture);
            
            await expect(token.connect(owner).registerPlayer(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(token, "ZeroAddress");
        });
    });
    
    describe("Mint", function () {
        it("should allow owner to mint tokens", async function () {
            const { token, owner, player1 } = await loadFixture(deployTokenFixture);
            
            const amount = ethers.parseEther("100");
            await token.connect(owner).mint(player1.address, amount);
            
            expect(await token.balanceOf(player1.address)).to.equal(amount);
        });
        
        it("should allow game manager to mint tokens", async function () {
            const { token, owner, gameManager, player1 } = await loadFixture(deployTokenFixture);
            
            await token.connect(owner).setGameManager(gameManager.address);
            
            const amount = ethers.parseEther("200");
            await token.connect(gameManager).mint(player1.address, amount);
            
            expect(await token.balanceOf(player1.address)).to.equal(amount);
        });
        
        it("should revert if non-authorized tries to mint", async function () {
            const { token, player1, player2 } = await loadFixture(deployTokenFixture);
            
            const amount = ethers.parseEther("100");
            
            await expect(token.connect(player1).mint(player2.address, amount))
                .to.be.revertedWithCustomError(token, "NotAuthorized");
        });
    });
    
    describe("Burn", function () {
        it("should allow player to burn their own tokens", async function () {
            const { token, owner, player1 } = await loadFixture(deployTokenFixture);
            
            await token.connect(owner).registerPlayer(player1.address);
            
            const burnAmount = ethers.parseEther("500");
            await token.connect(player1).burn(burnAmount);
            
            const expected = ethers.parseEther("1000");
            expect(await token.balanceOf(player1.address)).to.equal(expected);
        });
    });
    
    describe("Transfer", function () {
        it("should allow players to transfer tokens", async function () {
            const { token, owner, player1, player2 } = await loadFixture(deployTokenFixture);
            
            await token.connect(owner).registerPlayer(player1.address);
            
            const transferAmount = ethers.parseEther("200");
            await token.connect(player1).transfer(player2.address, transferAmount);
            
            expect(await token.balanceOf(player2.address)).to.equal(transferAmount);
            expect(await token.balanceOf(player1.address)).to.equal(ethers.parseEther("1300"));
        });
    });
});