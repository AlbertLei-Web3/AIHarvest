// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title IFarmUpgradeable
 * @dev Interface for the FarmUpgradeable contract
 */
interface IFarmUpgradeable {
    /**
     * @dev Initializes the farm contract
     * @param _rewardToken Token used for rewards
     * @param _stakingToken Token to be staked
     * @param _rewardPerBlock Amount of reward tokens distributed per block
     * @param _startBlock Block number when rewards start
     * @param _lockPeriod Duration in seconds for the lock period
     * @param _owner Owner of the farm
     * @param _treasury Treasury address that receives fees
     */
    function initialize(
        address _rewardToken,
        address _stakingToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _lockPeriod,
        address _owner,
        address _treasury
    ) external;
    
    /**
     * @dev Returns the current version of the contract
     * @return Current version string
     */
    function version() external pure returns (string memory);
    
    /**
     * @dev Deposits tokens to the farm
     * @param _amount Amount of tokens to deposit
     */
    function deposit(uint256 _amount) external;
    
    /**
     * @dev Withdraws tokens from the farm
     * @param _amount Amount of tokens to withdraw
     */
    function withdraw(uint256 _amount) external;
    
    /**
     * @dev Harvests rewards without withdrawing staked tokens
     */
    function harvest() external;
    
    /**
     * @dev Withdraws tokens in case of emergency, forfeiting rewards
     */
    function emergencyWithdraw() external;
    
    /**
     * @dev Returns the pending reward amount for a user
     * @param _user Address of the user
     * @return Amount of pending rewards
     */
    function pendingReward(address _user) external view returns (uint256);
    
    /**
     * @dev Returns user information
     * @param _user Address of the user
     * @return amount Amount of staked tokens
     * @return rewardDebt Reward debt
     * @return lastDepositTime Last deposit timestamp
     */
    function userInfo(address _user) external view returns (
        uint256 amount,
        uint256 rewardDebt,
        uint256 lastDepositTime
    );
    
    /**
     * @dev Returns pool information
     * @return totalStaked Total staked tokens
     * @return accRewardPerShare Accumulated rewards per share
     * @return lastRewardBlock Last reward block
     * @return startBlock Start block
     * @return rewardPerBlock Reward per block
     */
    function poolInfo() external view returns (
        uint256 totalStaked,
        uint256 accRewardPerShare,
        uint256 lastRewardBlock,
        uint256 startBlock,
        uint256 rewardPerBlock
    );
    
    /**
     * @dev Updates the reward per block
     * @param _rewardPerBlock New reward per block
     */
    function updateRewardPerBlock(uint256 _rewardPerBlock) external;
    
    /**
     * @dev Updates the lock period
     * @param _lockPeriod New lock period in seconds
     */
    function updateLockPeriod(uint256 _lockPeriod) external;
} 