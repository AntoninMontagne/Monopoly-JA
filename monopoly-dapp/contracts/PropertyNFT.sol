// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    
    uint256 private _nextTokenId;
    uint256 public constant MAX_PROPERTIES_PER_PLAYER = 4;
    address public gameManager;
    
    enum PropertyType {
        STREET_BROWN,
        STREET_LIGHTBLUE,
        STREET_PINK,
        STREET_ORANGE,
        STREET_RED,
        STREET_YELLOW,
        STREET_GREEN,
        STREET_DARKBLUE,
        STATION,
        UTILITY
    }
    
    struct Property {
        string name;
        PropertyType propertyType;
        uint256 value;
        uint256 rent;
        uint256 createdAt;
        uint256 lastTransferAt;
        address[] previousOwners;
    }
    
    mapping(uint256 => Property) public properties;
    
    event PropertyMinted(uint256 indexed tokenId, string name, PropertyType propertyType, address indexed owner);
    event PropertyTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event GameManagerUpdated(address indexed oldManager, address indexed newManager);
    
    error MaxPropertiesReached(address player);
    error NotAuthorized(address caller);
    error ZeroAddress();
    error PropertyDoesNotExist(uint256 tokenId);
    
    constructor(address initialOwner) 
        ERC721("Monopoly Property", "MPROP") 
        Ownable(initialOwner) 
    {
        if (initialOwner == address(0)) revert ZeroAddress();
    }
    
    modifier onlyGameManagerOrOwner() {
        if (msg.sender != gameManager && msg.sender != owner()) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }
    
    function setGameManager(address _gameManager) external onlyOwner {
        if (_gameManager == address(0)) revert ZeroAddress();
        address oldManager = gameManager;
        gameManager = _gameManager;
        emit GameManagerUpdated(oldManager, _gameManager);
    }
    
    function mintProperty(
        address to,
        string memory name,
        PropertyType propertyType,
        uint256 value,
        uint256 rent,
        string memory uri
    ) external onlyGameManagerOrOwner returns (uint256) {
        if (to == address(0)) revert ZeroAddress();
        if (balanceOf(to) >= MAX_PROPERTIES_PER_PLAYER) {
            revert MaxPropertiesReached(to);
        }
        
        uint256 tokenId = _nextTokenId++;
        
        properties[tokenId] = Property({
            name: name,
            propertyType: propertyType,
            value: value,
            rent: rent,
            createdAt: block.timestamp,
            lastTransferAt: block.timestamp,
            previousOwners: new address[](0)
        });
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit PropertyMinted(tokenId, name, propertyType, to);
        
        return tokenId;
    }
    
    function getProperty(uint256 tokenId) external view returns (Property memory) {
        if (tokenId >= _nextTokenId) revert PropertyDoesNotExist(tokenId);
        return properties[tokenId];
    }
    
    function getPreviousOwners(uint256 tokenId) external view returns (address[] memory) {
        if (tokenId >= _nextTokenId) revert PropertyDoesNotExist(tokenId);
        return properties[tokenId].previousOwners;
    }
    
    function getPlayerPropertyCount(address player) external view returns (uint256) {
        return balanceOf(player);
    }
    
    function canReceiveProperty(address player) external view returns (bool) {
        return balanceOf(player) < MAX_PROPERTIES_PER_PLAYER;
    }
    
    function getTotalProperties() external view returns (uint256) {
        return _nextTokenId;
    }
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        if (from != address(0) && to != address(0)) {
            properties[tokenId].previousOwners.push(from);
            properties[tokenId].lastTransferAt = block.timestamp;
            emit PropertyTransferred(tokenId, from, to);
        }
        
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}