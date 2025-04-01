// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./TestTokenUpgradeable.sol";

/// @title Upgradeable Test Token V2 for AI Harvest
/// @notice ERC20 token with pausable functionality and burn capabilities
/// @dev V2 adds pausable functionality to the token
contract TestTokenUpgradeableV2 is 
    Initializable, 
    ERC20Upgradeable, 
    OwnableUpgradeable, 
    PausableUpgradeable,
    UUPSUpgradeable 
{
    uint8 private _decimals;
    uint256 public maxSupply;
    mapping(address => bool) public blacklisted;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /// @notice Initializes the contract
    /// @dev Replace the constructor for upgradeable contracts
    /// @param name Token name
    /// @param symbol Token symbol
    /// @param decimalsValue Token decimals
    /// @param initialSupply Initial supply to mint to the deployer
    function initialize(
        string memory name,
        string memory symbol,
        uint8 decimalsValue,
        uint256 initialSupply
    ) public initializer {
        __ERC20_init(name, symbol);
        __Ownable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        _decimals = decimalsValue;
        maxSupply = initialSupply * 10;
        
        _mint(msg.sender, initialSupply);
    }
    
    /// @notice Returns the number of decimals the token uses
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /// @notice Mints new tokens to a specified address
    /// @dev Only callable by the owner
    /// @param to The address to mint tokens to
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= maxSupply, "Exceeds maximum supply");
        _mint(to, amount);
    }
    
    /// @notice Burns tokens from the caller's address
    /// @param amount The amount of tokens to burn
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /// @notice Pauses token transfers
    /// @dev Only callable by the owner
    function pause() external onlyOwner {
        _pause();
    }
    
    /// @notice Unpauses token transfers
    /// @dev Only callable by the owner
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /// @notice Blacklists an address from transferring tokens
    /// @dev Only callable by the owner
    /// @param account The address to blacklist
    function blacklist(address account) external onlyOwner {
        require(account != address(0), "Cannot blacklist zero address");
        blacklisted[account] = true;
    }
    
    /// @notice Removes an address from the blacklist
    /// @dev Only callable by the owner
    /// @param account The address to remove from blacklist
    function removeFromBlacklist(address account) external onlyOwner {
        blacklisted[account] = false;
    }
    
    /// @notice Updates the maximum supply limit
    /// @dev Only callable by the owner
    /// @param newMaxSupply The new maximum supply
    function updateMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= totalSupply(), "New max supply below current total supply");
        maxSupply = newMaxSupply;
    }
    
    /// @notice Hook that is called before any transfer of tokens
    /// @dev Includes pausable and blacklist functionality
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        require(!blacklisted[from] && !blacklisted[to], "Blacklisted address");
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /// @notice Function that allows the contract to be upgraded
    /// @dev Only callable by the owner
    /// @param newImplementation Address of the new implementation
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Additional upgrade restrictions can be added here
    }
    
    /// @notice Returns the current contract version
    /// @return Version string
    function version() public pure virtual returns (string memory) {
        return "2.0.0";
    }
} 
