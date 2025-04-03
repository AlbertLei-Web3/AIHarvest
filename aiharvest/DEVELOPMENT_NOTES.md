# AIHarvest开发笔记 | AIHarvest Development Notes
*最后更新 Last updated: 2025-04-03*

## 项目架构 | Project Architecture

AIHarvest项目已从可升级合约设计转向使用非可升级的`SimpleSwapRouter`。这一变更是为了简化部署流程，降低代码复杂性，并避免与可升级代理相关的初始化问题。

The AIHarvest project has transitioned from an upgradeable contract design to a non-upgradeable `SimpleSwapRouter`. This change was made to simplify the deployment process, reduce code complexity, and avoid initialization issues related to upgradeable proxies.

## 部署状态 | Deployment Status

### 已部署合约 | Deployed Contracts

| 合约 Contract | 地址 Address | 网络 Network |
|---------------|--------------|------------|
| SimpleSwapRouter | 0x5Dcde9e56b34e719a72CF060802D276dcb580730 | Sepolia |
| AIH代币 | 0xFcB512f45172aa1e331D926321eaA1C52D7dce8E | Sepolia |
| USDC代币 | 0xB35B48631b69478f28E4365CC1794E378Ad0FA02 | Sepolia |

### 部署时间 | Deployment Time
2025-04-03

### 部署账户 | Deployer Account
部署使用的是团队的多签钱包
Deployment was done using the team's multisig wallet

## 配置信息 | Configuration Information

### 交换费率 | Swap Fees
- LP费率 | LP Fee: 250 (2.5%)
- 协议费率 | Protocol Fee: 50 (0.5%)
- 总费率 | Total Fee: 300 (3%)

### 汇率 | Exchange Rates
- 1 AIH = 1 USDC

### 流动性池 | Liquidity Pools
- AIH-USDC: 初始流动性100,000单位 (Initial liquidity 100,000 units)

### 最大交换限额 | Maximum Swap Limit
- 500,000 个代币 (500,000 tokens)

## 关键开发决策 | Key Development Decisions

1. **从可升级到非可升级 | From Upgradeable to Non-upgradeable**
   - 问题: 可升级合约的初始化函数存在复杂性，导致部署失败
   - 解决方案: 创建非可升级的`SimpleSwapRouter`，保留所有功能但简化初始化
   - 影响: 无法进行合约升级，但简化了部署和减少了出错可能性

2. **费用结构 | Fee Structure**
   - 决策: 将费用分为LP费和协议费
   - 理由: 允许更灵活的费用管理，为协议和流动性提供者创造价值

3. **白名单功能 | Whitelist Functionality**
   - 决策: 实现代币白名单功能
   - 理由: 增强安全性，防止与恶意代币交互

4. **批量清理冗余文件 | Batch Cleaning of Redundant Files**
   - 决策: 删除不再使用的合约和脚本
   - 理由: 简化代码库和减少混淆

## 测试状态 | Testing Status

### 已完成测试 | Completed Tests
- 基本交换功能
- 流动性添加和移除
- 费用计算和分配
- 白名单功能

### 待测试项 | Pending Tests
- 极端情况下的汇率行为
- 高流量情况下的性能
- 安全漏洞扫描

## 未来工作 | Future Work

1. **前端集成 | Frontend Integration**
   - 更新前端以使用新的非可升级合约
   - 实现更好的流动性池可视化

2. **监控工具 | Monitoring Tools**
   - 开发工具来监控汇率和流动性

3. **第三方集成 | Third-party Integrations**
   - 探索与其他DeFi协议的集成机会

## 依赖版本 | Dependency Versions

- Solidity: 0.8.19
- OpenZeppelin Contracts: 4.9.3
- Hardhat: 2.17.2
- Ethers: 5.7.2

## 注意事项和警告 | Notes and Warnings

- `SimpleSwapRouter`不能升级，任何逻辑更改都需要重新部署
- 确保保留所有部署记录和地址信息
- 需要监控交换额度和流动性，以确保用户体验良好 