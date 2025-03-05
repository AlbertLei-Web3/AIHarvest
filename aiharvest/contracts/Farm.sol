// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

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

contract Farm is Ownable, ReentrancyGuard, Pausable {
    // 状态变量
    struct UserInfo {
        uint256 amount;         // LP代币数量
        uint256 rewardDebt;     // 已结算的奖励债务
        uint256 unlockTime;     // 解锁时间
    }

    struct PoolInfo {
        IERC20 lpToken;         // LP代币合约地址
        uint256 allocPoint;     // 分配权重
        uint256 lastRewardTime; // 最后更新奖励的时间
        uint256 accRewardPerShare; // 每份LP的累计奖励
    }

    IERC20 public rewardToken;  // 奖励代币
    uint256 public rewardPerSecond; // 每秒奖励数量
    uint256 public startTime;   // 开始时间
    uint256 public endTime;     // 结束时间
    address public factoryAddress; // 工厂合约地址

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    uint256 public totalAllocPoint;
    
    // 用于跟踪LP代币地址是否已添加到池中
    mapping(address => bool) public lpTokenAdded;

    // 事件
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Compound(address indexed user, uint256 indexed pid, uint256 amount); // 复投事件
    event PoolAdded(uint256 indexed pid, address indexed lpToken, uint256 allocPoint);
    event AllocationPointUpdated(uint256 indexed pid, uint256 oldAllocPoint, uint256 newAllocPoint);
    event FactoryAddressUpdated(address oldAddress, address newAddress);
    event RewardTransferFailed(address to, uint256 amount);


    constructor(
        IERC20 _rewardToken,
        uint256 _rewardPerSecond,
        uint256 _startTime,
        address _factoryAddress
    ) Ownable(msg.sender) {
        if (address(_rewardToken) == address(0)) revert("Invalid reward token address");
        if (_rewardPerSecond == 0) revert InvalidRewardRate(_rewardPerSecond);
        if (_startTime < block.timestamp) revert InvalidStartTime(_startTime);
        if (_factoryAddress == address(0)) revert("Invalid factory address");
        
        rewardToken = _rewardToken;
        rewardPerSecond = _rewardPerSecond;
        startTime = _startTime;
        factoryAddress = _factoryAddress;
    }

    // 设置工厂地址
    function setFactoryAddress(address _factoryAddress) external onlyOwner {
        if (_factoryAddress == address(0)) revert("Invalid factory address");
        address oldAddress = factoryAddress;
        factoryAddress = _factoryAddress;
        emit FactoryAddressUpdated(oldAddress, _factoryAddress);
    }

    // 添加新的LP池
    function addPool(IERC20 _lpToken, uint256 _allocPoint) external onlyOwner {
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
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        _updatePool(_pid);
        
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accRewardPerShare / 1e12) - user.rewardDebt;
            if (pending > 0) {
                _safeRewardTransfer(msg.sender, pending);
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
            
            // 设置锁定期（如果需要）
            user.unlockTime = block.timestamp + 1 days; // 设置24小时锁定期
        }
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }

    // 提取LP代币
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        if (_amount == 0) revert ZeroAmount();
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        if (user.amount < _amount) revert InsufficientBalance(_amount, user.amount);
        if (block.timestamp < user.unlockTime) revert TokensLocked(user.unlockTime, block.timestamp);

        _updatePool(_pid);
        uint256 pending = (user.amount * pool.accRewardPerShare / 1e12) - user.rewardDebt;
        
        if (pending > 0) {
            _safeRewardTransfer(msg.sender, pending);
        }
        
        // 执行转账前保存余额
        uint256 beforeBalance = pool.lpToken.balanceOf(msg.sender);
        
        user.amount -= _amount;
        bool success = pool.lpToken.transfer(msg.sender, _amount);
        if (!success) revert TransferFailed();
        
        // 验证转账成功
        uint256 afterBalance = pool.lpToken.balanceOf(msg.sender);
        if (afterBalance <= beforeBalance) revert("Token transfer failed");
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
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

    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        if (_user == address(0)) revert("Invalid user address");
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));

        if (block.timestamp > pool.lastRewardTime && lpSupply != 0) {
            uint256 multiplier = block.timestamp - pool.lastRewardTime;
            uint256 reward = multiplier * rewardPerSecond * pool.allocPoint / totalAllocPoint;
            accRewardPerShare += reward * 1e12 / lpSupply;
        }
        
        return (user.amount * accRewardPerShare / 1e12) - user.rewardDebt;
    }

    // 紧急提取
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        if (_pid >= poolInfo.length) revert InvalidPoolId(_pid);
        
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        uint256 amount = user.amount;
        if (amount == 0) revert("No tokens to withdraw");
        
        // 执行转账前保存余额
        uint256 beforeBalance = pool.lpToken.balanceOf(msg.sender);
        
        user.amount = 0;
        user.rewardDebt = 0;
        
        bool success = pool.lpToken.transfer(msg.sender, amount);
        if (!success) revert TransferFailed();
        
        // 验证转账成功
        uint256 afterBalance = pool.lpToken.balanceOf(msg.sender);
        if (afterBalance <= beforeBalance) revert("Token transfer failed");
        
        emit EmergencyWithdraw(msg.sender, _pid, amount);
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
} 