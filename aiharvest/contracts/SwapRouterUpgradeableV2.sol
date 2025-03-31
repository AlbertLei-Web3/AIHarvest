// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
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
    // 常量
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // 状态变量
    uint256 public lpFee; // LP费用，以FEE_DENOMINATOR为基准的百分比
    uint256 public protocolFee; // 协议费用，以FEE_DENOMINATOR为基准的百分比
    address public treasury; // 国库地址，用于接收协议费用
    
    // V2新增状态变量
    uint256 public maxSwapAmount; // 单次交换的最大代币数量
    mapping(address => bool) public whitelistedTokens; // 白名单代币
    bool public whitelistEnabled; // 是否启用白名单
    
    // 映射
    mapping(address => mapping(address => uint256)) public exchangeRates; // 代币兑换率
    mapping(address => uint256) public lpBalances; // LP代币余额
    
    // Maximum transfer amount per token
    mapping(address => uint256) public maxTransferAmounts;
    
    // 事件
    event TokenSwapped(address indexed fromToken, address indexed toToken, address indexed user, uint256 fromAmount, uint256 toAmount, uint256 fee);
    event LiquidityAdded(address indexed token, address indexed user, uint256 amount);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event ExchangeRateUpdated(address indexed fromToken, address indexed toToken, uint256 newRate);
    event FeeUpdated(uint256 newLpFee, uint256 newProtocolFee);
    event MaxSwapAmountUpdated(uint256 oldLimit, uint256 newLimit);
    event TokenWhitelisted(address indexed token, bool status);
    event WhitelistStatusChanged(bool enabled);
    event TokenAddedToWhitelist(address indexed token);
    event TokenRemovedFromWhitelist(address indexed token);
    event MaxTransferAmountSet(address indexed token, uint256 amount);
    event BatchSwapExecuted(address indexed user, uint256 swapCount);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /// @notice Initializes the contract
    /// @dev Replace the constructor for upgradeable contracts
    /// @param _factory Factory contract address
    function initialize(address _factory) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        require(_factory != address(0), "Invalid factory address");
        transferOwnership(_factory);
        
        lpFee = 300; // 3%
        protocolFee = 100; // 1%
        
        // V2初始化
        maxSwapAmount = 1000 ether; // 默认最大交换限额
        whitelistEnabled = false; // 默认不启用白名单
    }
    
    /// @notice Pauses the contract
    /// @dev Only callable by the owner
    function pause() external onlyOwner {
        _pause();
    }
    
    /// @notice Unpauses the contract
    /// @dev Only callable by the owner
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /// @notice Sets the treasury address
    /// @dev Only callable by the owner
    /// @param _treasury New treasury address
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
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
        
        exchangeRates[_fromToken][_toToken] = _rate;
        emit ExchangeRateUpdated(_fromToken, _toToken, _rate);
    }
    
    /// @notice Adds liquidity to the platform
    /// @param _token Token address
    /// @param _amount Amount of tokens to add
    function addLiquidity(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be positive");
        
        if (whitelistEnabled) {
            require(whitelistedTokens[_token], "Token not whitelisted");
        }
        
        IERC20Upgradeable token = IERC20Upgradeable(_token);
        
        // 检查余额和授权
        require(token.balanceOf(msg.sender) >= _amount, "Insufficient balance");
        require(token.allowance(msg.sender, address(this)) >= _amount, "Insufficient allowance");
        
        // 转账
        bool success = token.transferFrom(msg.sender, address(this), _amount);
        require(success, "Transfer failed");
        
        // 更新LP余额
        lpBalances[_token] += _amount;
        
        emit LiquidityAdded(_token, msg.sender, _amount);
    }
    
    /// @notice Swaps tokens
    /// @param _fromToken From token address
    /// @param _toToken To token address
    /// @param _amount Amount of from tokens to swap
    function swap(address _fromToken, address _toToken, uint256 _amount) external nonReentrant whenNotPaused returns (uint256) {
        require(_fromToken != address(0) && _toToken != address(0), "Invalid token address");
        require(_fromToken != _toToken, "Cannot swap same token");
        require(_amount > 0, "Amount must be positive");
        require(_amount <= maxSwapAmount, "Exceeds maximum swap amount");
        
        if (whitelistEnabled) {
            require(whitelistedTokens[_fromToken] && whitelistedTokens[_toToken], "Token not whitelisted");
        }
        
        uint256 rate = exchangeRates[_fromToken][_toToken];
        require(rate > 0, "Exchange rate not set");
        
        // 计算输出金额
        uint256 outputAmount = _amount * rate / 1e18;
        
        // 检查合约有足够的toToken
        require(IERC20Upgradeable(_toToken).balanceOf(address(this)) >= outputAmount, "Insufficient liquidity");
        
        // 计算费用
        uint256 lpFeeAmount = outputAmount * lpFee / FEE_DENOMINATOR;
        uint256 protocolFeeAmount = outputAmount * protocolFee / FEE_DENOMINATOR;
        uint256 finalAmount = outputAmount - lpFeeAmount - protocolFeeAmount;
        
        // 转账fromToken到合约
        IERC20Upgradeable fromToken = IERC20Upgradeable(_fromToken);
        require(fromToken.transferFrom(msg.sender, address(this), _amount), "Transfer from failed");
        
        // 更新LP余额
        lpBalances[_fromToken] += _amount;
        lpBalances[_toToken] -= finalAmount;
        
        // 向用户发送toToken
        IERC20Upgradeable toToken = IERC20Upgradeable(_toToken);
        require(toToken.transfer(msg.sender, finalAmount), "Transfer to failed");
        
        // 如果有协议费用且国库地址有效，则发送协议费用
        if (protocolFeeAmount > 0 && treasury != address(0)) {
            require(toToken.transfer(treasury, protocolFeeAmount), "Protocol fee transfer failed");
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
        
        emit FeeUpdated(_lpFee, _protocolFee);
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
        
        IERC20Upgradeable token = IERC20Upgradeable(_token);
        require(token.balanceOf(address(this)) >= _amount, "Insufficient balance");
        
        require(token.transfer(_to, _amount), "Transfer failed");
        
        // 更新LP余额
        if (lpBalances[_token] >= _amount) {
            lpBalances[_token] -= _amount;
        } else {
            lpBalances[_token] = 0;
        }
    }
    
    // V2新增功能
    
    /// @notice Sets the maximum amount for a single swap
    /// @dev Only callable by the owner
    /// @param _maxAmount New maximum swap amount
    function setMaxSwapAmount(uint256 _maxAmount) external onlyOwner {
        require(_maxAmount > 0, "Max amount must be positive");
        uint256 oldLimit = maxSwapAmount;
        maxSwapAmount = _maxAmount;
        emit MaxSwapAmountUpdated(oldLimit, _maxAmount);
    }
    
    /// @notice Adds or removes a token from the whitelist
    /// @dev Only callable by the owner
    /// @param _token Token address
    /// @param _status Whether the token should be whitelisted
    function setTokenWhitelist(address _token, bool _status) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        whitelistedTokens[_token] = _status;
        emit TokenWhitelisted(_token, _status);
    }
    
    /// @notice Enables or disables the whitelist functionality
    /// @dev Only callable by the owner
    /// @param _enabled Whether whitelist should be enabled
    function setWhitelistEnabled(bool _enabled) external onlyOwner {
        whitelistEnabled = _enabled;
        emit WhitelistStatusChanged(_enabled);
    }
    
    /// @notice Batch whitelist multiple tokens
    /// @dev Only callable by the owner
    /// @param _tokens Array of token addresses
    /// @param _statuses Array of whitelist statuses
    function batchSetTokenWhitelist(address[] calldata _tokens, bool[] calldata _statuses) external onlyOwner {
        require(_tokens.length == _statuses.length, "Array length mismatch");
        
        for (uint256 i = 0; i < _tokens.length; i++) {
            require(_tokens[i] != address(0), "Invalid token address");
            whitelistedTokens[_tokens[i]] = _statuses[i];
            emit TokenWhitelisted(_tokens[i], _statuses[i]);
        }
    }
    
    /// @notice Checks if a token is available for swapping
    /// @param _token Token address to check
    /// @return Whether the token is available for swapping
    function isTokenAvailable(address _token) external view returns (bool) {
        if (!whitelistEnabled) {
            return true;
        }
        return whitelistedTokens[_token];
    }
    
    /// @notice Returns the exchange rate from one token to another
    /// @param _fromToken From token address
    /// @param _toToken To token address
    /// @param _amount Amount of from tokens
    /// @return Final amount after fees
    function getSwapAmount(address _fromToken, address _toToken, uint256 _amount) external view returns (uint256) {
        uint256 rate = exchangeRates[_fromToken][_toToken];
        if (rate == 0) return 0;
        
        uint256 outputAmount = _amount * rate / 1e18;
        uint256 lpFeeAmount = outputAmount * lpFee / FEE_DENOMINATOR;
        uint256 protocolFeeAmount = outputAmount * protocolFee / FEE_DENOMINATOR;
        return outputAmount - lpFeeAmount - protocolFeeAmount;
    }
    
    /// @notice Function that allows the contract to be upgraded
    /// @dev Only callable by the owner
    /// @param newImplementation Address of the new implementation
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Additional upgrade restrictions can be added here
    }
    
    /// @notice Returns the current contract version
    /// @return Version string
    function version() public pure override returns (string memory) {
        return "2.0.0";
    }
    
    /**
     * @dev Adds a token to the whitelist
     * @param token Token address to add
     */
    function addToWhitelist(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        whitelistedTokens[token] = true;
        emit TokenAddedToWhitelist(token);
    }
    
    /**
     * @dev Removes a token from the whitelist
     * @param token Token address to remove
     */
    function removeFromWhitelist(address token) external onlyOwner {
        whitelistedTokens[token] = false;
        emit TokenRemovedFromWhitelist(token);
    }
    
    /**
     * @dev Sets the maximum transfer amount for a token
     * @param token Token address to set limit for
     * @param amount Maximum amount that can be transferred in a single transaction
     */
    function setMaxTransferAmount(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        maxTransferAmounts[token] = amount;
        emit MaxTransferAmountSet(token, amount);
    }
    
    /**
     * @dev Adds multiple tokens to the whitelist in a single transaction
     * @param tokens Array of token addresses to add
     */
    function batchAddToWhitelist(address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "Invalid token address");
            whitelistedTokens[tokens[i]] = true;
            emit TokenAddedToWhitelist(tokens[i]);
        }
    }
    
    /**
     * @dev Executes multiple swaps in a single transaction
     * @param fromTokens Array of tokens to swap from
     * @param toTokens Array of tokens to swap to
     * @param amounts Array of input amounts
     * @param minAmountsOut Array of minimum output amounts (slippage protection)
     * @param to Address to receive the output tokens
     * @param deadline Deadline for the transaction
     * @return amountsOut Array of output amounts
     */
    function batchSwap(
        address[] calldata fromTokens,
        address[] calldata toTokens,
        uint256[] calldata amounts,
        uint256[] calldata minAmountsOut,
        address to,
        uint256 deadline
    ) external nonReentrant returns (uint256[] memory amountsOut) {
        require(
            fromTokens.length == toTokens.length &&
            fromTokens.length == amounts.length &&
            fromTokens.length == minAmountsOut.length,
            "Array length mismatch"
        );
        
        amountsOut = new uint256[](fromTokens.length);
        
        for (uint256 i = 0; i < fromTokens.length; i++) {
            amountsOut[i] = _swap(
                fromTokens[i],
                toTokens[i],
                amounts[i],
                minAmountsOut[i],
                to,
                deadline
            );
        }
        
        emit BatchSwapExecuted(msg.sender, fromTokens.length);
        
        return amountsOut;
    }
    
    /**
     * @dev Internal swap function with additional checks
     * @param fromToken Token to swap from
     * @param toToken Token to swap to
     * @param amountIn Amount of fromToken to swap
     * @param minAmountOut Minimum amount of toToken to receive (slippage protection)
     * @param to Address to receive the output tokens
     * @param deadline Deadline for the transaction
     * @return amountOut Amount of toToken received
     */
    function _swap(
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address to,
        uint256 deadline
    ) internal returns (uint256 amountOut) {
        // Check whitelist if enabled
        if (whitelistEnabled) {
            require(whitelistedTokens[fromToken], "From token not whitelisted");
            require(whitelistedTokens[toToken], "To token not whitelisted");
        }
        
        // Check max transfer amount
        uint256 maxAmount = maxTransferAmounts[fromToken];
        if (maxAmount > 0) {
            require(amountIn <= maxAmount, "Amount exceeds maximum transfer limit");
        }
        
        // Call the base swap function
        return super.swap(fromToken, toToken, amountIn, minAmountOut, to, deadline);
    }
    
    /**
     * @dev Overrides the swap function to add additional checks
     */
    function swap(
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        address to,
        uint256 deadline
    ) external override nonReentrant returns (uint256) {
        return _swap(fromToken, toToken, amountIn, minAmountOut, to, deadline);
    }
} 