const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 首先部署一个测试用的奖励代币
  const TestToken = await hre.ethers.getContractFactory("TestToken"); // 注意：你需要创建这个合约
  const testToken = await TestToken.deploy();
  await testToken.waitForDeployment();
  const testTokenAddress = await testToken.getAddress();
  console.log("TestToken deployed to:", testTokenAddress);

  // 部署 Factory 合约
  const Factory = await hre.ethers.getContractFactory("Factory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory deployed to:", factoryAddress);

  // 使用 Factory 创建 Farm
  const rewardPerSecond = ethers.parseEther("0.1"); // 每秒0.1个代币作为奖励
  const startTime = Math.floor(Date.now() / 1000) + 3600; // 1小时后开始

  const createFarmTx = await factory.createFarm(
    testTokenAddress,
    rewardPerSecond,
    startTime
  );
  await createFarmTx.wait();

  // 获取创建的Farm地址
  const farms = await factory.getAllFarms();
  console.log("Farm deployed to:", farms[0]);

  // 验证合约
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contracts...");
    await hre.run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: testTokenAddress,
      constructorArguments: [],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });