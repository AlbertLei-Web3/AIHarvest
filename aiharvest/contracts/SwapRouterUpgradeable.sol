// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title Upgradeable Swap Router for AI Harvest
/// @notice Provides basic token swap functionality with fee collection
/// @dev Uses the UUPS proxy pattern for upgradeability
contract SwapRouterUpgradeable is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable 
{
    using SafeERC20 for IERC20;

    // Fee configuration
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public fee; // Fee in basis points (e.g., 30 = 0.3%)
    address public treasury;
    
    // Token pair mapping: tokenA -> tokenB -> exchange rate (1 tokenA = X tokenB * 10^18)
    mapping(address => mapping(address => uint256)) public exchangeRates;
    
    // LP token balances
    mapping(address => mapping(address => uint256)) public lpBalances;
    
    // Liquidity providers info
    struct LiquidityInfo {
        uint256 token0Amount;
        uint256 token1Amount;
        uint256 share;
    }
    
    // Mapping of provider to token pair to liquidity info
    mapping(address => mapping(address => mapping(address => LiquidityInfo))) public liquidityProviders;
    
    // Total shares per token pair
    mapping(address => mapping(address => uint256)) public totalShares;
    
    // Events
    event TokenSwap(
        address indexed user,
        address indexed fromToken,
        address indexed toToken,
        uint256 fromAmount,
        uint256 toAmount,
        uint256 lpFeeAmount,
        uint256 protocolFeeAmount
    );
    
    event ExchangeRateUpdated(
        address indexed tokenA,
        address indexed tokenB,
        uint256 newRate
    );
    
    event LiquidityAdded(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 share
    );
    
    event LiquidityRemoved(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 share
    );
    
    event Swap(
        address indexed user,
        address indexed fromToken,
        address indexed toToken,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event FeeUpdated(uint256 newFee);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /// @notice Initializes the contract, replacing the constructor for upgradeable contracts
    /// @param _treasury Treasury address to receive protocol fees
    /// @param _fee Fee in basis points (e.g., 30 = 0.3%)
    function initialize(address _treasury, uint256 _fee) public virtual initializer {
        require(_treasury != address(0), "Invalid treasury address");
        require(_fee < 1000, "Fee cannot exceed 10%");
        
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        
        treasury = _treasury;
        fee = _fee;
    }
    
    /// @notice Pauses all non-admin functions
    function pause() external virtual onlyOwner {
        _pause();
    }
    
    /// @notice Unpauses the contract
    function unpause() external virtual onlyOwner {
        _unpause();
    }
    
    /// @notice Set the treasury address
    /// @param _treasury New treasury address
    function setTreasury(address _treasury) external virtual onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /// @notice Update exchange rate between two tokens
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @param rate New exchange rate (1 tokenA = rate * 10^18 tokenB)
    function setExchangeRate(address tokenA, address tokenB, uint256 rate) external virtual onlyOwner {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token address");
        require(rate > 0, "Rate must be greater than 0");
        
        exchangeRates[tokenA][tokenB] = rate;
        // Set inverse rate as well for convenience
        exchangeRates[tokenB][tokenA] = (1e36 / rate);
        
        emit ExchangeRateUpdated(tokenA, tokenB, rate);
        emit ExchangeRateUpdated(tokenB, tokenA, 1e36 / rate);
    }
    
    /// @notice Add initial liquidity for a token pair
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @param amountA Amount of first token
    /// @param amountB Amount of second token
    function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external virtual nonReentrant whenNotPaused {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token address");
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");
        
        // Transfer tokens from caller to contract
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        // Update LP balances
        lpBalances[tokenA][tokenB] += amountA;
        lpBalances[tokenB][tokenA] += amountB;
        
        // If exchange rate not set, set it based on the provided liquidity
        if (exchangeRates[tokenA][tokenB] == 0) {
            uint256 rate = (amountB * 1e18) / amountA;
            exchangeRates[tokenA][tokenB] = rate;
            exchangeRates[tokenB][tokenA] = (1e36 / rate);
            
            emit ExchangeRateUpdated(tokenA, tokenB, rate);
            emit ExchangeRateUpdated(tokenB, tokenA, 1e36 / rate);
        }
        
        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB, 0);
    }
    
    /// @notice Swap tokens with fee
    /// @param fromToken Source token address
    /// @param toToken Destination token address
    /// @param amount Amount of source token to swap
    /// @return The amount of destination token received
    function swap(address fromToken, address toToken, uint256 amount) external virtual nonReentrant whenNotPaused returns (uint256) {
        require(fromToken != address(0) && toToken != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(exchangeRates[fromToken][toToken] > 0, "Exchange rate not set");
        
        // Calculate output amount based on exchange rate
        uint256 exchangeRate = exchangeRates[fromToken][toToken];
        uint256 outputAmount = (amount * exchangeRate) / 1e18;
        
        // Calculate fees
        uint256 lpFeeAmount = (outputAmount * fee) / FEE_DENOMINATOR;
        uint256 protocolFeeAmount = (outputAmount * (FEE_DENOMINATOR - fee)) / FEE_DENOMINATOR;
        uint256 finalOutputAmount = outputAmount - lpFeeAmount - protocolFeeAmount;
        
        // Check if contract has enough liquidity
        require(lpBalances[toToken][fromToken] >= finalOutputAmount, "Insufficient liquidity");
        
        // Transfer tokens: from user to contract, from contract to user
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(toToken).safeTransfer(msg.sender, finalOutputAmount);
        
        // Update LP balances
        lpBalances[fromToken][toToken] += amount;
        lpBalances[toToken][fromToken] -= finalOutputAmount;
        
        // Send protocol fee to treasury if it's set
        if (protocolFeeAmount > 0 && treasury != address(0)) {
            IERC20(toToken).safeTransfer(treasury, protocolFeeAmount);
        }
        
        emit TokenSwap(
            msg.sender,
            fromToken,
            toToken,
            amount,
            finalOutputAmount,
            lpFeeAmount,
            protocolFeeAmount
        );
        
        emit Swap(
            msg.sender,
            fromToken,
            toToken,
            amount,
            finalOutputAmount
        );
        
        return finalOutputAmount;
    }
    
    /// @notice Get the output amount for a given input amount
    /// @param fromToken Source token address
    /// @param toToken Destination token address
    /// @param amount Amount of source token
    /// @return The amount of destination token that would be received
    function getOutputAmount(address fromToken, address toToken, uint256 amount) external view returns (uint256) {
        if (fromToken == address(0) || toToken == address(0) || amount == 0 || exchangeRates[fromToken][toToken] == 0) {
            return 0;
        }
        
        uint256 exchangeRate = exchangeRates[fromToken][toToken];
        uint256 outputAmount = (amount * exchangeRate) / 1e18;
        
        uint256 lpFeeAmount = (outputAmount * fee) / FEE_DENOMINATOR;
        uint256 protocolFeeAmount = (outputAmount * (FEE_DENOMINATOR - fee)) / FEE_DENOMINATOR;
        
        return outputAmount - lpFeeAmount - protocolFeeAmount;
    }
    
    /// @notice Update fee setting
    /// @param _fee New fee in basis points
    function setFee(uint256 _fee) external virtual onlyOwner {
        require(_fee < 1000, "Fee cannot exceed 10%");
        fee = _fee;
        emit FeeUpdated(_fee);
    }
    
    /// @notice Emergency withdraw tokens in case of issues
    /// @param token Token address to withdraw
    /// @param amount Amount to withdraw
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");
    }
    
    /// @notice Authorize contract upgrade
    /// @param newImplementation New implementation address
    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {
        // Validation logic can be added here if needed
    }
    
    /// @notice Returns the current contract version
    /// @return Version string
    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }
} 
