// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./SwapRouterUpgradeable.sol";

/// @title Upgradeable SwapRouter V2 for AI Harvest
/// @notice Manages token swaps with extended functionality
/// @dev V2 adds maximum swap limit and token whitelist features
contract SwapRouterUpgradeableV2 is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    PausableUpgradeable,
    UUPSUpgradeable,
    SwapRouterUpgradeable
{
    using SafeERC20 for IERC20;
    
    // V2新增状态变量
    uint256 public maxSwapAmount; // 单次交换的最大代币数量
    mapping(address => bool) public whitelistedTokens; // 白名单代币
    bool public whitelistEnabled; // 是否启用白名单
    
    // V2 新增费用细分
    uint256 public lpFee; // LP费用
    uint256 public protocolFee; // 协议费用
    
    // Maximum transfer amount per token
    mapping(address => uint256) public maxTransferAmounts;
    
    // V2 新增事件 - 只添加父合约中不存在的事件
    event MaxSwapAmountUpdated(uint256 oldLimit, uint256 newLimit);
    event TokenWhitelisted(address indexed token, bool status);
    event WhitelistStatusChanged(bool enabled);
    event TokenAddedToWhitelist(address indexed token);
    event TokenRemovedFromWhitelist(address indexed token);
    event MaxTransferAmountSet(address indexed token, uint256 amount);
    event BatchSwapExecuted(address indexed user, uint256 swapCount);
    event TokenSwapped(address indexed fromToken, address indexed toToken, address indexed user, uint256 fromAmount, uint256 toAmount, uint256 fee);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /// @notice Initializes the contract
    /// @dev Replace the constructor for upgradeable contracts
    /// @param _treasury Treasury address
    /// @param _fee Fee in basis points
    function initialize(address _treasury, uint256 _fee) public override initializer {
        // 调用父合约的初始化
        super.initialize(_treasury, _fee); // 设置基础费率
        
        // V2初始化
        lpFee = 300; // 3%
        protocolFee = 100; // 1%
        maxSwapAmount = 1000 ether; // 默认最大交换限额
        whitelistEnabled = false; // 默认不启用白名单
    }
    
    /// @notice Pauses the contract
    /// @dev Only callable by the owner
    function pause() external override onlyOwner {
        _pause();
    }
    
    /// @notice Unpauses the contract
    /// @dev Only callable by the owner
    function unpause() external override onlyOwner {
        _unpause();
    }
    
    /// @notice Sets the treasury address
    /// @dev Only callable by the owner
    /// @param _treasury New treasury address
    function setTreasury(address _treasury) external override onlyOwner {
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /// @notice Updates the exchange rate between two tokens
    /// @dev Only callable by the owner
    /// @param _fromToken From token address
    /// @param _toToken To token address
    /// @param _rate Exchange rate (1 _fromToken = _rate _toToken)
    function updateExchangeRate(address _fromToken, address _toToken, uint256 _rate) external onlyOwner {
        require(_fromToken != address(0) && _toToken != address(0), "Invalid token address");
        require(_rate > 0, "Rate must be positive");
        
        // 直接设置汇率而不是调用super.setExchangeRate
        exchangeRates[_fromToken][_toToken] = _rate;
        emit ExchangeRateUpdated(_fromToken, _toToken, _rate);
    }
    
    /// @notice Swaps tokens
    /// @param _fromToken From token address
    /// @param _toToken To token address
    /// @param _amount Amount of from tokens to swap
    function swap(address _fromToken, address _toToken, uint256 _amount) external override nonReentrant whenNotPaused returns (uint256) {
        require(_fromToken != address(0) && _toToken != address(0), "Invalid token address");
        require(_fromToken != _toToken, "Cannot swap same token");
        require(_amount > 0, "Amount must be positive");
        require(_amount <= maxSwapAmount, "Exceeds maximum swap amount");
        
        if (whitelistEnabled) {
            require(whitelistedTokens[_fromToken] && whitelistedTokens[_toToken], "Token not whitelisted");
        }
        
        // V2版本使用自定义的实现，而不是调用父合约
        uint256 rate = exchangeRates[_fromToken][_toToken];
        require(rate > 0, "Exchange rate not set");
        
        // 计算输出金额
        uint256 outputAmount = _amount * rate / 1e18;
        
        // 计算费用
        uint256 lpFeeAmount = outputAmount * lpFee / FEE_DENOMINATOR;
        uint256 protocolFeeAmount = outputAmount * protocolFee / FEE_DENOMINATOR;
        uint256 finalAmount = outputAmount - lpFeeAmount - protocolFeeAmount;
        
        // 检查合约中是否有足够的toToken
        require(IERC20(_toToken).balanceOf(address(this)) >= finalAmount, "Insufficient liquidity");
        
        // 转账fromToken到合约
        IERC20(_fromToken).safeTransferFrom(msg.sender, address(this), _amount);
        
        // 更新LP余额
        lpBalances[_fromToken][_toToken] += _amount;
        lpBalances[_toToken][_fromToken] -= finalAmount;
        
        // 向用户发送toToken
        IERC20(_toToken).safeTransfer(msg.sender, finalAmount);
        
        // 如果有协议费用且国库地址有效，则发送协议费用
        if (protocolFeeAmount > 0 && treasury != address(0)) {
            IERC20(_toToken).safeTransfer(treasury, protocolFeeAmount);
        }
        
        emit TokenSwapped(_fromToken, _toToken, msg.sender, _amount, finalAmount, lpFeeAmount + protocolFeeAmount);
        
        return finalAmount;
    }
    
    /// @notice Updates fee percentages
    /// @dev Only callable by the owner
    /// @param _lpFee New LP fee percentage
    /// @param _protocolFee New protocol fee percentage
    function updateFees(uint256 _lpFee, uint256 _protocolFee) external onlyOwner {
        require(_lpFee + _protocolFee <= 1000, "Total fee cannot exceed 10%");
        
        lpFee = _lpFee;
        protocolFee = _protocolFee;
        
        // 同时更新父合约的总费率
        uint256 totalFee = _lpFee + _protocolFee;
        fee = totalFee; // Update the fee in the parent contract
        
        emit FeeUpdated(totalFee);
    }
    
    /// @notice Allows emergency withdrawal of tokens from the contract
    /// @dev Only callable by the owner
    /// @param _token Token to withdraw
    /// @param _to Address to send tokens to
    /// @param _amount Amount of tokens to withdraw
    function emergencyWithdraw(address _token, address _to, uint256 _amount) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_to != address(0), "Invalid recipient address");
        require(_amount > 0, "Amount must be positive");
        
        IERC20 token = IERC20(_token);
        require(token.balanceOf(address(this)) >= _amount, "Insufficient balance");
        
        require(token.transfer(_to, _amount), "Transfer failed");
        
        // 注意：此处简化处理，实际应该根据具体业务逻辑更新相应的LP余额
        // 由于无法枚举映射中的所有键，我们不能遍历所有的LP对
        // 该功能应由具体的业务逻辑或单独的管理函数处理
    }
    
    /// @notice Sets maximum swap amount
    /// @dev Only callable by the owner
    /// @param _maxAmount New maximum swap amount
    function setMaxSwapAmount(uint256 _maxAmount) external onlyOwner {
        require(_maxAmount > 0, "Max amount must be positive");
        uint256 oldLimit = maxSwapAmount;
        maxSwapAmount = _maxAmount;
        emit MaxSwapAmountUpdated(oldLimit, _maxAmount);
    }
    
    /// @notice Adds a token to the whitelist
    /// @dev Only callable by the owner
    /// @param _token Token address to add
    function addToWhitelist(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        whitelistedTokens[_token] = true;
        emit TokenAddedToWhitelist(_token);
    }
    
    /// @notice Removes a token from the whitelist
    /// @dev Only callable by the owner
    /// @param _token Token address to remove
    function removeFromWhitelist(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        whitelistedTokens[_token] = false;
        emit TokenRemovedFromWhitelist(_token);
    }
    
    /// @notice Enables or disables the whitelist
    /// @dev Only callable by the owner
    /// @param _enabled Whether to enable the whitelist
    function setWhitelistEnabled(bool _enabled) external onlyOwner {
        whitelistEnabled = _enabled;
        emit WhitelistStatusChanged(_enabled);
    }
    
    /// @notice Sets maximum transfer amount for a token
    /// @dev Only callable by the owner
    /// @param _token Token address
    /// @param _amount Maximum amount that can be transferred
    function setMaxTransferAmount(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be positive");
        maxTransferAmounts[_token] = _amount;
        emit MaxTransferAmountSet(_token, _amount);
    }
    
    /// @notice Batch swap tokens
    /// @dev Allows swapping multiple tokens in a single transaction
    /// @param fromTokens Array of source token addresses
    /// @param toTokens Array of destination token addresses
    /// @param amounts Array of amounts to swap
    /// @return Array of destination token amounts received
    function batchSwap(
        address[] calldata fromTokens,
        address[] calldata toTokens,
        uint256[] calldata amounts
    ) external nonReentrant whenNotPaused returns (uint256[] memory) {
        require(
            fromTokens.length == toTokens.length && 
            fromTokens.length == amounts.length,
            "Arrays length mismatch"
        );
        
        uint256[] memory outputs = new uint256[](fromTokens.length);
        
        for (uint256 i = 0; i < fromTokens.length; i++) {
            // 使用单次swap的逻辑
            outputs[i] = _swapInternal(
                fromTokens[i],
                toTokens[i],
                amounts[i]
            );
        }
        
        emit BatchSwapExecuted(msg.sender, fromTokens.length);
        
        return outputs;
    }
    
    /// @notice Internal swap function
    /// @param fromToken Source token address
    /// @param toToken Destination token address
    /// @param amount Amount to swap
    /// @return Amount of destination token received
    function _swapInternal(
        address fromToken,
        address toToken,
        uint256 amount
    ) internal returns (uint256) {
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
    
    /// @notice Authorize contract upgrade
    /// @param newImplementation New implementation address
    function _authorizeUpgrade(address newImplementation) internal override(UUPSUpgradeable, SwapRouterUpgradeable) onlyOwner {
        // 无需额外实现，父类已实现基本功能
    }
    
    /// @notice Returns the current contract version
    /// @return Version string
    function version() public pure override returns (string memory) {
        return "2.0.0";
    }
} 
