// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./interfaces/IFarmUpgradeable.sol";

/**
 * @title FactoryUpgradeable
 * @dev Factory contract for creating and managing Farm contracts
 * This is version 1 of the contract that supports basic farm deployment
 */
contract FactoryUpgradeable is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // Implementation address of the Farm contract
    address public farmImplementation;
    
    // Treasury address
    address public treasury;
    
    // Array of all deployed farms
    address[] public allFarms;
    
    // Mapping of creator to their deployed farms
    mapping(address => address[]) public creatorFarms;
    
    // Events
    event FarmCreated(
        address indexed farm,
        address indexed creator,
        address rewardToken,
        address stakingToken,
        uint256 rewardPerBlock,
        uint256 startBlock,
        uint256 lockPeriod
    );
    
    event FarmImplementationUpdated(
        address oldImplementation,
        address newImplementation
    );
    
    event TreasuryUpdated(
        address oldTreasury,
        address newTreasury
    );
    
    /**
     * @dev Initializes the contract with a treasury address
     * @param _treasury Address that will receive fees and serve as default admin
     */
    function initialize(address _treasury) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        require(_treasury != address(0), "Treasury cannot be zero address");
        treasury = _treasury;
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
     * @dev Sets the Farm implementation address
     * @param _implementation New implementation address
     */
    function setFarmImplementation(address _implementation) external onlyOwner {
        require(_implementation != address(0), "Implementation cannot be zero address");
        
        address oldImplementation = farmImplementation;
        farmImplementation = _implementation;
        
        emit FarmImplementationUpdated(oldImplementation, _implementation);
    }
    
    /**
     * @dev Sets the treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Treasury cannot be zero address");
        
        address oldTreasury = treasury;
        treasury = _treasury;
        
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /**
     * @dev Creates a new Farm contract
     * @param _rewardToken Token used for rewards
     * @param _stakingToken Token to be staked
     * @param _rewardPerBlock Amount of reward tokens distributed per block
     * @param _startBlock Block number when rewards start
     * @param _lockPeriod Duration in seconds for the lock period
     * @return farm Address of the newly created Farm
     */
    function createFarm(
        address _rewardToken,
        address _stakingToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _lockPeriod
    ) external nonReentrant returns (address farm) {
        require(farmImplementation != address(0), "Farm implementation not set");
        require(_rewardToken != address(0), "Reward token cannot be zero address");
        require(_stakingToken != address(0), "Staking token cannot be zero address");
        
        // Use clones to save gas
        farm = Clones.clone(farmImplementation);
        
        // Initialize the farm
        IFarmUpgradeable(farm).initialize(
            _rewardToken,
            _stakingToken,
            _rewardPerBlock,
            _startBlock,
            _lockPeriod,
            msg.sender,
            treasury
        );
        
        // Add to farm arrays
        allFarms.push(farm);
        creatorFarms[msg.sender].push(farm);
        
        emit FarmCreated(
            farm,
            msg.sender,
            _rewardToken,
            _stakingToken,
            _rewardPerBlock,
            _startBlock,
            _lockPeriod
        );
        
        return farm;
    }
    
    /**
     * @dev Returns all deployed farms
     * @return Array of all farm addresses
     */
    function getAllFarms() external view returns (address[] memory) {
        return allFarms;
    }
    
    /**
     * @dev Returns farms created by a specific address
     * @param _creator Creator address
     * @return Array of farm addresses created by _creator
     */
    function getFarmsByCreator(address _creator) external view returns (address[] memory) {
        return creatorFarms[_creator];
    }
    
    /**
     * @dev Returns the number of farms deployed
     * @return Total number of farms
     */
    function farmCount() external view returns (uint256) {
        return allFarms.length;
    }
    
    /**
     * @dev Returns the farms created by the caller
     * @return Array of farm addresses created by msg.sender
     */
    function getMyFarms() external view returns (address[] memory) {
        return creatorFarms[msg.sender];
    }
} 
