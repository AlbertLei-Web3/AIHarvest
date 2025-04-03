# AIHarvest 部署指南 | AIHarvest Deployment Guide
*Last Updated: 2025-04-03*

## 项目概览 | Project Overview

AIHarvest项目已从可升级合约设计转向使用非可升级的`SimpleSwapRouter`来简化部署流程和降低复杂性。本文档提供了当前部署状态和核心合约的详细说明。

AIHarvest project has moved from upgradeable contract design to a non-upgradeable `SimpleSwapRouter` to simplify deployment process and reduce complexity. This document provides the current deployment status and details about core contracts.

## 核心合约 | Core Contracts

当前项目使用以下核心合约：

The project currently uses the following core contracts:

1. **SimpleSwapRouter** - 非可升级的交换路由器，支持代币交换、流动性管理和费用设置
2. **FactoryUpgradeableV2** - 管理Farm合约的工厂合约
3. **FarmUpgradeableV2** - 质押和奖励Farm合约
4. **TestTokenUpgradeableV2** - 测试代币实现

## 已部署合约 | Deployed Contracts

以下合约已在Sepolia测试网上部署：

The following contracts have been deployed on Sepolia testnet:

| 合约 Contract | 地址 Address |
|---------------|--------------|
| SimpleSwapRouter | 0x5Dcde9e56b34e719a72CF060802D276dcb580730 |
| AIH代币 | 0xFcB512f45172aa1e331D926321eaA1C52D7dce8E |
| USDC代币 | 0xB35B48631b69478f28E4365CC1794E378Ad0FA02 |

## 部署脚本 | Deployment Scripts

### 主要部署脚本 | Main Deployment Script

`scripts/deploy-simple-router.js` - 提供完整的SimpleSwapRouter部署体验，包括：
- 部署SimpleSwapRouter合约
- 设置费用和国库地址
- 添加代币到白名单
- 设置流动性和汇率
- 保存部署信息到JSON文件

`scripts/deploy-simple-router.js` - Provides a complete SimpleSwapRouter deployment experience, including:
- Deploying the SimpleSwapRouter contract
- Setting fees and treasury address
- Adding tokens to whitelist
- Setting liquidity and exchange rates
- Saving deployment information to JSON files

### 其他有用脚本 | Other Useful Scripts

- `scripts/deployment-summary.js` - 显示已部署合约的状态和信息
- `scripts/deployment-final-summary.js` - 查询和显示更多部署细节
- `scripts/fix-swap-rate.js` - 修复交换汇率（如果需要）

## 部署步骤 | Deployment Steps

### 1. 环境准备 | Environment Preparation

确保环境变量正确设置：
Make sure environment variables are properly set:

```bash
PRIVATE_KEY=your_private_key
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 2. 部署合约 | Deploy Contracts

执行以下命令部署SimpleSwapRouter:
Run the following command to deploy SimpleSwapRouter:

```bash
npx hardhat run scripts/deploy-simple-router.js --network sepolia
```

部署过程将：
The deployment will:
- 部署SimpleSwapRouter合约
- 添加AIH和USDC代币到白名单
- 添加初始流动性
- 设置汇率（1 AIH = 1 USDC）
- 更新费用配置
- 设置最大交换金额
- 保存部署信息

### 3. 合约验证（可选）| Contract Verification (Optional)

如果需要在Etherscan上验证合约：
If you need to verify the contract on Etherscan:

```bash
npx hardhat verify --network sepolia 0x5Dcde9e56b34e719a72CF060802D276dcb580730 "0xYourTreasuryAddress" 300
```

### 4. 部署摘要 | Deployment Summary

运行部署摘要脚本查看部署状态：
Run the deployment summary script to see deployment status:

```bash
npx hardhat run scripts/deployment-final-summary.js --network sepolia
```

## 前端集成 | Frontend Integration

前端应用应使用`aiharvest/deployments/contracts-simple.json`文件中的合约信息。这个文件包含所有必要的合约地址和ABI引用，可以直接在前端使用。

Frontend applications should use the contract information in the `aiharvest/deployments/contracts-simple.json` file. This file contains all necessary contract addresses and ABI references that can be used directly in the frontend.

## 注意事项 | Notes

### 代币消耗 | Token Consumption

部署过程中，脚本将使用一些AIH和USDC代币来设置初始流动性。确保部署账户有足够的代币余额。

During deployment, the script will use some AIH and USDC tokens to set up initial liquidity. Make sure the deployment account has sufficient token balances.

### 未观察到ETH消耗 | No Observed ETH Consumption

如果未观察到ETH消耗，可能是因为交易尚未在区块链上确认或者交易失败。请检查交易状态。

If no ETH consumption is observed, it might be because the transaction has not been confirmed on the blockchain yet or the transaction failed. Please check the transaction status.

## 未来发展建议 | Recommendations for Future Development

1. **测试** - 进行全面的测试，包括单元测试和集成测试
2. **文档更新** - 随着项目发展不断更新部署文档
3. **前端兼容性** - 确保前端与新合约设计兼容
4. **安全审计** - 考虑进行正式的安全审计，特别是针对SimpleSwapRouter合约

1. **Testing** - Conduct comprehensive testing including unit tests and integration tests
2. **Documentation Updates** - Keep deployment documentation updated as the project evolves
3. **Frontend Compatibility** - Ensure frontend is compatible with the new contract design
4. **Security Audit** - Consider a formal security audit, especially for the SimpleSwapRouter contract 