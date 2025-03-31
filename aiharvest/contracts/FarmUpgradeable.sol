// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
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
contract FarmUpgradeable is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable,
    UUPSUpgradeable,
    IFarmUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
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
    }

    IERC20Upgradeable public stakingToken;
    IERC20Upgradeable public rewardToken;
    uint256 public lockPeriod;
    address public treasury;
    PoolInfo public pool;
    mapping(address => UserInfo) public userInfo;
    uint256 public totalAllocPoint;
    
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
    event Upgraded(address indexed implementation);
    
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
    /// @param _treasury Treasury address that receives fees
    function initialize(
        address _rewardToken,
        address _stakingToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _lockPeriod,
        address _treasury
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        require(_rewardToken != address(0), "Reward token cannot be zero address");
        require(_stakingToken != address(0), "Staking token cannot be zero address");
        require(_treasury != address(0), "Treasury cannot be zero address");
        
        rewardToken = IERC20Upgradeable(_rewardToken);
        stakingToken = IERC20Upgradeable(_stakingToken);
        lockPeriod = _lockPeriod;
        treasury = _treasury;
        
        // Initialize pool
        pool.accRewardPerShare = 0;
        pool.totalStaked = 0;
        pool.lastRewardBlock = block.number > _startBlock ? block.number : _startBlock;
        pool.startBlock = _startBlock;
        pool.rewardPerBlock = _rewardPerBlock;
    }

    // 设置工厂地址
    function setFactoryAddress(address _factoryAddress) external onlyOwner {
        if (_factoryAddress == address(0)) revert("Invalid factory address");
        address oldAddress = address(this);
        // Assuming the contract address is used as the factory address
        emit FactoryAddressUpdated(oldAddress, _factoryAddress);
    }

    // 添加新的LP池
    function addPool(IERC20Upgradeable _lpToken, uint256 _allocPoint) external onlyOwner {
        if (address(_lpToken) == address(0)) revert("Invalid LP token address");
        if (lpTokenAdded[address(_lpToken)]) revert PoolAlreadyExists(address(_lpToken));
        
        _updateAllPools();
        totalAllocPoint += _allocPoint;
        
        uint256 pid = poolInfo.length;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardTime: block.timestamp > startTime ? block.timestamp : startTime,
            accRewardPerShare: 0
        }));
        
        lpTokenAdded[address(_lpToken)] = true;
        emit PoolAdded(pid, address(_lpToken), _allocPoint);
    }

    // 更新分配点数
    function setAllocationPoint(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        
        _updateAllPools();
        uint256 oldAllocPoint = poolInfo[_pid].allocPoint;
        totalAllocPoint = totalAllocPoint - oldAllocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        
        emit AllocationPointUpdated(_pid, oldAllocPoint, _allocPoint);
    }

    // 存入LP代币
    function deposit(uint256 _amount) public override nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");
        
        UserInfo storage user = userInfo[msg.sender];
        
        // Update pool and harvest any pending rewards
        updatePool();
        
        if (user.amount > 0) {
            uint256 pending = user.amount * pool.accRewardPerShare / PRECISION_FACTOR - user.rewardDebt;
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending);
                emit Harvest(msg.sender, pending);
            }
        }
        
        // Transfer staking tokens from user
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update user info
        user.amount += _amount;
        user.rewardDebt = user.amount * pool.accRewardPerShare / PRECISION_FACTOR;
        user.lastDepositTime = block.timestamp;
        
        // Update pool total staked amount
        pool.totalStaked += _amount;
        
        emit Deposit(msg.sender, _amount);
    }

    // 提取LP代币
    function withdraw(uint256 _amount) public override nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= _amount, "Insufficient balance");
        
        // Check lock period
        if (_amount > 0) {
            require(
                block.timestamp >= user.lastDepositTime + lockPeriod,
                "Tokens are still locked"
            );
        }
        
        // Update pool and harvest any pending rewards
        updatePool();
        
        uint256 pending = user.amount * pool.accRewardPerShare / PRECISION_FACTOR - user.rewardDebt;
        
        if (_amount > 0) {
            user.amount -= _amount;
            stakingToken.safeTransfer(msg.sender, _amount);
            pool.totalStaked -= _amount;
            emit Withdraw(msg.sender, _amount);
        }
        
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
            emit Harvest(msg.sender, pending);
        }
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / PRECISION_FACTOR;
    }

    // 复投功能 - 直接将奖励再次质押
    function compound(uint256 _pid) external nonReentrant whenNotPaused {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        _updatePool(_pid);
        
        // 计算待领取的奖励
        uint256 pending = (user.amount * pool.accRewardPerShare / 1e12) - user.rewardDebt;
        
        if (pending == 0) revert NoRewardsToCompound();
        if (user.amount == 0) revert NoStakedTokens();
        
        // 检查合约中是否有足够的奖励代币
        uint256 rewardBalance = rewardToken.balanceOf(address(this));
        if (rewardBalance < pending) revert InsufficientRewardBalance(pending, rewardBalance);
        
        if (address(rewardToken) == address(pool.lpToken)) {
            // 如果奖励代币就是LP代币，直接增加质押量
            user.amount += pending;
        } else {
            // 如果不是LP代币，需要先将奖励代币转换为LP代币
            // 这里应该实现具体的转换逻辑，比如通过DEX进行兑换
            revert TokenConversionNotSupported();
        }
        
        // 更新奖励债务
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        
        // 更新解锁时间
        user.unlockTime = block.timestamp + 1 days; // 设置24小时锁定期
        
        emit Compound(msg.sender, _pid, pending);
    }

    // 内部函数
    function _updatePool(uint256 _pid) internal {
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

    function _updateAllPools() internal {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            _updatePool(pid);
        }
    }

    function _safeRewardTransfer(address _to, uint256 _amount) internal {
        if (_to == address(0)) revert("Invalid recipient address");
        if (_amount == 0) return;
        
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        uint256 transferAmount = _amount > rewardBal ? rewardBal : _amount;
        
        bool success = rewardToken.transfer(_to, transferAmount);
        if (!success) {
            emit RewardTransferFailed(_to, transferAmount);
            revert TransferFailed();
        }
    }

    // 查询函数
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function pendingReward(address _user) public view override returns (uint256) {
        UserInfo storage user = userInfo[_user];
        
        if (block.number <= pool.lastRewardBlock || pool.totalStaked == 0) {
            return user.amount * pool.accRewardPerShare / PRECISION_FACTOR - user.rewardDebt;
        }
        
        uint256 blocksSinceLastReward = block.number - pool.lastRewardBlock;
        uint256 rewards = blocksSinceLastReward * pool.rewardPerBlock;
        uint256 adjustedPerShare = pool.accRewardPerShare + ((rewards * PRECISION_FACTOR) / pool.totalStaked);
        
        return user.amount * adjustedPerShare / PRECISION_FACTOR - user.rewardDebt;
    }

    // 紧急提取
    function emergencyWithdraw() public override nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        uint256 amount = user.amount;
        require(amount > 0, "No tokens staked");
        
        user.amount = 0;
        user.rewardDebt = 0;
        
        stakingToken.safeTransfer(msg.sender, amount);
        pool.totalStaked -= amount;
        
        emit EmergencyWithdraw(msg.sender, amount);
    }
    
    // 暂停合约 - 只有所有者可以调用
    function pause() external onlyOwner {
        _pause();
    }
    
    // 恢复合约 - 只有所有者可以调用
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // 设置结束时间 - 只有所有者可以调用
    function setEndTime(uint256 _endTime) external onlyOwner {
        if (_endTime <= block.timestamp) revert("End time must be in the future");
        if (_endTime <= startTime) revert("End time must be after start time");
        
        endTime = _endTime;
    }
    
    // 更新奖励速率 - 只有所有者可以调用
    function updateRewardPerSecond(uint256 _rewardPerSecond) external onlyOwner {
        if (_rewardPerSecond == 0) revert InvalidRewardRate(_rewardPerSecond);
        
        _updateAllPools();
        rewardPerSecond = _rewardPerSecond;
    }
    
    /// @notice Function that allows the contract to be upgraded
    /// @dev Only callable by the owner
    /// @param newImplementation Address of the new implementation
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        emit Upgraded(newImplementation);
    }
    
    /// @notice Returns the current contract version
    /// @return Version string
    function version() public pure override returns (string memory) {
        return "1.0.0";
    }

    function updatePool() public {
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        
        if (pool.totalStaked == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        
        uint256 blocksSinceLastReward = block.number - pool.lastRewardBlock;
        uint256 rewards = blocksSinceLastReward * pool.rewardPerBlock;
        
        pool.accRewardPerShare += (rewards * PRECISION_FACTOR) / pool.totalStaked;
        pool.lastRewardBlock = block.number;
    }

    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        
        if (_amount > rewardBal) {
            rewardToken.safeTransfer(_to, rewardBal);
        } else {
            rewardToken.safeTransfer(_to, _amount);
        }
    }
} 