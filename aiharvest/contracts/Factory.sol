// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./Farm.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Factory is Ownable {
    event FarmCreated(address indexed farm, address indexed rewardToken);

    address[] public farms; // 存储所有 Farm 合约地址的数组


    constructor() Ownable(msg.sender) {
        // 初始化 Ownable 合约
    }

    function createFarm(
        IERC20 _rewardToken,
        uint256 _rewardPerSecond,
        uint256 _startTime
    ) external  returns (address) {
        Farm farm = new Farm(
            _rewardToken,
            _rewardPerSecond,
            _startTime,
            address(this) // 这里是 Factory 合约的地址，成为 Farm 合约的所有者
        );

        farm.transferOwnership(msg.sender); // 将 Farm 合约的所有者设置为 msg.sender
        
        farms.push(address(farm)); // 将新创建的 Farm 合约地址添加到 farms 数组中   
        emit FarmCreated(address(farm), address(_rewardToken)); // 触发 FarmCreated 事件
        return address(farm); // 返回新创建的 Farm 合约地址
    }

    function getAllFarms() external view returns (address[] memory) {
        return farms; // 返回所有 Farm 合约地址
    }
}