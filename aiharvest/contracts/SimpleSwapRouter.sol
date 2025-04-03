// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SimpleSwapRouter
 * @notice 简化版的交换路由器，非upgradeable，避免初始化问题
 * @dev 直接在构造函数中设置所有参数
 */
contract SimpleSwapRouter is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // 费率配置
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public fee; // 总费率（基点）
    address public treasury; // 国库地址
    
    // V2特性
    uint256 public lpFee; // LP费率
    uint256 public protocolFee; // 协议费率
    uint256 public maxSwapAmount; // 最大交换金额
    mapping(address => bool) public whitelistedTokens; // 白名单代币
    bool public whitelistEnabled; // 是否启用白名单
    
    // 代币对汇率：tokenA -> tokenB -> 汇率
    mapping(address => mapping(address => uint256)) public exchangeRates;
    
    // LP代币余额
    mapping(address => mapping(address => uint256)) public lpBalances;
    
    // 事件
    event ExchangeRateUpdated(address indexed tokenA, address indexed tokenB, uint256 newRate);
    event LiquidityAdded(address indexed provider, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 share);
    event TokenSwapped(address indexed fromToken, address indexed toToken, address indexed user, uint256 fromAmount, uint256 toAmount, uint256 fee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event FeeUpdated(uint256 newFee);
    event MaxSwapAmountUpdated(uint256 oldLimit, uint256 newLimit);
    event WhitelistStatusChanged(bool enabled);
    event TokenAddedToWhitelist(address indexed token);
    event TokenRemovedFromWhitelist(address indexed token);
    
    /**
     * @notice 合约构造函数
     * @param _treasury 国库地址
     * @param _fee 总费率（基点）
     */
    constructor(address _treasury, uint256 _fee) {
        require(_treasury != address(0), "Treasury cannot be zero address");
        require(_fee < 1000, "Fee cannot exceed 10%");
        
        treasury = _treasury;
        fee = _fee;
        
        // V2特性初始化
        lpFee = 300; // 3%
        protocolFee = 100; // 1%
        maxSwapAmount = 1000 ether; // 默认最大交换限额
        whitelistEnabled = false; // 默认不启用白名单
        
        // 设置所有者为部署者
        _transferOwnership(msg.sender);
    }
    
    /**
     * @notice 暂停所有非管理员功能
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice 恢复所有功能
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice 设置国库地址
     * @param _treasury 新国库地址
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Treasury cannot be zero address");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /**
     * @notice 更新两个代币之间的汇率
     * @param tokenA 第一个代币地址
     * @param tokenB 第二个代币地址
     * @param rate 新汇率（1个tokenA = rate个tokenB）
     */
    function setExchangeRate(address tokenA, address tokenB, uint256 rate) external onlyOwner {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token address");
        require(rate > 0, "Rate must be positive");
        
        exchangeRates[tokenA][tokenB] = rate;
        // 同时设置反向汇率
        exchangeRates[tokenB][tokenA] = (1e36 / rate);
        
        emit ExchangeRateUpdated(tokenA, tokenB, rate);
        emit ExchangeRateUpdated(tokenB, tokenA, 1e36 / rate);
    }
    
    /**
     * @notice 添加流动性
     * @param tokenA 第一个代币地址
     * @param tokenB 第二个代币地址
     * @param amountA 第一个代币数量
     * @param amountB 第二个代币数量
     */
    function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external nonReentrant whenNotPaused {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token address");
        require(amountA > 0 && amountB > 0, "Amounts must be positive");
        
        // 从用户转账代币到合约
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);
        
        // 更新LP余额
        lpBalances[tokenA][tokenB] += amountA;
        lpBalances[tokenB][tokenA] += amountB;
        
        // 如果汇率未设置，根据提供的流动性设置
        if (exchangeRates[tokenA][tokenB] == 0) {
            uint256 rate = (amountB * 1e18) / amountA;
            exchangeRates[tokenA][tokenB] = rate;
            exchangeRates[tokenB][tokenA] = (1e36 / rate);
            
            emit ExchangeRateUpdated(tokenA, tokenB, rate);
            emit ExchangeRateUpdated(tokenB, tokenA, 1e36 / rate);
        }
        
        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB, 0);
    }
    
    /**
     * @notice 交换代币
     * @param fromToken 源代币地址
     * @param toToken 目标代币地址
     * @param amount 源代币数量
     * @return 收到的目标代币数量
     */
    function swap(address fromToken, address toToken, uint256 amount) external nonReentrant whenNotPaused returns (uint256) {
        require(fromToken != address(0) && toToken != address(0), "Invalid token address");
        require(fromToken != toToken, "Cannot swap same token");
        require(amount > 0, "Amount must be positive");
        require(amount <= maxSwapAmount, "Exceeds maximum swap amount");
        
        if (whitelistEnabled) {
            require(whitelistedTokens[fromToken] && whitelistedTokens[toToken], "Token not whitelisted");
        }
        
        uint256 rate = exchangeRates[fromToken][toToken];
        require(rate > 0, "Exchange rate not set");
        
        // 计算输出金额
        uint256 outputAmount = amount * rate / 1e18;
        
        // 计算费用
        uint256 lpFeeAmount = outputAmount * lpFee / FEE_DENOMINATOR;
        uint256 protocolFeeAmount = outputAmount * protocolFee / FEE_DENOMINATOR;
        uint256 finalAmount = outputAmount - lpFeeAmount - protocolFeeAmount;
        
        // 检查合约有足够的toToken
        require(IERC20(toToken).balanceOf(address(this)) >= finalAmount, "Insufficient liquidity");
        
        // 转账fromToken到合约
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // 更新LP余额
        lpBalances[fromToken][toToken] += amount;
        lpBalances[toToken][fromToken] -= finalAmount;
        
        // 向用户发送toToken
        IERC20(toToken).safeTransfer(msg.sender, finalAmount);
        
        // 如果有协议费用且国库地址有效，则发送协议费用
        if (protocolFeeAmount > 0 && treasury != address(0)) {
            IERC20(toToken).safeTransfer(treasury, protocolFeeAmount);
        }
        
        emit TokenSwapped(fromToken, toToken, msg.sender, amount, finalAmount, lpFeeAmount + protocolFeeAmount);
        
        return finalAmount;
    }
    
    /**
     * @notice 获取交换的输出金额
     * @param fromToken 源代币地址
     * @param toToken 目标代币地址
     * @param amount 源代币数量
     * @return 收到的目标代币数量
     */
    function getOutputAmount(address fromToken, address toToken, uint256 amount) external view returns (uint256) {
        if (fromToken == address(0) || toToken == address(0) || amount == 0 || exchangeRates[fromToken][toToken] == 0) {
            return 0;
        }
        
        uint256 rate = exchangeRates[fromToken][toToken];
        uint256 outputAmount = amount * rate / 1e18;
        
        uint256 lpFeeAmount = outputAmount * lpFee / FEE_DENOMINATOR;
        uint256 protocolFeeAmount = outputAmount * protocolFee / FEE_DENOMINATOR;
        
        return outputAmount - lpFeeAmount - protocolFeeAmount;
    }
    
    /**
     * @notice 更新费率
     * @param _lpFee 新LP费率
     * @param _protocolFee 新协议费率
     */
    function updateFees(uint256 _lpFee, uint256 _protocolFee) external onlyOwner {
        require(_lpFee + _protocolFee <= 1000, "Total fee cannot exceed 10%");
        
        lpFee = _lpFee;
        protocolFee = _protocolFee;
        
        // 同时更新总费率
        uint256 totalFee = _lpFee + _protocolFee;
        fee = totalFee;
        
        emit FeeUpdated(totalFee);
    }
    
    /**
     * @notice 紧急提款
     * @param token 代币地址
     * @param to 接收地址
     * @param amount 提款金额
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be positive");
        
        IERC20(token).safeTransfer(to, amount);
    }
    
    /**
     * @notice 设置最大交换金额
     * @param _maxAmount 新最大交换金额
     */
    function setMaxSwapAmount(uint256 _maxAmount) external onlyOwner {
        require(_maxAmount > 0, "Max amount must be positive");
        uint256 oldLimit = maxSwapAmount;
        maxSwapAmount = _maxAmount;
        emit MaxSwapAmountUpdated(oldLimit, _maxAmount);
    }
    
    /**
     * @notice 添加代币到白名单
     * @param token 代币地址
     */
    function addTokenToWhitelist(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        whitelistedTokens[token] = true;
        emit TokenAddedToWhitelist(token);
    }
    
    /**
     * @notice 从白名单移除代币
     * @param token 代币地址
     */
    function removeTokenFromWhitelist(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        whitelistedTokens[token] = false;
        emit TokenRemovedFromWhitelist(token);
    }
    
    /**
     * @notice 设置白名单状态
     * @param enabled 是否启用白名单
     */
    function setWhitelistStatus(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
        emit WhitelistStatusChanged(enabled);
    }
    
    /**
     * @notice 返回当前合约版本
     * @return 版本字符串
     */
    function version() public pure returns (string memory) {
        return "2.0.0";
    }
} 