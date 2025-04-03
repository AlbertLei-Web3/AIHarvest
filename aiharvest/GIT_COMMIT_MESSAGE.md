feat(swap): Implement SimpleSwapRouter as non-upgradeable alternative

实现SimpleSwapRouter作为非可升级替代方案

- Replace the upgradeable SwapRouter with a simplified non-upgradeable version
  替换可升级的SwapRouter为简化的非可升级版本
  
- Resolve initialization issues caused by proxy pattern
  解决由代理模式引起的初始化问题
  
- Keep all functional features from SwapRouterV2 (whitelisting, fee settings)
  保留SwapRouterV2的所有功能特性（白名单、费率设置）
  
- Simplify deployment process using direct constructor initialization
  使用直接构造函数初始化简化部署过程
  
- Successfully deployed to Sepolia testnet (address: 0x5Dcde9e56b34e719a72CF060802D276dcb580730)
  成功部署到Sepolia测试网（地址：0x5Dcde9e56b34e719a72CF060802D276dcb580730）
  
- Add comprehensive deployment script with token whitelisting and liquidity setup
  添加全面的部署脚本，包括代币白名单和流动性设置
  
- Clean up redundant contract and script files
  清理冗余的合约和脚本文件
  
- Create development notes with deployment status and key decisions
  创建包含部署状态和关键决策的开发笔记 