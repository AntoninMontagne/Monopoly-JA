// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MonopolyToken
 * @dev Token ERC-20 servant de monnaie pour le jeu Monopoly
 * @notice Symbole: MONO | Decimals: 18
 */
contract MonopolyToken is ERC20, ERC20Burnable, Ownable {
    
    /// @notice Montant initial donné à chaque nouveau joueur
    uint256 public constant INITIAL_PLAYER_BALANCE = 1500 * 10**18;
    
    /// @notice Adresse du GameManager autorisé à mint/burn
    address public gameManager;
    
    /// @notice Mapping des joueurs enregistrés
    mapping(address => bool) public registeredPlayers;
    
    /// @notice Events
    event PlayerRegistered(address indexed player, uint256 amount);
    event GameManagerUpdated(address indexed oldManager, address indexed newManager);
    
    /// @notice Erreurs personnalisées
    error PlayerAlreadyRegistered(address player);
    error NotAuthorized(address caller);
    error ZeroAddress();
    
    /**
     * @dev Constructeur - crée le token MONO
     * @param initialOwner Adresse du propriétaire initial
     */
    constructor(address initialOwner) 
        ERC20("Monopoly Token", "MONO") 
        Ownable(initialOwner) 
    {
        if (initialOwner == address(0)) revert ZeroAddress();
    }
    
    /**
     * @dev Modifier pour restreindre l'accès au GameManager ou Owner
     */
    modifier onlyGameManagerOrOwner() {
        if (msg.sender != gameManager && msg.sender != owner()) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }
    
    /**
     * @notice Définit l'adresse du GameManager
     * @param _gameManager Nouvelle adresse du GameManager
     */
    function setGameManager(address _gameManager) external onlyOwner {
        if (_gameManager == address(0)) revert ZeroAddress();
        address oldManager = gameManager;
        gameManager = _gameManager;
        emit GameManagerUpdated(oldManager, _gameManager);
    }
    
    /**
     * @notice Enregistre un nouveau joueur et lui donne ses tokens initiaux
     * @param player Adresse du joueur à enregistrer
     */
    function registerPlayer(address player) external onlyGameManagerOrOwner {
        if (player == address(0)) revert ZeroAddress();
        if (registeredPlayers[player]) revert PlayerAlreadyRegistered(player);
        
        registeredPlayers[player] = true;
        _mint(player, INITIAL_PLAYER_BALANCE);
        
        emit PlayerRegistered(player, INITIAL_PLAYER_BALANCE);
    }
    
    /**
     * @notice Mint de nouveaux tokens (récompenses, etc.)
     * @param to Adresse destinataire
     * @param amount Montant à mint
     */
    function mint(address to, uint256 amount) external onlyGameManagerOrOwner {
        if (to == address(0)) revert ZeroAddress();
        _mint(to, amount);
    }
    
    /**
     * @notice Vérifie si un joueur est enregistré
     * @param player Adresse à vérifier
     * @return bool True si le joueur est enregistré
     */
    function isPlayerRegistered(address player) external view returns (bool) {
        return registeredPlayers[player];
    }
}