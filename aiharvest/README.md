# AI Harvest - DeFi Yield Farming Platform

AI Harvest 是一个去中心化收益耕作平台，集成了可升级智能合约，提供质押、兑换和治理功能。

This repository contains the smart contracts for the AI Harvest platform, built with upgradeable contracts using the OpenZeppelin UUPS proxy pattern.

## 目录结构 (Project Structure)

```
aiharvest/
├── contracts/           # 智能合约源码
│   ├── FarmUpgradeable.sol         # 可升级的收益农场合约 (V1)
│   ├── FarmUpgradeableV2.sol       # 收益农场合约升级版 (V2)
│   ├── FactoryUpgradeable.sol      # 工厂合约 (V1)
│   ├── FactoryUpgradeableV2.sol    # 工厂合约升级版 (V2)
│   ├── SwapRouterUpgradeable.sol   # 代币交换路由 (V1)
│   ├── SwapRouterUpgradeableV2.sol # 代币交换路由升级版 (V2)
│   ├── TestTokenUpgradeable.sol    # 测试代币 (V1)
│   └── TestTokenUpgradeableV2.sol  # 测试代币升级版 (V2)
├── scripts/            # 部署和管理脚本
│   ├── deploy-and-setup.js         # 使用UUPS代理模式的部署脚本
│   ├── deploy-simple.js            # 简化部署脚本（推荐）
│   ├── upgrade-contracts.js        # 合约升级脚本
│   └── generate-contracts-json.js  # 合约信息生成脚本
├── DEPENDENCY_MANAGEMENT.md  # 依赖管理文档
├── abis/              # 合约ABI文件 (由generate-contracts-json.js生成)
├── contracts.json     # 部署的合约地址和ABI引用 (由部署脚本生成)
└── .env               # 环境变量配置
```

## 环境要求 (Requirements)

- Node.js v16+
- npm 或 yarn
- MetaMask 或其他以太坊钱包 (与前端交互时)

## 安装 (Installation)

1. 克隆仓库并安装依赖：

```bash
git clone [your-repo-url]
cd aiharvest
npm install
```

2. 配置环境变量：

复制 `.env.example` 文件为 `.env` 并填入你的配置：

```bash
# 私钥 (用于部署)
PRIVATE_KEY=your_private_key_here
# Infura项目ID (用于连接网络)
INFURA_PROJECT_ID=your_infura_project_id
# Etherscan API密钥 (用于合约验证)
ETHERSCAN_API_KEY=your_etherscan_api_key
# 部署设置
TREASURY_ADDRESS=your_treasury_address
FARM_LOCK_DURATION=86400
INITIAL_SUPPLY=1000000
```

## 编译合约 (Compiling Contracts)

```bash
npm run compile
```

## 部署合约 (Deploying Contracts)

有几种部署选项：

### 推荐方式：简化部署 (Recommended: Simplified Deployment)

这种方式避免了OpenZeppelin升级插件的依赖冲突问题，同时保持了合约的可升级性。

```bash
# 本地部署
npm run deploy-simple:local

# Sepolia测试网部署
npm run deploy-simple:sepolia

# 主网部署
npm run deploy-simple:mainnet
```

### 替代方式：代理模式部署 (Alternative: Proxy Pattern Deployment)

如果你需要使用完整的UUPS代理模式，可以使用原始部署脚本（需要确保依赖兼容）：

```bash
# 启动本地Hardhat节点
npm run node

# 在另一个终端窗口，部署合约
npm run deploy:local

# 或在Sepolia测试网上部署
npm run deploy:sepolia
```

## 依赖管理 (Dependency Management)

本项目解决了一些关键依赖冲突问题：
- ethers.js版本冲突
- hardhat插件兼容性问题
- OpenZeppelin库版本控制

详细信息请参阅 [依赖管理文档](./DEPENDENCY_MANAGEMENT.md)。

## 合约升级 (Contract Upgrades)

合约升级有两种方式：

### 1. 使用简化部署方式的升级策略

- 为Factory注册新的Farm实现合约
- 部署新版本合约并迁移状态
- 参考 `DEPENDENCY_MANAGEMENT.md` 中的升级最佳实践

### 2. 使用UUPS代理的升级流程

1. 在 `upgrade-contracts.js` 中填入已部署合约的地址
2. 运行升级脚本：

```bash
npm run upgrade:local
# 或
npm run upgrade:sepolia
```

注意：此脚本会将 V1 合约升级到 V2 版本，只有在需要新功能或修复时才应运行。

## 为前端生成合约信息 (Generating Contract Info for Frontend)

部署合约后，文件 `contracts.json` 会自动生成。如需手动生成，运行：

```bash
npm run generate-contracts
```

这将创建：
- `contracts.json` - 包含合约地址和ABI引用
- `abis/` 目录 - 包含各个合约的ABI文件

你可以将这些文件复制到前端项目中使用。

## 与合约交互 (Interacting with Contracts)

### 在前端代码中：

```javascript
import contractsInfo from './contracts.json';
import { ethers } from 'ethers';

// 连接到Web3提供者
async function connectWallet() {
  // 使用MetaMask或其他Web3提供者
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // 创建合约实例
      const aihToken = new ethers.Contract(
        contractsInfo.contracts.AIHToken.address,
        require('./abis/' + contractsInfo.contracts.AIHToken.abi),
        signer
      );
      
      const farm = new ethers.Contract(
        contractsInfo.contracts.Farm.address,
        require('./abis/' + contractsInfo.contracts.Farm.abi),
        signer
      );
      
      const swapRouter = new ethers.Contract(
        contractsInfo.contracts.SwapRouter.address,
        require('./abis/' + contractsInfo.contracts.SwapRouter.abi),
        signer
      );
      
      return { provider, signer, contracts: { aihToken, farm, swapRouter } };
    } catch (error) {
      console.error("User rejected connection", error);
    }
  } else {
    console.error("No Ethereum browser extension detected");
  }
}

// 使用示例：
async function exampleInteraction() {
  const { signer, contracts } = await connectWallet();
  const userAddress = await signer.getAddress();
  
  // 获取代币余额
  const balance = await contracts.aihToken.balanceOf(userAddress);
  console.log("AIH余额:", ethers.utils.formatEther(balance));
  
  // 查询Farm池子信息
  const poolLength = await contracts.farm.poolLength();
  console.log("Farm池子数量:", poolLength.toString());
  
  // 质押代币
  const stakeAmount = ethers.utils.parseEther("10");
  await contracts.aihToken.approve(contracts.farm.address, stakeAmount);
  await contracts.farm.deposit(0, stakeAmount); // 池子ID 0, 质押10个代币
  
  // 查询待领取奖励
  const pendingReward = await contracts.farm.pendingReward(0, userAddress);
  console.log("待领取奖励:", ethers.utils.formatEther(pendingReward));
  
  // 代币兑换
  const swapAmount = ethers.utils.parseEther("5");
  await contracts.aihToken.approve(contracts.swapRouter.address, swapAmount);
  await contracts.swapRouter.swap(
    contracts.aihToken.address,  // fromToken
    contractsInfo.contracts.StableCoin.address,  // toToken
    swapAmount  // amount
  );
}
```

## 合约架构 (Contract Architecture)

系统使用可升级的智能合约架构，基于OpenZeppelin的UUPS代理模式。主要组件包括：

### Factory (工厂合约)
- 创建和管理Farm和SwapRouter实例
- 存储和升级合约实现

### Farm (收益农场)
- 管理用户质押和奖励
- 支持多种代币池和复利功能

### SwapRouter (交换路由)
- 提供代币兑换功能
- 收取交易费用支持流动性提供者

### TestToken (测试代币)
- ERC20兼容的代币实现
- 用于测试和演示

## V2升级功能 (V2 Upgrade Features)

V2版本的合约添加了以下功能：

### FarmUpgradeableV2
- 提前解锁功能(需付费)
- 奖励加速功能(可以提高收益率)
- 支持分类管理池子

### SwapRouterUpgradeableV2
- 交易金额限制
- 代币白名单功能
- 批量操作支持

### FactoryUpgradeableV2
- 批量部署Farm功能
- 系统统计功能
- 黑名单功能

### TestTokenUpgradeableV2
- 暂停功能
- 黑名单功能
- 最大供应量限制

## 安全考虑 (Security Considerations)

- 所有合约都实现了重入保护
- 使用OpenZeppelin的权限控制系统
- 限制敏感操作只能由所有者执行
- 异常情况有紧急提款功能

## License

[MIT](LICENSE) 