// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title TestTokenUpgradeable
 * @dev ERC20 Token with upgradeability using UUPS proxy pattern
 * This is version 1 of the contract that supports basic ERC20 functionality
 */
contract TestTokenUpgradeable is 
    Initializable, 
    ERC20Upgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable 
{
    /**
     * @dev Initializes the token with a name and symbol
     * @param name_ Token name
     * @param symbol_ Token symbol
     */
    function initialize(
        string memory name_,
        string memory symbol_
    ) public initializer {
        __ERC20_init(name_, symbol_);
        __Ownable_init();
        __UUPSUpgradeable_init();
    }
    
    /**
     * @dev Returns the current version of the contract
     * @return Current version string
     */
    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }
    
    /**
     * @dev Function that authorizes an upgrade to a new implementation
     * Only the owner can authorize an upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
     * @dev Mints tokens to a specified address
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
} 
