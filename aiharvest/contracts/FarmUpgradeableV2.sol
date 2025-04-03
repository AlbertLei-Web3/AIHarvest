// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

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
error InvalidBoostFee();
error InsufficientUnlockFee(uint256 provided, uint256 required);
error NoLockedTokens();

/// @title Upgradeable Farm Contract V2 for AI Harvest
/// @notice Manages yield farming pools with enhanced staking and rewards
/// @dev V2 adds early unlock and reward boost capabilities
contract FarmUpgradeableV2 is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable,
    UUPSUpgradeable
{
    // 状态变量
    struct UserInfo {
        uint256 amount;         // LP代币数量
        uint256 rewardDebt;     // 已结算的奖励债务
        uint256 unlockTime;     // 解锁时间
        uint256 boostEndTime;   // 奖励提升结束时间
        uint256 boostMultiplier; // 奖励倍数 (100 = 1x)
    }

    struct PoolInfo {
        IERC20 lpToken;     // LP代币合约地址
        uint256 allocPoint;     // 分配权重
        uint256 lastRewardTime; // 最后更新奖励的时间
        uint256 accRewardPerShare; // 每份LP的累计奖励
        uint256 lockDuration;   // 锁定期（秒）
        uint256 earlyUnlockFeePercent; // 提前解锁费用百分比(100 = 1%)
    }

    IERC20 public rewardToken;  // 奖励代币
    uint256 public rewardPerSecond; // 每秒奖励数量
    uint256 public startTime;   // 开始时间
    uint256 public endTime;     // 结束时间
    address public factoryAddress; // 工厂合约地址
    
    // V2新增状态变量
    address public treasury;    // 国库地址，收取提前解锁费用
    uint256 public boostFeesCollected; // 已收集的加速费用
    uint256 public unlockFeesCollected; // 已收集的提前解锁费用
    mapping(uint256 => bool) public boostEnabled; // 池子是否支持奖励加速
    
    // 奖励加速费率配置
    struct BoostConfig {
        uint256 minDuration;    // 最小加速期
        uint256 maxDuration;    // 最大加速期
        uint256 minMultiplier;  // 最小倍率 (100 = 1x)
        uint256 maxMultiplier;  // 最大倍率
        uint256 feePercentPerPoint; // 每点倍率的费用百分比
    }
    
    mapping(uint256 => BoostConfig) public poolBoostConfig; // 每个池子的奖励加速配置

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    uint256 public totalAllocPoint;
    
    // 用于跟踪LP代币地址是否已添加到池中
    mapping(address => bool) public lpTokenAdded;

    // 事件
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Compound(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 indexed pid, address indexed lpToken, uint256 allocPoint);
    event AllocationPointUpdated(uint256 indexed pid, uint256 oldAllocPoint, uint256 newAllocPoint);
    event FactoryAddressUpdated(address oldAddress, address newAddress);
    event RewardTransferFailed(address to, uint256 amount);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event PoolLockDurationUpdated(uint256 indexed pid, uint256 oldDuration, uint256 newDuration);
    event PoolUnlockFeeUpdated(uint256 indexed pid, uint256 oldFee, uint256 newFee);
    event BoostConfigUpdated(uint256 indexed pid);
    event BoostEnabledStatusChanged(uint256 indexed pid, bool status);
    event RewardBoosted(address indexed user, uint256 indexed pid, uint256 duration, uint256 multiplier, uint256 fee);
    event EarlyUnlock(address indexed user, uint256 indexed pid, uint256 unlockFee);
    event FeesWithdrawn(address indexed token, address indexed to, uint256 amount);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract (already implemented in V1)
    function initialize(
        address _rewardToken,
        address _stakingToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _lockPeriod,
        address _owner,
        address _treasury
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        if (_rewardToken == address(0)) revert("Invalid reward token address");
        if (_stakingToken == address(0)) revert("Invalid staking token address");
        if (_rewardPerBlock == 0) revert InvalidRewardRate(_rewardPerBlock);
        if (_treasury == address(0)) revert("Invalid treasury address");
        
        rewardToken = IERC20(_rewardToken);
        startTime = block.timestamp;
        rewardPerSecond = _rewardPerBlock;
        factoryAddress = msg.sender;
        treasury = _treasury;
        
        // 初始化第一个质押池
        PoolInfo memory newPool = PoolInfo({
            lpToken: IERC20(_stakingToken),
            allocPoint: 1000,
            lastRewardTime: block.timestamp > startTime ? block.timestamp : startTime,
            accRewardPerShare: 0,
            lockDuration: _lockPeriod,
            earlyUnlockFeePercent: 500 // 默认5%提前解锁费用
        });
        
        poolInfo.push(newPool);
        totalAllocPoint = 1000;
        lpTokenAdded[_stakingToken] = true;
        
        // 转移所有权
        if (_owner != address(0) && _owner != msg.sender) {
            transferOwnership(_owner);
        }
    }
    
    // V2新增或修改的函数
    
    /// @notice Sets the treasury address
    /// @dev Only callable by the owner
    /// @param _treasury New treasury address
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /// @notice Adds a new LP pool with additional lock duration and unlock fee parameters
    /// @dev Only callable by the owner
    /// @param _lpToken LP token contract
    /// @param _allocPoint Allocation points
    /// @param _lockDuration Lock duration in seconds
    /// @param _unlockFeePercent Early unlock fee percentage
    function addPoolV2(
        IERC20 _lpToken, 
        uint256 _allocPoint, 
        uint256 _lockDuration,
        uint256 _unlockFeePercent
    ) external onlyOwner {
        if (address(_lpToken) == address(0)) revert("Invalid LP token address");
        if (lpTokenAdded[address(_lpToken)]) revert PoolAlreadyExists(address(_lpToken));
        if (_unlockFeePercent > 5000) revert("Unlock fee too high"); // 最多0%
        
        updateAllPools();
        totalAllocPoint += _allocPoint;
        
        uint256 pid = poolInfo.length;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardTime: block.timestamp > startTime ? block.timestamp : startTime,
            accRewardPerShare: 0,
            lockDuration: _lockDuration,
            earlyUnlockFeePercent: _unlockFeePercent
        }));
        
        lpTokenAdded[address(_lpToken)] = true;
        emit PoolAdded(pid, address(_lpToken), _allocPoint);
    }
    
    /// @notice Updates lock duration for a pool
    /// @dev Only callable by the owner
    /// @param _pid Pool ID
    /// @param _lockDuration New lock duration in seconds
    function setPoolLockDuration(uint256 _pid, uint256 _lockDuration) external onlyOwner {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        
        uint256 oldDuration = poolInfo[_pid].lockDuration;
        poolInfo[_pid].lockDuration = _lockDuration;
        
        emit PoolLockDurationUpdated(_pid, oldDuration, _lockDuration);
    }
    
    /// @notice Updates early unlock fee for a pool
    /// @dev Only callable by the owner
    /// @param _pid Pool ID
    /// @param _unlockFeePercent New early unlock fee percentage
    function setPoolUnlockFee(uint256 _pid, uint256 _unlockFeePercent) external onlyOwner {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        if (_unlockFeePercent > 5000) revert("Unlock fee too high"); // 最多0%
        
        uint256 oldFee = poolInfo[_pid].earlyUnlockFeePercent;
        poolInfo[_pid].earlyUnlockFeePercent = _unlockFeePercent;
        
        emit PoolUnlockFeeUpdated(_pid, oldFee, _unlockFeePercent);
    }
    
    /// @notice Configures reward boost settings for a pool
    /// @dev Only callable by the owner
    /// @param _pid Pool ID
    /// @param _minDuration Minimum boost duration
    /// @param _maxDuration Maximum boost duration
    /// @param _minMultiplier Minimum reward multiplier (100 = 1x)
    /// @param _maxMultiplier Maximum reward multiplier
    /// @param _feePercentPerPoint Fee percentage per point of multiplier
    function configureBoost(
        uint256 _pid,
        uint256 _minDuration,
        uint256 _maxDuration,
        uint256 _minMultiplier,
        uint256 _maxMultiplier,
        uint256 _feePercentPerPoint
    ) external onlyOwner {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        if (_minDuration == 0 || _maxDuration == 0 || _maxDuration < _minDuration) revert("Invalid durations");
        if (_minMultiplier < 100 || _maxMultiplier <= _minMultiplier) revert("Invalid multipliers");
        if (_feePercentPerPoint == 0) revert InvalidBoostFee();
        
        poolBoostConfig[_pid] = BoostConfig({
            minDuration: _minDuration,
            maxDuration: _maxDuration,
            minMultiplier: _minMultiplier,
            maxMultiplier: _maxMultiplier,
            feePercentPerPoint: _feePercentPerPoint
        });
        
        emit BoostConfigUpdated(_pid);
    }
    
    /// @notice Enables or disables boost functionality for a pool
    /// @dev Only callable by the owner
    /// @param _pid Pool ID
    /// @param _enabled Whether boost should be enabled
    function setBoostEnabled(uint256 _pid, bool _enabled) external onlyOwner {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        boostEnabled[_pid] = _enabled;
        emit BoostEnabledStatusChanged(_pid, _enabled);
    }
    
    /// @notice Modified deposit function to apply lock duration from pool config
    /// @param _pid Pool ID
    /// @param _amount Amount to deposit
    function depositV2(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        if (user.amount > 0) {
            uint256 pending = pendingReward(_pid, msg.sender);
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending);
            }
        }
        
        if (_amount > 0) {
            // 检查用户余额
            uint256 balance = pool.lpToken.balanceOf(msg.sender);
            if (balance < _amount) revert InsufficientBalance(_amount, balance);
            
            // 检查授权额度
            uint256 allowance = pool.lpToken.allowance(msg.sender, address(this));
            if (allowance < _amount) revert("Insufficient allowance");
            
            // 转账前保存余额
            uint256 beforeBalance = pool.lpToken.balanceOf(address(this));
            
            // 执行转账
            bool success = pool.lpToken.transferFrom(msg.sender, address(this), _amount);
            if (!success) revert TransferFailed();
            
            // 验证转账成功
            uint256 afterBalance = pool.lpToken.balanceOf(address(this));
            if (afterBalance <= beforeBalance) revert("Token transfer failed");
            
            user.amount += _amount;
            
            // 使用池配置的锁定期
            user.unlockTime = block.timestamp + pool.lockDuration;
        }
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }
    
    /// @notice Allows users to apply a reward boost
    /// @param _pid Pool ID
    /// @param _duration Boost duration in seconds
    /// @param _requestedMultiplier Requested reward multiplier
    function boostReward(uint256 _pid, uint256 _duration, uint256 _requestedMultiplier) external nonReentrant whenNotPaused {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        if (!boostEnabled[_pid]) revert("Boost not enabled for this pool");
        
        UserInfo storage user = userInfo[_pid][msg.sender];
        if (user.amount == 0) revert NoStakedTokens();
        
        BoostConfig storage config = poolBoostConfig[_pid];
        
        // 验证参数
        if (_duration < config.minDuration || _duration > config.maxDuration) revert("Invalid boost duration");
        if (_requestedMultiplier < config.minMultiplier || _requestedMultiplier > config.maxMultiplier) revert("Invalid multiplier");
        
        // 计算费用
        uint256 extraMultiplier = _requestedMultiplier - 100; // 减去基础倍率(1x)
        uint256 feePercent = extraMultiplier * config.feePercentPerPoint;
        uint256 fee = (user.amount * feePercent) / 10000; // 费用百分比
        
        // 收取费用
        IERC20 token = rewardToken;
        require(token.balanceOf(msg.sender) >= fee, "Insufficient balance for fee");
        require(token.allowance(msg.sender, address(this)) >= fee, "Insufficient allowance for fee");
        
        bool success = token.transferFrom(msg.sender, address(this), fee);
        if (!success) revert TransferFailed();
        
        boostFeesCollected += fee;
        
        // 更新奖励状态
        updatePool(_pid);
        uint256 pending = pendingReward(_pid, msg.sender);
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
        }
        
        // 设置用户的加速信息
        user.boostMultiplier = _requestedMultiplier;
        user.boostEndTime = block.timestamp + _duration;
        user.rewardDebt = user.amount * poolInfo[_pid].accRewardPerShare / 1e12;
        
        emit RewardBoosted(msg.sender, _pid, _duration, _requestedMultiplier, fee);
    }
    
    /// @notice Allows users to unlock their tokens early by paying a fee
    /// @param _pid Pool ID
    function earlyUnlock(uint256 _pid) external nonReentrant {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        if (user.amount == 0) revert NoStakedTokens();
        if (block.timestamp >= user.unlockTime) revert("Tokens already unlocked");
        
        // 计算提前解锁费用
        uint256 unlockFee = (user.amount * pool.earlyUnlockFeePercent) / 10000;
        if (unlockFee == 0 && pool.earlyUnlockFeePercent > 0) {
            unlockFee = 1; // 至少收取1个token
        }
        
        // 收取费用
        IERC20 token = pool.lpToken;
        require(token.balanceOf(msg.sender) >= unlockFee, "Insufficient balance for unlock fee");
        require(token.allowance(msg.sender, address(this)) >= unlockFee, "Insufficient allowance for unlock fee");
        
        bool success = token.transferFrom(msg.sender, address(this), unlockFee);
        if (!success) revert TransferFailed();
        
        unlockFeesCollected += unlockFee;
        
        // 设置解锁时间为当前时间
        user.unlockTime = block.timestamp;
        
        emit EarlyUnlock(msg.sender, _pid, unlockFee);
    }
    
    /// @notice Withdraws collected fees to treasury
    /// @dev Only callable by the owner
    /// @param _token Token to withdraw
    /// @param _amount Amount to withdraw
    function withdrawFees(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(treasury != address(0), "Treasury not set");
        
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance >= _amount, "Insufficient balance");
        
        bool success = token.transfer(treasury, _amount);
        if (!success) revert TransferFailed();
        
        emit FeesWithdrawn(_token, treasury, _amount);
    }
    
    /// Internal function to update all pools
    function updateAllPools() internal {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }
    
    /// Update reward variables of the given pool
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }

        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }

        uint256 multiplier = block.timestamp - pool.lastRewardTime;
        uint256 reward = multiplier * rewardPerSecond * pool.allocPoint / totalAllocPoint;
        pool.accRewardPerShare += reward * 1e12 / lpSupply;
        pool.lastRewardTime = block.timestamp;
    }
    
    /// @notice Internal function to calculate pending rewards with boost
    /// @param _pid Pool ID
    /// @param _user User address
    /// @return Pending reward amount
    function pendingReward(uint256 _pid, address _user) public view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));

        if (block.timestamp > pool.lastRewardTime && lpSupply != 0) {
            uint256 multiplier = block.timestamp - pool.lastRewardTime;
            uint256 reward = multiplier * rewardPerSecond * pool.allocPoint / totalAllocPoint;
            accRewardPerShare += reward * 1e12 / lpSupply;
        }
        
        uint256 baseReward = (user.amount * accRewardPerShare / 1e12) - user.rewardDebt;
        
        // 应用奖励加速
        if (boostEnabled[_pid] && user.boostMultiplier > 100 && block.timestamp < user.boostEndTime) {
            return (baseReward * user.boostMultiplier) / 100;
        }
        
        return baseReward;
    }
    
    /// @notice Safe transfer function, just in case if rounding error causes contract to not have enough tokens
    /// @param _to Recipient address
    /// @param _amount Amount to transfer
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBalance = rewardToken.balanceOf(address(this));
        if (_amount > rewardBalance) {
            rewardToken.transfer(_to, rewardBalance);
        } else {
            rewardToken.transfer(_to, _amount);
        }
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
