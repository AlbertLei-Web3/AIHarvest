import { UNISWAP_CONFIG } from './uniswap.config.js';

class UniswapService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.chainId = null;
        this.initialized = false;
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

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Uniswap service:', error);
            throw error;
        }
    }

    isSupportedNetwork(chainId) {
        return Object.values(UNISWAP_CONFIG.SUPPORTED_CHAINS).includes(chainId);
    }

    // 获取代币列表
    getTokenList() {
        return Object.values(UNISWAP_CONFIG.TOKENS);
    }

    // 根据地址获取代币信息
    getTokenByAddress(address) {
        return Object.values(UNISWAP_CONFIG.TOKENS).find(
            token => token.address.toLowerCase() === address.toLowerCase()
        );
    }

    // 检查代币是否已被批准
    async checkTokenAllowance(tokenAddress, ownerAddress, spenderAddress) {
        try {
            const tokenContract = new ethers.Contract(
                tokenAddress,
                ['function allowance(address,address) view returns (uint256)'],
                this.provider
            );
            
            const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
            return allowance;
        } catch (error) {
            console.error('Error checking token allowance:', error);
            throw error;
        }
    }

    // 批准代币
    async approveToken(tokenAddress, spenderAddress, amount) {
        try {
            const tokenContract = new ethers.Contract(
                tokenAddress,
                ['function approve(address,uint256) returns (bool)'],
                this.signer
            );
            
            const tx = await tokenContract.approve(spenderAddress, amount);
            return await tx.wait();
        } catch (error) {
            console.error('Error approving token:', error);
            throw error;
        }
    }

    // 获取代币余额
    async getTokenBalance(tokenAddress, ownerAddress) {
        try {
            if (tokenAddress === 'ETH') {
                const balance = await this.provider.getBalance(ownerAddress);
                return balance;
            }

            const tokenContract = new ethers.Contract(
                tokenAddress,
                ['function balanceOf(address) view returns (uint256)'],
                this.provider
            );
            
            const balance = await tokenContract.balanceOf(ownerAddress);
            return balance;
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw error;
        }
    }

    // 格式化代币金额
    formatTokenAmount(amount, decimals) {
        return ethers.utils.formatUnits(amount, decimals);
    }

    // 解析代币金额
    parseTokenAmount(amount, decimals) {
        return ethers.utils.parseUnits(amount.toString(), decimals);
    }
}

export const uniswapService = new UniswapService(); 