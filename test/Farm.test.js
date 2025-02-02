const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Farm Contract", function () {
    let Factory, factory;
    let Farm;
    let TestToken, rewardToken, lpToken;
    let owner, user1, user2;
    let startTime;

    beforeEach(async function () {
        // 获取签名者 getSigners
        [owner, user1, user2] = await ethers.getSigners();
        
        // 部署测试代币 deploy TestToken
        TestToken = await ethers.getContractFactory("TestToken");
        rewardToken = await TestToken.deploy();
        lpToken = await TestToken.deploy();
        
        // 部署 Factory
        Factory = await ethers.getContractFactory("Factory");
        factory = await Factory.deploy();
        
        // 设置开始时间 setStartTime
        startTime = Math.floor(Date.now() / 1000);
        
        // 创建 Farm
        const rewardPerSecond = ethers.parseEther("1");
        const tx = await factory.createFarm(
            await rewardToken.getAddress(),
            rewardPerSecond,
            startTime
        );
        
        const receipt = await tx.wait();
        const farms = await factory.getAllFarms();
        Farm = await ethers.getContractFactory("Farm");
        farm = Farm.attach(farms[0]);
        
        // 铸造测试代币 mint testToken
        await rewardToken.mint(await farm.getAddress(), ethers.parseEther("1000000"));
        await lpToken.mint(user1.address, ethers.parseEther("1000"));
        await lpToken.mint(user2.address, ethers.parseEther("1000"));
    });

    describe("Basic Functions", function () {
      it("Should add pool correctly", async function () {
        await farm.addPool(await lpToken.getAddress(), 100);
        expect(await farm.poolLength()).to.equal(1);
      });
  
      it("Should allow deposits and track user balance", async function () {
        // 添加流动性池 addPool
        await farm.addPool(await lpToken.getAddress(), 100);
        
        // 给用户一些LP代币
        await lpToken.mint(user1.address, ethers.parseEther("100"));
        
        // 授权Farm合约使用LP代币 approve farm contract use lpToken
        await lpToken.connect(user1).approve(await farm.getAddress(), ethers.parseEther("100"));
        
        // 存入LP代币 deposit lpToken
        await farm.connect(user1).deposit(0, ethers.parseEther("50"));
        
        // 检查用户余额
        const userInfo = await farm.userInfo(0, user1.address);
        expect(userInfo.amount).to.equal(ethers.parseEther("50"));
      });
  
      it("Should calculate and distribute rewards correctly", async function () {
        // 添加流动性池 addPool 
        await farm.addPool(await lpToken.getAddress(), 100);
        
        // 给用户LP代币并授权 mint lpToken and approve farm contract use lpToken
        await lpToken.mint(user1.address, ethers.parseEther("100"));
        await lpToken.connect(user1).approve(await farm.getAddress(), ethers.parseEther("100"));
        
        // 存入LP代币 deposit lpToken
        await farm.connect(user1).deposit(0, ethers.parseEther("50"));
        
        // 等待一段时间
        await ethers.provider.send("evm_increaseTime", [3600]); // 增加1小时
        await ethers.provider.send("evm_mine");
        
        // 检查待领取的奖励 pendingReward
        const pendingReward = await farm.pendingReward(0, user1.address);
        expect(pendingReward).to.be.gt(0);
      });
      it("Should allow withdrawal", async function () {
        // 添加流动性池 addPool
        await farm.addPool(await lpToken.getAddress(), 100);
        
        // 给用户LP代币并授权 mint lpToken and approve farm contract use lpToken
        await lpToken.mint(user1.address, ethers.parseEther("100"));
        await lpToken.connect(user1).approve(await farm.getAddress(), ethers.parseEther("100"));
        
        // 存入LP代币 deposit lpToken 
        await farm.connect(user1).deposit(0, ethers.parseEther("50"));
        
        // 提取LP代币 withdraw lpToken
        await farm.connect(user1).withdraw(0, ethers.parseEther("50"));
        
        // 检查用户余额
        const userInfo = await farm.userInfo(0, user1.address);
        expect(userInfo.amount).to.equal(0);
      });
    });
  
    describe("Security Features", function () {
      it("Should handle deposits safely", async function () {
          await farm.addPool(await lpToken.getAddress(), 100);
          
          // 给用户LP代币并授权 mint lpToken and approve farm contract use lpToken
          await lpToken.mint(user1.address, ethers.parseEther("100"));
          await lpToken.connect(user1).approve(await farm.getAddress(), ethers.parseEther("100"));
          
          // 正常存款应该成功 deposit lpToken
          await expect(
              farm.connect(user1).deposit(0, ethers.parseEther("50"))
          ).to.not.be.reverted;
          
          // 检查余额更新是否正确 check user balance update
          const userInfo = await farm.userInfo(0, user1.address);
          expect(userInfo.amount).to.equal(ethers.parseEther("50"));
      });
  
      it("Should only allow owner to add pools", async function () {
          await expect(
              farm.connect(user1).addPool(await lpToken.getAddress(), 100)
          ).to.be.revertedWithCustomError(
              farm,
              "OwnableUnauthorizedAccount"
          ).withArgs(user1.address);
      });
  });
  });  