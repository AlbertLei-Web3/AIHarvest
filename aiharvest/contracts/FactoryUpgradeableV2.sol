// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./FarmUpgradeableV2.sol";
import "./SimpleSwapRouter.sol";

/// @title Upgradeable Factory Contract V2 for AI Harvest
/// @notice Enhanced factory with batch deployment and farm upgrades
/// @dev V2 adds bulk farm management and management dashboard analytics
contract FactoryUpgradeableV2 is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    // 状态变�?
    address[] public allFarms;
    mapping(address => bool) public isFarmFromFactory;
    
    address public farmImplementation;
    address public swapRouterImplementation;
    address public swapRouter;
    
    // V2新增状态变�?
    struct FarmInfo {
        address farmAddress;
        address rewardToken;
        uint256 rewardPerSecond;
        uint256 startTime;
        uint256 creationTime;
        uint256 tvl;           // 总锁仓价值，按ETH计价
        uint256 userCount;     // 用户数量
    }
    
    mapping(address => FarmInfo) public farmInfo;
    address[] public farmCategories;
    mapping(address => address[]) public categoryFarms;    // 类别到农场的映射
    mapping(address => address) public farmToCategory;     // 农场到类别的映射
    mapping(address => bool) public blacklistedFarms;      // 黑名单农�?
    address public platformTreasury;                       // 平台国库地址
    uint256 public platformFeePercent;                     // 平台费用百分�?(100 = 1%)
    
    // Minimum stake amount
    uint256 public minimumStakeAmount;
    
    // Maximum fee that can be charged by farms
    uint256 public maxFeePercentage;
    
    // System statistics
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    uint256 public totalUsers;
    
    // Blacklist functionality
    mapping(address => bool) public blacklisted;
    
    // Events
    event FarmCreated(address indexed farm, address indexed rewardToken, uint256 rewardPerSecond);
    event FarmImplementationUpdated(address oldImplementation, address newImplementation);
    event SwapRouterCreated(address indexed swapRouter);
    event SwapRouterImplementationUpdated(address oldImplementation, address newImplementation);
    event SwapRouterUpgraded(address indexed proxy, address indexed implementation);
    event BatchFarmsCreated(address[] farms, address indexed category);
    event FarmCategoryCreated(address indexed category, string name);
    event FarmUpgraded(address indexed farm, address indexed implementation);
    event FarmBlacklisted(address indexed farm, bool status);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FarmTVLUpdated(address indexed farm, uint256 newTVL);
    event FarmUserCountUpdated(address indexed farm, uint256 newUserCount);
    event FarmsCategorized(address[] farms, string category);
    event MinimumStakeAmountUpdated(uint256 newAmount);
    event MaxFeePercentageUpdated(uint256 newPercentage);
    event BlacklistUpdated(address user, bool blacklisted);
    event FarmsBatchCreated(address[] farms, address creator);
    event SystemStatsUpdated(uint256 totalStaked, uint256 totalRewards, uint256 totalUsers);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /// @notice Initializes the factory contract (already defined in V1)
    function initialize(address _farmImplementation, address _swapRouterImplementation) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        require(_farmImplementation != address(0), "Invalid farm implementation");
        require(_swapRouterImplementation != address(0), "Invalid swap router implementation");
        
        farmImplementation = _farmImplementation;
        swapRouterImplementation = _swapRouterImplementation;
    }
    
    // V2新增或修改的函数
    
    /// @notice Sets the platform treasury address
    /// @dev Only callable by the owner
    /// @param _treasury Treasury address
    function setPlatformTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        address oldTreasury = platformTreasury;
        platformTreasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /// @notice Sets the platform fee percentage
    /// @dev Only callable by the owner
    /// @param _feePercent Fee percentage (100 = 1%)
    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 1000, "Fee cannot exceed 10%");
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _feePercent;
        emit PlatformFeeUpdated(oldFee, _feePercent);
    }
    
    /// @notice Creates a new farm category
    /// @dev Only callable by the owner
    /// @param _category Category identifier address
    /// @param _name Category name
    function createFarmCategory(address _category, string calldata _name) external onlyOwner {
        require(_category != address(0), "Invalid category address");
        
        bool categoryExists = false;
        for (uint256 i = 0; i < farmCategories.length; i++) {
            if (farmCategories[i] == _category) {
                categoryExists = true;
                break;
            }
        }
        
        require(!categoryExists, "Category already exists");
        
        farmCategories.push(_category);
        emit FarmCategoryCreated(_category, _name);
    }
    
    /// @notice Creates multiple farms at once
    /// @dev Only callable by the owner
    /// @param _rewardTokens Array of reward tokens
    /// @param _rewardRates Array of reward rates
    /// @param _startTimes Array of start times
    /// @param _category Category for the farms
    /// @return farmAddresses Array of created farm addresses
    function batchCreateFarms(
        IERC20[] calldata _rewardTokens,
        uint256[] calldata _rewardRates,
        uint256[] calldata _startTimes,
        address _category
    ) external onlyOwner returns (address[] memory farmAddresses) {
        require(_rewardTokens.length > 0, "Empty input arrays");
        require(_rewardTokens.length == _rewardRates.length && _rewardTokens.length == _startTimes.length, "Array length mismatch");
        
        bool validCategory = false;
        for (uint256 i = 0; i < farmCategories.length; i++) {
            if (farmCategories[i] == _category) {
                validCategory = true;
                break;
            }
        }
        require(validCategory, "Invalid category");
        
        farmAddresses = new address[](_rewardTokens.length);
        
        for (uint256 i = 0; i < _rewardTokens.length; i++) {
            address farmAddress = _createFarm(_rewardTokens[i], _rewardRates[i], _startTimes[i]);
            farmAddresses[i] = farmAddress;
            
            // 添加到类别映�?
            categoryFarms[_category].push(farmAddress);
            farmToCategory[farmAddress] = _category;
            
            // 记录农场信息
            farmInfo[farmAddress] = FarmInfo({
                farmAddress: farmAddress,
                rewardToken: address(_rewardTokens[i]),
                rewardPerSecond: _rewardRates[i],
                startTime: _startTimes[i],
                creationTime: block.timestamp,
                tvl: 0,
                userCount: 0
            });
        }
        
        emit BatchFarmsCreated(farmAddresses, _category);
        return farmAddresses;
    }
    
    /// @notice Internal function to create a farm
    /// @param _rewardToken Reward token
    /// @param _rewardPerSecond Reward rate
    /// @param _startTime Start time
    /// @return farm Address of the created farm
    function _createFarm(
        IERC20 _rewardToken,
        uint256 _rewardPerSecond,
        uint256 _startTime
    ) internal returns (address farm) {
        require(address(_rewardToken) != address(0), "Invalid reward token");
        require(_rewardPerSecond > 0, "Reward per second must be positive");
        require(_startTime > block.timestamp, "Start time must be in the future");
        
        // 创建代理并初始化
        bytes memory initData = abi.encodeWithSelector(
            FarmUpgradeableV2.initialize.selector,
            _rewardToken,
            _rewardPerSecond,
            _startTime,
            address(this)
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(
            farmImplementation,
            initData
        );
        
        farm = address(proxy);
        allFarms.push(farm);
        isFarmFromFactory[farm] = true;
        
        emit FarmCreated(farm, address(_rewardToken), _rewardPerSecond);
        return farm;
    }
    
    /// @notice Blacklists or unblacklists a farm
    /// @dev Only callable by the owner
    /// @param _farm Farm address
    /// @param _status Blacklist status
    function setFarmBlacklistStatus(address _farm, bool _status) external onlyOwner {
        require(_farm != address(0), "Invalid farm address");
        require(isFarmFromFactory[_farm], "Not a farm from this factory");
        
        blacklistedFarms[_farm] = _status;
        emit FarmBlacklisted(_farm, _status);
    }
    
    /// @notice Upgrades a specific farm contract
    /// @dev Only callable by the owner
    /// @param _farm Farm address
    function upgradeFarm(address _farm) external onlyOwner {
        require(_farm != address(0), "Invalid farm address");
        require(isFarmFromFactory[_farm], "Not a farm from this factory");
        require(!blacklistedFarms[_farm], "Farm is blacklisted");
        
        // 调用Farm的升级函�?
        FarmUpgradeableV2(_farm).upgradeTo(farmImplementation);
        
        emit FarmUpgraded(_farm, farmImplementation);
    }
    
    /// @notice Upgrades multiple farms at once
    /// @dev Only callable by the owner
    /// @param _farms Array of farm addresses
    function batchUpgradeFarms(address[] calldata _farms) external onlyOwner {
        require(_farms.length > 0, "Empty farms array");
        
        for (uint256 i = 0; i < _farms.length; i++) {
            address farm = _farms[i];
            
            if (
                farm != address(0) && 
                isFarmFromFactory[farm] && 
                !blacklistedFarms[farm]
            ) {
                // 调用Farm的升级函�?
                FarmUpgradeableV2(farm).upgradeTo(farmImplementation);
                emit FarmUpgraded(farm, farmImplementation);
            }
        }
    }
    
    /// @notice Updates a farm's TVL (Total Value Locked)
    /// @dev Can be called by the farm or owner
    /// @param _farm Farm address
    /// @param _tvl New TVL value
    function updateFarmTVL(address _farm, uint256 _tvl) external {
        require(msg.sender == _farm || msg.sender == owner(), "Not authorized");
        require(isFarmFromFactory[_farm], "Not a farm from this factory");
        
        farmInfo[_farm].tvl = _tvl;
        emit FarmTVLUpdated(_farm, _tvl);
    }
    
    /// @notice Updates a farm's user count
    /// @dev Can be called by the farm or owner
    /// @param _farm Farm address
    /// @param _userCount New user count
    function updateFarmUserCount(address _farm, uint256 _userCount) external {
        require(msg.sender == _farm || msg.sender == owner(), "Not authorized");
        require(isFarmFromFactory[_farm], "Not a farm from this factory");
        
        farmInfo[_farm].userCount = _userCount;
        emit FarmUserCountUpdated(_farm, _userCount);
    }
    
    /// @notice Gets farms by category
    /// @param _category Category identifier
    /// @return farms Array of farm addresses in the category
    function getFarmsByCategory(address _category) external view returns (address[] memory) {
        return categoryFarms[_category];
    }
    
    /// @notice Gets all farm categories
    /// @return categories Array of category identifiers
    function getAllCategories() external view returns (address[] memory) {
        return farmCategories;
    }
    
    /// @notice Gets total number of farms
    /// @return Total farm count
    function getTotalFarmCount() external view returns (uint256) {
        return allFarms.length;
    }
    
    /// @notice Gets platform-wide statistics
    /// @return totalFarms Total farm count
    /// @return totalTVL Total value locked across all farms
    /// @return userCount Total unique users across all farms (may count duplicates)
    function getPlatformStats() external view returns (
        uint256 totalFarms,
        uint256 totalTVL,
        uint256 userCount
    ) {
        totalFarms = allFarms.length;
        totalTVL = 0;
        userCount = 0;
        
        for (uint256 i = 0; i < allFarms.length; i++) {
            if (!blacklistedFarms[allFarms[i]]) {
                FarmInfo storage info = farmInfo[allFarms[i]];
                totalTVL += info.tvl;
                userCount += info.userCount;
            }
        }
        
        return (totalFarms, totalTVL, userCount);
    }
    
    /// @notice Function that allows the contract to be upgraded
    /// @dev Only callable by the owner
    /// @param newImplementation Address of the new implementation
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        emit Upgraded(newImplementation);
    }
    
    /// @notice Returns the current contract version
    /// @return Version string
    function version() public pure virtual returns (string memory) {
        return "2.0.0";
    }
} 
