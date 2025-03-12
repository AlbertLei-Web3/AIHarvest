export const UNISWAP_CONFIG = {
    // Mainnet addresses
    V2_ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    V3_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    FACTORY_V2: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    FACTORY_V3: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    
    // 支持的网络
    SUPPORTED_CHAINS: {
        MAINNET: 1,
        GOERLI: 5,
        SEPOLIA: 11155111
    },
    
    // 常用代币列表
    TOKENS: {
        NATIVE_ETH: {
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            address: 'ETH'
        },
        WETH: {
            symbol: 'WETH',
            name: 'Wrapped Ethereum',
            decimals: 18,
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
        },
        USDC: {
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        },
        USDT: {
            symbol: 'USDT',
            name: 'Tether USD',
            decimals: 6,
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
        },
        DAI: {
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            decimals: 18,
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        }
    },
    
    // 默认设置
    SETTINGS: {
        SLIPPAGE_TOLERANCE: 0.5, // 0.5%
        TRANSACTION_DEADLINE: 20 * 60, // 20 minutes
        MAX_HOPS: 3
    }
} 