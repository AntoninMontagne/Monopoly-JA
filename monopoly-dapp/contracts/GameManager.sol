// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MonopolyToken.sol";
import "./PropertyNFT.sol";

contract GameManager {
    
    MonopolyToken public monopolyToken;
    PropertyNFT public propertyNFT;
    address public owner;
    
    uint256 public constant COOLDOWN_TIME = 5 minutes;
    uint256 public constant LOCK_TIME = 10 minutes;
    
    mapping(address => uint256) public lastTransactionTime;
    mapping(address => uint256) public lockUntil;
    
    struct TradeOffer {
        address from;
        address to;
        uint256 propertyId;
        uint256 price;
        bool active;
        uint256 createdAt;
    }
    
    mapping(uint256 => TradeOffer) public tradeOffers;
    uint256 public nextTradeId;
    
    event PlayerRegistered(address indexed player);
    event PropertyPurchased(address indexed buyer, uint256 indexed propertyId, uint256 price);
    event TradeOfferCreated(uint256 indexed tradeId, address indexed from, address indexed to, uint256 propertyId, uint256 price);
    event TradeOfferAccepted(uint256 indexed tradeId, address indexed from, address indexed to, uint256 propertyId);
    event TradeOfferCancelled(uint256 indexed tradeId);
    event RentPaid(address indexed from, address indexed to, uint256 indexed propertyId, uint256 amount);
    
    error NotOwner();
    error CooldownActive(uint256 remainingTime);
    error LockActive(uint256 remainingTime);
    error PlayerAlreadyRegistered();
    error InsufficientBalance(uint256 required, uint256 available);
    error PropertyNotAvailable(uint256 propertyId);
    error NotPropertyOwner(uint256 propertyId);
    error TradeOfferNotFound(uint256 tradeId);
    error TradeOfferNotForYou(uint256 tradeId);
    error CannotTradeWithSelf();
    error MaxPropertiesReached();
    
    constructor(address _monopolyToken, address _propertyNFT) {
        monopolyToken = MonopolyToken(_monopolyToken);
        propertyNFT = PropertyNFT(_propertyNFT);
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    modifier checkCooldown() {
        uint256 lastTx = lastTransactionTime[msg.sender];
        if (lastTx != 0 && block.timestamp < lastTx + COOLDOWN_TIME) {
            revert CooldownActive(lastTx + COOLDOWN_TIME - block.timestamp);
        }
        _;
    }
    
    modifier checkLock() {
        uint256 lockEnd = lockUntil[msg.sender];
        if (lockEnd != 0 && block.timestamp < lockEnd) {
            revert LockActive(lockEnd - block.timestamp);
        }
        _;
    }
    
    function registerPlayer() external {
        if (monopolyToken.isPlayerRegistered(msg.sender)) {
            revert PlayerAlreadyRegistered();
        }
        monopolyToken.registerPlayer(msg.sender);
        emit PlayerRegistered(msg.sender);
    }
    
    function mintProperty(
        address to,
        string memory name,
        PropertyNFT.PropertyType propertyType,
        uint256 value,
        uint256 rent,
        string memory uri
    ) external onlyOwner returns (uint256) {
        return propertyNFT.mintProperty(to, name, propertyType, value, rent, uri);
    }
    
    function buyPropertyFromBank(
        uint256 propertyId,
        uint256 price
    ) external checkCooldown checkLock {
        if (!propertyNFT.canReceiveProperty(msg.sender)) {
            revert MaxPropertiesReached();
        }
        
        address propertyOwner = propertyNFT.ownerOf(propertyId);
        if (propertyOwner != owner) {
            revert PropertyNotAvailable(propertyId);
        }
        
        uint256 balance = monopolyToken.balanceOf(msg.sender);
        if (balance < price) {
            revert InsufficientBalance(price, balance);
        }
        
        monopolyToken.transferFrom(msg.sender, owner, price);
        propertyNFT.transferFrom(owner, msg.sender, propertyId);
        
        lastTransactionTime[msg.sender] = block.timestamp;
        lockUntil[msg.sender] = block.timestamp + LOCK_TIME;
        
        emit PropertyPurchased(msg.sender, propertyId, price);
    }
    
    function createTradeOffer(
        address to,
        uint256 propertyId,
        uint256 price
    ) external checkCooldown checkLock returns (uint256) {
        if (to == msg.sender) revert CannotTradeWithSelf();
        
        address propertyOwner = propertyNFT.ownerOf(propertyId);
        if (propertyOwner != msg.sender) {
            revert NotPropertyOwner(propertyId);
        }
        
        uint256 tradeId = nextTradeId++;
        
        tradeOffers[tradeId] = TradeOffer({
            from: msg.sender,
            to: to,
            propertyId: propertyId,
            price: price,
            active: true,
            createdAt: block.timestamp
        });
        
        lastTransactionTime[msg.sender] = block.timestamp;
        
        emit TradeOfferCreated(tradeId, msg.sender, to, propertyId, price);
        
        return tradeId;
    }
    
    function acceptTradeOffer(uint256 tradeId) external checkCooldown checkLock {
        TradeOffer storage offer = tradeOffers[tradeId];
        
        if (!offer.active) revert TradeOfferNotFound(tradeId);
        if (offer.to != msg.sender) revert TradeOfferNotForYou(tradeId);
        if (!propertyNFT.canReceiveProperty(msg.sender)) revert MaxPropertiesReached();
        
        uint256 balance = monopolyToken.balanceOf(msg.sender);
        if (balance < offer.price) {
            revert InsufficientBalance(offer.price, balance);
        }
        
        offer.active = false;
        
        if (offer.price > 0) {
            monopolyToken.transferFrom(msg.sender, offer.from, offer.price);
        }
        propertyNFT.transferFrom(offer.from, msg.sender, offer.propertyId);
        
        lastTransactionTime[msg.sender] = block.timestamp;
        lockUntil[msg.sender] = block.timestamp + LOCK_TIME;
        
        emit TradeOfferAccepted(tradeId, offer.from, msg.sender, offer.propertyId);
    }
    
    function cancelTradeOffer(uint256 tradeId) external {
        TradeOffer storage offer = tradeOffers[tradeId];
        
        if (!offer.active) revert TradeOfferNotFound(tradeId);
        if (offer.from != msg.sender) revert NotPropertyOwner(offer.propertyId);
        
        offer.active = false;
        
        emit TradeOfferCancelled(tradeId);
    }
    
    function payRent(uint256 propertyId) external checkCooldown {
        address propertyOwner = propertyNFT.ownerOf(propertyId);
        
        if (propertyOwner == msg.sender) return;
        
        PropertyNFT.Property memory prop = propertyNFT.getProperty(propertyId);
        uint256 rentAmount = prop.rent * 1e18;
        
        uint256 balance = monopolyToken.balanceOf(msg.sender);
        if (balance < rentAmount) {
            revert InsufficientBalance(rentAmount, balance);
        }
        
        monopolyToken.transferFrom(msg.sender, propertyOwner, rentAmount);
        
        lastTransactionTime[msg.sender] = block.timestamp;
        
        emit RentPaid(msg.sender, propertyOwner, propertyId, rentAmount);
    }
    
    function getCooldownRemaining(address player) external view returns (uint256) {
        uint256 lastTx = lastTransactionTime[player];
        if (lastTx == 0) return 0;
        
        uint256 cooldownEnd = lastTx + COOLDOWN_TIME;
        if (block.timestamp >= cooldownEnd) return 0;
        
        return cooldownEnd - block.timestamp;
    }
    
    function getLockRemaining(address player) external view returns (uint256) {
        uint256 lockEnd = lockUntil[player];
        if (lockEnd == 0) return 0;
        if (block.timestamp >= lockEnd) return 0;
        
        return lockEnd - block.timestamp;
    }
    
    function getTradeOffer(uint256 tradeId) external view returns (TradeOffer memory) {
        return tradeOffers[tradeId];
    }
    
    function isPlayerRegistered(address player) external view returns (bool) {
        return monopolyToken.isPlayerRegistered(player);
    }
    
    function getPlayerBalance(address player) external view returns (uint256) {
        return monopolyToken.balanceOf(player);
    }
    
    function getPlayerPropertyCount(address player) external view returns (uint256) {
        return propertyNFT.balanceOf(player);
    }
}