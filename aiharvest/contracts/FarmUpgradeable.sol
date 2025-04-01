// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IFarmUpgradeable.sol";

// 自定义错误
error InvalidPoolId(uint256 pid);
error InsufficientBalance(uint256 requested, uint256 available);
error TokensLocked(uint256 unlockTime, uint256 currentTime);
error ZeroAmount();
error NoRewardsToCompound();
error NoStakedTokens();
error InsufficientRewardBalance(uint256 requested, uint256 available);
error TokenConversionNotSupported();
error PoolAlreadyExists(address lpToken);
error TransferFailed();
error InvalidStartTime(uint256 startTime);
error InvalidRewardRate(uint256 rewardRate);

/// @title Upgradeable Farm Contract for AI Harvest
/// @notice Manages yield farming pools with staking and rewards
/// @dev Uses the UUPS proxy pattern for upgradeability
abstract contract FarmUpgradeable is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable,
    UUPSUpgradeable,
    IFarmUpgradeable
{
    using SafeERC20 for IERC20;
    
    // Precision factor for calculations
    uint256 private constant PRECISION_FACTOR = 1e12;
    
    // 状态变量
    struct UserInfo {
        uint256 amount;             // Amount of tokens staked
        uint256 rewardDebt;         // Reward debt
        uint256 lastDepositTime;    // Last time the user deposited
    }

    struct PoolInfo {
        uint256 totalStaked;            // Total amount of tokens staked
        uint256 accRewardPerShare;      // Accumulated rewards per share, scaled by PRECISION_FACTOR
        uint256 lastRewardBlock;        // Last block number when rewards were calculated
        uint256 startBlock;             // Block number when rewards start
        uint256 rewardPerBlock;         // Rewards per block
        uint256 allocPoint;             // Allocation points
        address lpToken;                // LP token address
        uint256 lastRewardTime;         // Last reward timestamp
    }

    IERC20 public stakingToken;
    IERC20 public rewardToken;
    uint256 public lockPeriod;
    address public treasury;
    PoolInfo public mainPoolInfo;  // Renamed from poolInfo to mainPoolInfo
    mapping(address => UserInfo) public userInfoMap;  // Renamed from userInfo to userInfoMap
    uint256 public totalAllocPoint;
    uint256 public rewardPerSecond;
    uint256 public startTime;
    uint256 public endTime;
    
    // Array of pool infos
    PoolInfo[] private _poolInfos;
    
    // 用于跟踪LP代币地址是否已添加到池中
    mapping(address => bool) public lpTokenAdded;

    // 事件
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Harvest(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RewardPerBlockUpdated(uint256 oldValue, uint256 newValue);
    event LockPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event PoolAdded(uint256 indexed pid, address indexed lpToken, uint256 allocPoint);
    event AllocationPointUpdated(uint256 indexed pid, uint256 oldAllocPoint, uint256 newAllocPoint);
    event FactoryAddressUpdated(address oldAddress, address newAddress);
    event RewardTransferFailed(address to, uint256 amount);
    event CompoundEvent(address indexed user, uint256 indexed pid, uint256 amount);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract, replacing the constructor for upgradeable contracts
    /// @param _rewardToken Reward token address
    /// @param _stakingToken Token to be staked
    /// @param _rewardPerBlock Amount of reward tokens distributed per block
    /// @param _startBlock Block number when rewards start
    /// @param _lockPeriod Duration in seconds for the lock period
    /// @param _owner Owner of the farm
    /// @param _treasury Treasury address that receives fees
    function initialize(
        address _rewardToken,
        address _stakingToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _lockPeriod,
        address _owner,
        address _treasury
    ) public virtual override initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        require(_rewardToken != address(0), "Reward token cannot be zero address");
        require(_stakingToken != address(0), "Staking token cannot be zero address");
        require(_treasury != address(0), "Treasury cannot be zero address");
        
        rewardToken = IERC20(_rewardToken);
        stakingToken = IERC20(_stakingToken);
        lockPeriod = _lockPeriod;
        treasury = _treasury;
        rewardPerSecond = _rewardPerBlock; // Using as rewardPerSecond for consistency
        startTime = block.timestamp;
        
        // Initialize pool
        mainPoolInfo.accRewardPerShare = 0;
        mainPoolInfo.totalStaked = 0;
        mainPoolInfo.lastRewardBlock = block.number > _startBlock ? block.number : _startBlock;
        mainPoolInfo.startBlock = _startBlock;
        mainPoolInfo.rewardPerBlock = _rewardPerBlock;
        
        // Transfer ownership if owner is specified
        if (_owner != address(0) && _owner != msg.sender) {
            transferOwnership(_owner);
        }
    }
    
    /// @dev Returns the current version of the contract
    /// @return Current version string
    function version() public pure virtual override returns (string memory) {
        return "1.0.0";
    }

    // 设置工厂地址
    function setFactoryAddress(address _factoryAddress) external onlyOwner {
        if (_factoryAddress == address(0)) revert("Invalid factory address");
        address oldAddress = address(this);
        // Assuming the contract address is used as the factory address
        emit FactoryAddressUpdated(oldAddress, _factoryAddress);
    }

    // 添加新的LP池
    function addPool(IERC20 _lpToken, uint256 _allocPoint) external onlyOwner {
        if (address(_lpToken) == address(0)) revert("Invalid LP token address");
        if (lpTokenAdded[address(_lpToken)]) revert PoolAlreadyExists(address(_lpToken));
        
        _updateAllPools();
        totalAllocPoint += _allocPoint;
        
        uint256 pid = _poolInfos.length;
        _poolInfos.push(PoolInfo({
            totalStaked: 0,
            accRewardPerShare: 0,
            lastRewardBlock: block.number,
            startBlock: block.number,
            rewardPerBlock: 0,
            allocPoint: _allocPoint,
            lpToken: address(_lpToken),
            lastRewardTime: block.timestamp > startTime ? block.timestamp : startTime
        }));
        
        lpTokenAdded[address(_lpToken)] = true;
        emit PoolAdded(pid, address(_lpToken), _allocPoint);
    }

    // 更新分配点数
    function setAllocationPoint(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        if (_pid >= _poolInfos.length) revert InvalidPoolId(_pid);
        
        _updateAllPools();
        uint256 oldAllocPoint = _poolInfos[_pid].allocPoint;
        totalAllocPoint = totalAllocPoint - oldAllocPoint + _allocPoint;
        _poolInfos[_pid].allocPoint = _allocPoint;
        
        emit AllocationPointUpdated(_pid, oldAllocPoint, _allocPoint);
    }

    // 存入LP代币
    function deposit(uint256 _amount) public virtual override nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");
        
        UserInfo storage user = userInfoMap[msg.sender];
        
        // Update pool and harvest any pending rewards
        updatePool();
        
        if (user.amount > 0) {
            uint256 pending = user.amount * mainPoolInfo.accRewardPerShare / PRECISION_FACTOR - user.rewardDebt;
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending);
                emit Harvest(msg.sender, pending);
            }
        }
        
        // Transfer staking tokens from user
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update user info
        user.amount += _amount;
        user.rewardDebt = user.amount * mainPoolInfo.accRewardPerShare / PRECISION_FACTOR;
        user.lastDepositTime = block.timestamp;
        
        // Update pool info
        mainPoolInfo.totalStaked += _amount;
        
        emit Deposit(msg.sender, _amount);
    }
    
    // 提取LP代币
    function withdraw(uint256 _amount) public virtual override nonReentrant {
        UserInfo storage user = userInfoMap[msg.sender];
        require(user.amount >= _amount, "Withdraw: not enough staked");
        
        // Check if tokens are locked
        if (_amount > 0 && block.timestamp < user.lastDepositTime + lockPeriod) {
            revert TokensLocked(user.lastDepositTime + lockPeriod, block.timestamp);
        }
        
        // Update pool and harvest any pending rewards
        updatePool();
        
        // Calculate pending rewards
        uint256 pending = user.amount * mainPoolInfo.accRewardPerShare / PRECISION_FACTOR - user.rewardDebt;
        
        if (_amount > 0) {
            user.amount -= _amount;
            stakingToken.safeTransfer(msg.sender, _amount);
            mainPoolInfo.totalStaked -= _amount;
        }
        
        // Update reward debt
        user.rewardDebt = user.amount * mainPoolInfo.accRewardPerShare / PRECISION_FACTOR;
        
        // Send rewards if any
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
            emit Harvest(msg.sender, pending);
        }
        
        emit Withdraw(msg.sender, _amount);
    }
    
    // 收获奖励但不提取质押代币
    function harvest() public virtual override nonReentrant {
        UserInfo storage user = userInfoMap[msg.sender];
        require(user.amount > 0, "Nothing staked");
        
        // Update pool
        updatePool();
        
        // Calculate pending rewards
        uint256 pending = user.amount * mainPoolInfo.accRewardPerShare / PRECISION_FACTOR - user.rewardDebt;
        require(pending > 0, "No rewards to harvest");
        
        // Update reward debt
        user.rewardDebt = user.amount * mainPoolInfo.accRewardPerShare / PRECISION_FACTOR;
        
        // Send rewards
        safeRewardTransfer(msg.sender, pending);
        
        emit Harvest(msg.sender, pending);
    }
    
    // 在紧急情况下提取，放弃奖励
    function emergencyWithdraw() public virtual override nonReentrant {
        UserInfo storage user = userInfoMap[msg.sender];
        uint256 amount = user.amount;
        require(amount > 0, "Nothing to withdraw");
        
        // Reset user data
        user.amount = 0;
        user.rewardDebt = 0;
        
        // Update pool info
        mainPoolInfo.totalStaked -= amount;
        
        // Transfer tokens back to user
        stakingToken.safeTransfer(msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    // 查询用户待领取的奖励
    function pendingReward(address _user) public view virtual override returns (uint256) {
        UserInfo storage user = userInfoMap[_user];
        if (user.amount == 0) {
            return 0;
        }
        
        uint256 accRewardPerShare = mainPoolInfo.accRewardPerShare;
        
        // If current block is greater than last reward block and there are staked tokens
        if (block.number > mainPoolInfo.lastRewardBlock && mainPoolInfo.totalStaked > 0) {
            uint256 multiplier = block.number - mainPoolInfo.lastRewardBlock;
            uint256 reward = multiplier * mainPoolInfo.rewardPerBlock;
            accRewardPerShare += reward * PRECISION_FACTOR / mainPoolInfo.totalStaked;
        }
        
        return user.amount * accRewardPerShare / PRECISION_FACTOR - user.rewardDebt;
    }
    
    // 用于接口兼容
    function userInfo(address _user) external view override returns (
        uint256 amount,
        uint256 rewardDebt,
        uint256 lastDepositTime
    ) {
        UserInfo storage user = userInfoMap[_user];
        return (user.amount, user.rewardDebt, user.lastDepositTime);
    }
    
    // 用于接口兼容
    function poolInfo() external view override returns (
        uint256 totalStaked,
        uint256 accRewardPerShare,
        uint256 lastRewardBlock,
        uint256 startBlock,
        uint256 rewardPerBlock
    ) {
        return (
            mainPoolInfo.totalStaked,
            mainPoolInfo.accRewardPerShare,
            mainPoolInfo.lastRewardBlock,
            mainPoolInfo.startBlock,
            mainPoolInfo.rewardPerBlock
        );
    }
    
    // 更新每区块奖励
    function updateRewardPerBlock(uint256 _rewardPerBlock) public virtual override onlyOwner {
        updatePool();
        uint256 oldValue = mainPoolInfo.rewardPerBlock;
        mainPoolInfo.rewardPerBlock = _rewardPerBlock;
        emit RewardPerBlockUpdated(oldValue, _rewardPerBlock);
    }
    
    // 更新锁定期
    function updateLockPeriod(uint256 _lockPeriod) public virtual override onlyOwner {
        uint256 oldPeriod = lockPeriod;
        lockPeriod = _lockPeriod;
        emit LockPeriodUpdated(oldPeriod, _lockPeriod);
    }
    
    // 更新奖励池
    function updatePool() public {
        if (block.number <= mainPoolInfo.lastRewardBlock) {
            return;
        }
        
        if (mainPoolInfo.totalStaked == 0) {
            mainPoolInfo.lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = block.number - mainPoolInfo.lastRewardBlock;
        uint256 reward = multiplier * mainPoolInfo.rewardPerBlock;
        
        // Update accRewardPerShare
        mainPoolInfo.accRewardPerShare += reward * PRECISION_FACTOR / mainPoolInfo.totalStaked;
        mainPoolInfo.lastRewardBlock = block.number;
    }
    
    // 安全发送奖励代币
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBalance = rewardToken.balanceOf(address(this));
        if (_amount > rewardBalance) {
            rewardToken.safeTransfer(_to, rewardBalance);
            emit RewardTransferFailed(_to, _amount - rewardBalance);
        } else {
            rewardToken.safeTransfer(_to, _amount);
        }
    }
    
    // 更新多个池子
    function _updateAllPools() internal {
        uint256 length = _poolInfos.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            _updatePool(pid);
        }
    }
    
    // 更新单个池子
    function _updatePool(uint256 _pid) internal {
        PoolInfo storage poolItem = _poolInfos[_pid]; // Changed variable name to avoid shadowing
        
        if (block.timestamp <= poolItem.lastRewardTime) {
            return;
        }
        
        uint256 lpSupply = IERC20(poolItem.lpToken).balanceOf(address(this));
        if (lpSupply == 0 || poolItem.allocPoint == 0) {
            poolItem.lastRewardTime = block.timestamp;
            return;
        }
        
        uint256 multiplier = block.timestamp - poolItem.lastRewardTime;
        uint256 reward = multiplier * rewardPerSecond * poolItem.allocPoint / totalAllocPoint;
        
        poolItem.accRewardPerShare += reward * PRECISION_FACTOR / lpSupply;
        poolItem.lastRewardTime = block.timestamp;
    }
    
    // 复投奖励
    function compound(uint256 _pid) external nonReentrant {
        PoolInfo storage poolItem = _poolInfos[_pid]; // Changed variable name to avoid shadowing
        UserInfo storage user = userInfoMap[msg.sender];
        
        _updatePool(_pid);
        
        if (user.amount == 0) {
            revert NoStakedTokens();
        }
        
        uint256 pending = user.amount * poolItem.accRewardPerShare / PRECISION_FACTOR - user.rewardDebt;
        if (pending == 0) {
            revert NoRewardsToCompound();
        }
        
        // Update reward debt before compounding
        user.rewardDebt = user.amount * poolItem.accRewardPerShare / PRECISION_FACTOR;
        
        // Convert reward tokens to staking tokens if needed
        // This is a simplified example, actual conversion logic may be different
        uint256 convertedAmount = pending; // Assume 1:1 conversion for example
        
        // Add converted amount to user's stake
        user.amount += convertedAmount;
        user.rewardDebt = user.amount * poolItem.accRewardPerShare / PRECISION_FACTOR;
        
        emit CompoundEvent(msg.sender, _pid, convertedAmount);
    }
    
    // UUPS Upgrade authorization function
    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {
        // Additional upgrade restrictions can be added here
    }
} 
