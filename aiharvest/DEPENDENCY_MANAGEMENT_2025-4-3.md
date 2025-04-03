*Last Updated: 2025-04-03*
# AI Harvest 项目依赖关系管理文档

## 概述 Overview

本文档详细说明了AI Harvest项目的依赖关系管理策略，解决了之前存在的版本冲突问题，并提供了最佳实践指南。

## 依赖冲突问题 Dependency Conflict Issues

项目之前面临以下依赖冲突问题：

1. **ethers.js 版本冲突**：项目同时使用了`@nomicfoundation/hardhat-ethers`（设计用于ethers v6）和`@nomiclabs/hardhat-ethers`（仅支持ethers v5）。

2. **hardhat-ethers 双重导入**：存在两个不同系列的hardhat-ethers插件，这可能导致不一致的行为。

3. **OpenZeppelin库版本不确定**：使用^符号的版本范围可能导致不同环境下安装不同版本。

## 解决方案 Solutions

我们采取了以下措施解决这些问题：

### 1. 依赖版本固定 Fixed Dependencies

```json
{
  "devDependencies": {
    "@nomicfoundation/hardhat-verify": "^2.0.13",
    "@nomiclabs/hardhat-ethers": "^2.0.0",
    "@nomiclabs/hardhat-waffle": "^2.0.0",
    "@openzeppelin/hardhat-upgrades": "^2.5.1",
    "ethers": "^5.7.2",
    // ...其他依赖
  },
  "dependencies": {
    "@openzeppelin/contracts": "4.9.3",
    "@openzeppelin/contracts-upgradeable": "4.9.3"
  }
}
```

主要更改：
- 移除了`@nomicfoundation/hardhat-ethers`，统一使用`@nomiclabs/hardhat-ethers`
- 精确固定OpenZeppelin库版本为4.9.3，确保contracts和contracts-upgradeable使用相同版本

### 2. 简化部署流程 Simplified Deployment Process

创建了`deploy-simple.js`脚本，避免使用可能导致依赖冲突的OpenZeppelin Upgrades插件：

- 直接部署合约并手动初始化，而非使用代理模式
- 仍然保持合约逻辑的可升级性，通过Factory模式创建Farm实例
- 完整实现所有必要的部署步骤，包括代币铸造、流动性添加等

### 3. 新增脚本命令 New Script Commands

添加了新的npm脚本命令，使用简化的部署方式：

```json
"scripts": {
  // ...现有脚本
  "deploy-simple:local": "hardhat run scripts/deploy-simple.js --network localhost",
  "deploy-simple:sepolia": "hardhat run scripts/deploy-simple.js --network sepolia",
  "deploy-simple:mainnet": "hardhat run scripts/deploy-simple.js --network mainnet"
}
```

## 使用指南 Usage Guide

### 安装依赖 Installing Dependencies

```bash
npm install
```

### 编译合约 Compiling Contracts

```bash
npm run compile
```

### 部署合约 Deploying Contracts

**使用简化部署脚本 (推荐)：**

```bash
# 本地部署
npm run deploy-simple:local

# Sepolia测试网部署
npm run deploy-simple:sepolia

# 主网部署
npm run deploy-simple:mainnet
```

**使用原始升级代理部署脚本 (仅在需要时使用)：**

```bash
# 本地部署
npm run deploy:local

# Sepolia测试网部署
npm run deploy:sepolia
```

### 部署输出 Deployment Output

成功部署后，将生成以下文件：

1. `deployments/{network}-deployment.json` - 包含所有部署合约的详细信息
2. `contracts.json` - 前端集成所需的合约地址和ABI引用

## 最佳实践建议 Best Practices

### 合约升级 Contract Upgrades

虽然我们简化了部署流程，但仍然可以通过以下方式实现合约升级：

1. **TokenUpgradeable合约**：通过部署新版本并迁移状态
2. **FarmUpgradeable合约**：通过Factory更新实现地址，新创建的Farm将使用新实现
3. **Factory和SwapRouter**：需要单独升级并迁移数据

### 依赖管理 Dependency Management

1. 添加新依赖时，指定精确版本，避免使用^符号
2. 确保与ethers.js v5兼容，避免引入需要v6的库
3. 保持OpenZeppelin contracts和contracts-upgradeable版本完全一致

## 故障排除 Troubleshooting

### 编译错误 Compilation Errors

如遇编译错误，尝试清除缓存：

```bash
npx hardhat clean
npm run compile
```

### 部署错误 Deployment Errors

1. **Gas估算失败**：增加gasMultiplier参数或手动设置gas限制
2. **Nonce错误**：确保部署账户nonce正确，可能需要重置MetaMask nonce
3. **合约大小超限**：检查合约是否超过24KB限制，考虑拆分合约或优化代码

## 结论 Conclusion

通过以上优化，AI Harvest项目的依赖关系管理更加健壮，避免了版本冲突问题，并提供了更简单的部署方式。这些更改不影响合约的功能和可升级性，同时提高了开发和部署的稳定性。 