# AIHarvest 脚本使用指南 (Script Usage Guide)

本目录包含用于AIHarvest项目的各种脚本，用于部署合约、查询状态和测试功能。以下是主要脚本的使用说明。

## 环境准备 (Environment Setup)

所有脚本都需要安装好Hardhat环境并配置好`.env`文件。确保您的`.env`文件包含以下内容：

```
PRIVATE_KEY=您的钱包私钥
INFURA_API_KEY=您的Infura API密钥
ETHERSCAN_API_KEY=您的Etherscan API密钥(可选，用于验证合约)
```

## 脚本列表 (Script List)

### 1. 代币查询与分发 (simple-token-distribute.js)

该脚本用于查询代币余额并可以向指定地址分发代币。

**使用方法:**
```bash
# 查询部署者的代币余额
npx hardhat run scripts/simple-token-distribute.js --network sepolia

# 向指定地址分发代币
set RECIPIENT_ADDRESS=0x接收者地址
npx hardhat run scripts/simple-token-distribute.js --network sepolia
```

### 2. 农场状态检查 (check-farm.js)

该脚本用于检查农场合约的状态，包括代币信息、质押量、奖励率等。

**使用方法:**
```bash
# 检查指定地址的农场
set FARM_ADDRESS=0x农场合约地址
npx hardhat run scripts/check-farm.js --network sepolia
```

### 3. ABI提取 (extract-abis.js)

该脚本用于从合约文件中提取ABI并生成前端可用的配置文件。

**使用方法:**
```bash
# 提取ABI并生成前端配置
npx hardhat run scripts/extract-abis.js
```

这会在项目根目录创建一个`frontend-abis`文件夹，其中包含:
- 每个合约的ABI文件 (.json)
- 导出所有ABI的index.js
- 包含合约地址的contracts-config.js

### 4. 合约部署 (deploy-*.js)

这些脚本用于部署各种合约。

**使用方法:**
```bash
# 部署Farm合约
npx hardhat run scripts/deploy-farm.js --network sepolia

# 部署SimpleSwapRouter合约
npx hardhat run scripts/deploy-simple-router.js --network sepolia
```

## 注意事项 (Notes)

1. Hardhat不支持直接向脚本传递位置参数，必须使用环境变量。

2. 确保在运行脚本前安装所有依赖:
   ```bash
   npm install
   ```

3. 如果遇到权限错误，请确保您的账户有足够的ETH支付gas费，并且有相应的代币权限。

4. 对于Windows用户，设置环境变量的语法:
   ```bash
   set VARIABLE_NAME=value
   ```
   
   对于Linux/Mac用户:
   ```bash
   export VARIABLE_NAME=value
   ```

## 帮助 (Help)

如果您需要更多帮助，请查看项目文档或联系开发团队。 