const fs = require("fs");
const path = require("path");

// 加载配置
function loadConfig() {
  try {
    const configPath = path.join(__dirname, "../deployments/contracts-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return config;
  } catch (error) {
    console.error("Error loading config:", error);
    throw error;
  }
}

// 提取ABI
function extractABI(artifactPath) {
  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    return artifact.abi;
  } catch (error) {
    console.error(`提取ABI失败: ${error.message}`);
    return null;
  }
}

// 确保目录存在
function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
    console.log(`创建目录: ${directoryPath}`);
  }
}

async function main() {
  console.log("开始提取ABI文件...");
  
  // 加载配置
  const config = loadConfig();
  const abisPath = path.join(__dirname, "..", config.abisPath);
  
  console.log(`从以下目录读取合约ABI: ${abisPath}`);
  
  // 创建输出目录
  const outputDir = path.join(__dirname, "../frontend-abis");
  ensureDirectoryExists(outputDir);
  
  // 获取所有网络的合约
  const processedContracts = new Set();
  
  // 从每个网络提取合约ABI
  for (const [networkName, networkData] of Object.entries(config.networks)) {
    console.log(`\n处理网络: ${networkData.name} (${networkName})`);
    
    // 处理该网络的所有合约
    for (const [contractName, contractData] of Object.entries(networkData.contracts)) {
      // 避免重复处理相同的合约
      if (processedContracts.has(contractName)) {
        console.log(`跳过已处理的合约: ${contractName}`);
        continue;
      }
      
      const abiFileName = contractData.abiFile;
      if (!abiFileName) {
        console.log(`${contractName} 未指定ABI文件，跳过`);
        continue;
      }
      
      console.log(`处理合约: ${contractName}`);
      
      // 查找合约ABI文件
      let artifactFilePath = "";
      
      // 尝试在指定目录下查找ABI文件
      const contractDirPath = path.join(abisPath, `${contractName}.sol`);
      if (fs.existsSync(contractDirPath) && fs.statSync(contractDirPath).isDirectory()) {
        artifactFilePath = path.join(contractDirPath, abiFileName);
      } else {
        // 尝试直接在根目录查找
        artifactFilePath = path.join(abisPath, abiFileName);
      }
      
      if (!fs.existsSync(artifactFilePath)) {
        console.log(`找不到ABI文件: ${artifactFilePath}`);
        // 尝试递归搜索
        console.log(`尝试递归搜索ABI文件: ${abiFileName}`);
        
        function findFile(dir, filename) {
          const files = fs.readdirSync(dir);
          
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
              const found = findFile(filePath, filename);
              if (found) return found;
            } else if (file === filename) {
              return filePath;
            }
          }
          
          return null;
        }
        
        const foundPath = findFile(abisPath, abiFileName);
        if (foundPath) {
          artifactFilePath = foundPath;
          console.log(`在 ${artifactFilePath} 找到ABI文件`);
        } else {
          console.log(`无法找到ABI文件 ${abiFileName}，跳过此合约`);
          continue;
        }
      }
      
      // 提取ABI
      const abi = extractABI(artifactFilePath);
      if (!abi) {
        console.log(`无法从 ${artifactFilePath} 提取ABI`);
        continue;
      }
      
      // 将ABI写入输出文件
      const outputFile = path.join(outputDir, `${contractName}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(abi, null, 2));
      console.log(`ABI已写入: ${outputFile}`);
      
      // 标记为已处理
      processedContracts.add(contractName);
    }
  }
  
  // 创建索引文件，方便前端导入
  const indexFile = path.join(outputDir, "index.js");
  let indexContent = "// 自动生成的ABI导出文件\n\n";
  
  processedContracts.forEach(contractName => {
    indexContent += `import ${contractName}ABI from './${contractName}.json';\n`;
  });
  
  indexContent += "\nexport {\n";
  processedContracts.forEach(contractName => {
    indexContent += `  ${contractName}ABI,\n`;
  });
  indexContent += "};\n";
  
  fs.writeFileSync(indexFile, indexContent);
  console.log(`\n索引文件已创建: ${indexFile}`);
  
  // 创建配置文件，包含合约地址
  const configOutput = path.join(outputDir, "contracts-config.js");
  let configContent = "// 自动生成的合约配置文件\n\n";
  configContent += "const contractsConfig = {\n";
  
  // 添加网络
  configContent += "  networks: {\n";
  for (const [networkName, networkData] of Object.entries(config.networks)) {
    configContent += `    ${networkName}: {\n`;
    configContent += `      name: "${networkData.name}",\n`;
    configContent += `      chainId: ${networkData.chainId},\n`;
    configContent += `      rpcUrl: "${networkData.rpcUrl}",\n`;
    
    // 添加合约地址
    configContent += "      contracts: {\n";
    for (const [contractName, contractData] of Object.entries(networkData.contracts)) {
      if (processedContracts.has(contractName)) {
        configContent += `        ${contractName}: "${contractData.address}",\n`;
      }
    }
    configContent += "      },\n";
    
    // 添加代币信息
    configContent += "      tokens: {\n";
    for (const [tokenSymbol, tokenData] of Object.entries(networkData.tokens)) {
      configContent += `        ${tokenSymbol}: {\n`;
      configContent += `          address: "${tokenData.address}",\n`;
      configContent += `          decimals: ${tokenData.decimals},\n`;
      configContent += `          symbol: "${tokenData.symbol}",\n`;
      configContent += `          name: "${tokenData.name}"\n`;
      configContent += "        },\n";
    }
    configContent += "      }\n";
    
    configContent += "    },\n";
  }
  configContent += "  },\n";
  
  // 添加默认网络
  configContent += `  defaultNetwork: "${config.defaultNetwork}"\n`;
  configContent += "};\n\n";
  configContent += "export default contractsConfig;\n";
  
  fs.writeFileSync(configOutput, configContent);
  console.log(`合约配置文件已创建: ${configOutput}`);
  
  console.log("\nABI提取完成! 前端集成所需的文件已准备就绪。");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 