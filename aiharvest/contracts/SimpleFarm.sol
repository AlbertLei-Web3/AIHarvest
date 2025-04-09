// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SimpleFarm is Ownable, ReentrancyGuard {
    struct UserInfo {
        uint256 amount;        // 质押的代币数量
        uint256 rewardDebt;    // 奖励债务
        uint256 unlockTime;    // 解锁时间
    }
    
    struct PoolInfo {
        IERC20 lpToken;        // LP代币合约地址
        uint256 allocPoint;    // 分配点数
        uint256 lastRewardTime; // 上次奖励时间
        uint256 accRewardPerShare; // 每股累计奖励
        uint256 lockDuration;  // 锁定期（秒）
    }
    
    IERC20 public rewardToken;  // 奖励代币
    uint256 public rewardPerSecond; // 每秒奖励
    uint256 public startTime;   // 开始时间
    address public treasury;    // 国库地址
    
    PoolInfo[] public poolInfo;
    mapping(address => UserInfo) public userInfo;
    uint256 public totalAllocPoint = 0;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    
    constructor(
        address _rewardToken,
        address _stakingToken,
        uint256 _rewardPerSecond,
        uint256 _startTime,
        uint256 _lockDuration,
        address _treasury
    ) {
        rewardToken = IERC20(_rewardToken);
        rewardPerSecond = _rewardPerSecond;
        startTime = _startTime;
        treasury = _treasury;
        
        // 创建默认质押池
        poolInfo.push(PoolInfo({
            lpToken: IERC20(_stakingToken),
            allocPoint: 1000,
            lastRewardTime: _startTime,
            accRewardPerShare: 0,
            lockDuration: _lockDuration
        }));
        
        totalAllocPoint = 1000;
    }
    
    // 计算待领取奖励
    function pendingReward(address _user) external view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        PoolInfo storage pool = poolInfo[0];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        
        if (block.timestamp > pool.lastRewardTime && lpSupply != 0) {
            uint256 multiplier = block.timestamp - pool.lastRewardTime;
            uint256 reward = multiplier * rewardPerSecond * pool.allocPoint / totalAllocPoint;
            accRewardPerShare = accRewardPerShare + (reward * 1e12 / lpSupply);
        }
        
        return (user.amount * accRewardPerShare / 1e12) - user.rewardDebt;
    }
    
    // 更新池子奖励
    function updatePool() public {
        PoolInfo storage pool = poolInfo[0];
        
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
        pool.accRewardPerShare = pool.accRewardPerShare + (reward * 1e12 / lpSupply);
        pool.lastRewardTime = block.timestamp;
    }
    
    // 质押代币
    function deposit(uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[msg.sender];
        
        updatePool();
        
        // 处理待领取奖励
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accRewardPerShare / 1e12) - user.rewardDebt;
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending);
            }
        }
        
        // 转移质押代币
        if (_amount > 0) {
            pool.lpToken.transferFrom(msg.sender, address(this), _amount);
            user.amount = user.amount + _amount;
            user.unlockTime = block.timestamp + pool.lockDuration;
        }
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        emit Deposit(msg.sender, _amount);
    }
    
    // 提取质押代币
    function withdraw(uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[msg.sender];
        
        require(user.amount >= _amount, "withdraw: not enough");
        require(block.timestamp >= user.unlockTime, "withdraw: still locked");
        
        updatePool();
        
        // 处理待领取奖励
        uint256 pending = (user.amount * pool.accRewardPerShare / 1e12) - user.rewardDebt;
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
        }
        
        // 转移质押代币
        if (_amount > 0) {
            user.amount = user.amount - _amount;
            pool.lpToken.transfer(msg.sender, _amount);
        }
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        emit Withdraw(msg.sender, _amount);
    }
    
    // 安全转移奖励代币
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        if (_amount > rewardBal) {
            rewardToken.transfer(_to, rewardBal);
        } else {
            rewardToken.transfer(_to, _amount);
        }
    }
    
    // 紧急提取质押代币（不计算奖励）
    function emergencyWithdraw() external nonReentrant {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[msg.sender];
        
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        
        pool.lpToken.transfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }
    
    // 添加功能以兼容FarmUpgradeableV2接口
    
    // 获取用户信息
    function getUserInfo(address _user) external view returns (uint256 amount, uint256 rewardDebt, uint256 unlockTime) {
        UserInfo storage user = userInfo[_user];
        return (user.amount, user.rewardDebt, user.unlockTime);
    }
    
    // 获取池子信息
    function getPoolInfo(uint256 _pid) external view returns (
        address lpToken,
        uint256 allocPoint,
        uint256 lastRewardTime,
        uint256 accRewardPerShare,
        uint256 lockDuration
    ) {
        require(_pid == 0, "Only pool 0 available");
        PoolInfo storage pool = poolInfo[_pid];
        return (
            address(pool.lpToken),
            pool.allocPoint,
            pool.lastRewardTime,
            pool.accRewardPerShare,
            pool.lockDuration
        );
    }
    
    // 获取待领取奖励（兼容FarmUpgradeableV2接口）
    function getPendingReward(address _user) external view returns (uint256) {
        return this.pendingReward(_user);
    }
    
    // 获取总质押量
    function totalStaked() external view returns (uint256) {
        PoolInfo storage pool = poolInfo[0];
        return pool.lpToken.balanceOf(address(this));
    }
}