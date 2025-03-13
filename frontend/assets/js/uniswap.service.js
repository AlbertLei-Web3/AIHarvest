import { UNISWAP_CONFIG } from './uniswap.config.js';

class UniswapService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.chainId = null;
        this.initialized = false;
        this.priceUpdateInterval = null;
    }

    async initialize(provider) {
        try {
            if (this.initialized) return true;

            this.provider = provider;
            this.signer = provider.getSigner();
            const network = await provider.getNetwork();
            this.chainId = network.chainId;
            
            // 验证网络
            if (!this.isSupportedNetwork(this.chainId)) {
                throw new Error('Unsupported network');
            }

            // 初始化路由合约
            this.routerContract = new ethers.Contract(
                UNISWAP_CONFIG.V2_ROUTER,
                [
                    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
                    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
                    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
                    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
                ],
                this.signer
            );

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Uniswap service:', error);
            throw error;
        }
    }

    // 测试连接
    async testConnection() {
        try {
            const network = await this.provider.getNetwork();
            const accounts = await this.provider.listAccounts();
            const factoryAddress = await this.routerContract.factory();

            return {
                success: true,
                network,
                accounts,
                factoryAddress
            };
        } catch (error) {
            console.error('Connection test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 加载代币列表并获取余额
    async loadTokenList() {
        try {
            const tokenList = Object.values(UNISWAP_CONFIG.TOKENS);
            const userAddress = await this.signer.getAddress();

            for (let token of tokenList) {
                if (token.address === 'ETH') {
                    const balance = await this.provider.getBalance(userAddress);
                    token.balance = ethers.utils.formatEther(balance);
                    continue;
                }

                const contract = new ethers.Contract(
                    token.address,
                    [
                        'function balanceOf(address) view returns (uint256)',
                        'function decimals() view returns (uint8)'
                    ],
                    this.provider
                );

                const [balance, decimals] = await Promise.all([
                    contract.balanceOf(userAddress),
                    contract.decimals()
                ]);

                token.balance = ethers.utils.formatUnits(balance, decimals);
            }

            return tokenList;
        } catch (error) {
            console.error('Failed to load token list:', error);
            throw error;
        }
    }

    // 获取代币价格
    async getTokenPrice(tokenIn, tokenOut, amountIn) {
        try {
            if (!amountIn || amountIn === '0') return '0';

            const path = [tokenIn.address, tokenOut.address];
            if (tokenIn.address === 'ETH') {
                path[0] = UNISWAP_CONFIG.TOKENS.WETH.address;
            }
            if (tokenOut.address === 'ETH') {
                path[1] = UNISWAP_CONFIG.TOKENS.WETH.address;
            }

            const amountInWei = ethers.utils.parseUnits(
                amountIn.toString(),
                tokenIn.decimals
            );

            const amounts = await this.routerContract.getAmountsOut(amountInWei, path);
            const amountOut = ethers.utils.formatUnits(
                amounts[1],
                tokenOut.decimals
            );

            return amountOut;
        } catch (error) {
            console.error('Failed to get token price:', error);
            return '0';
        }
    }

    // 计算价格影响
    calculatePriceImpact(amountIn, amountOut, tokenIn, tokenOut) {
        try {
            const marketPrice = 1; // 这里应该获取实际市场价格
            const executionPrice = parseFloat(amountOut) / parseFloat(amountIn);
            const priceImpact = ((marketPrice - executionPrice) / marketPrice) * 100;
            return Math.max(0, priceImpact).toFixed(2);
        } catch (error) {
            console.error('Failed to calculate price impact:', error);
            return '0.00';
        }
    }

    // 开始实时价格更新
    startPriceUpdates(tokenIn, tokenOut, amountIn, callback) {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }

        const updatePrice = async () => {
            const price = await this.getTokenPrice(tokenIn, tokenOut, amountIn);
            callback(price);
        };

        updatePrice();
        this.priceUpdateInterval = setInterval(updatePrice, 10000); // 每10秒更新一次
    }

    // 停止价格更新
    stopPriceUpdates() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
            this.priceUpdateInterval = null;
        }
    }

    // 执行代币兑换
    async executeSwap(tokenIn, tokenOut, amountIn, slippage = 0.5) {
        try {
            if (!this.signer) throw new Error('No signer available');

            const userAddress = await this.signer.getAddress();
            const path = [tokenIn.address, tokenOut.address];
            
            // 处理ETH的特殊情况
            if (tokenIn.address === 'ETH') {
                path[0] = UNISWAP_CONFIG.TOKENS.WETH.address;
            }
            if (tokenOut.address === 'ETH') {
                path[1] = UNISWAP_CONFIG.TOKENS.WETH.address;
            }

            const amountInWei = ethers.utils.parseUnits(
                amountIn.toString(),
                tokenIn.decimals
            );

            // 获取预期输出金额
            const amounts = await this.routerContract.getAmountsOut(amountInWei, path);
            const amountOutMin = amounts[1].mul(1000 - slippage * 10).div(1000); // 考虑滑点

            // 设置交易截止时间
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分钟

            let tx;
            if (tokenIn.address === 'ETH') {
                // ETH to Token
                tx = await this.routerContract.swapExactETHForTokens(
                    amountOutMin,
                    path,
                    userAddress,
                    deadline,
                    { value: amountInWei }
                );
            } else if (tokenOut.address === 'ETH') {
                // Token to ETH
                tx = await this.routerContract.swapExactTokensForETH(
                    amountInWei,
                    amountOutMin,
                    path,
                    userAddress,
                    deadline
                );
            } else {
                // Token to Token
                tx = await this.routerContract.swapExactTokensForTokens(
                    amountInWei,
                    amountOutMin,
                    path,
                    userAddress,
                    deadline
                );
            }

            return await tx.wait();
        } catch (error) {
            console.error('Swap failed:', error);
            throw error;
        }
    }

    // 其他辅助方法...
    isSupportedNetwork(chainId) {
        return Object.values(UNISWAP_CONFIG.SUPPORTED_CHAINS).includes(chainId);
    }

    getTokenByAddress(address) {
        return Object.values(UNISWAP_CONFIG.TOKENS).find(
            token => token.address.toLowerCase() === address.toLowerCase()
        );
    }

    formatTokenAmount(amount, decimals) {
        return ethers.utils.formatUnits(amount, decimals);
    }

    parseTokenAmount(amount, decimals) {
        return ethers.utils.parseUnits(amount.toString(), decimals);
    }
}

export const uniswapService = new UniswapService(); 