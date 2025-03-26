const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Farm Contract Integration Tests", function () {
  let Factory, factory;
  let Farm;
  let TestToken, rewardToken, lpToken1, lpToken2;
  let owner, user1, user2, user3;
  let startTime;
  let farm;

  before(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy test tokens
    TestToken = await ethers.getContractFactory("TestToken");
    rewardToken = await TestToken.deploy();
    lpToken1 = await TestToken.deploy();
    lpToken2 = await TestToken.deploy();
    
    // Deploy Factory
    Factory = await ethers.getContractFactory("Factory");
    factory = await Factory.deploy();
    
    // Set start time in the future
    startTime = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
    
    // Create Farm
    const rewardPerSecond = ethers.parseEther("1"); // 1 token per second
    const tx = await factory.createFarm(
      await rewardToken.getAddress(),
      rewardPerSecond,
      startTime
    );
    
    const receipt = await tx.wait();
    const farms = await factory.getAllFarms();
    Farm = await ethers.getContractFactory("Farm");
    farm = Farm.attach(farms[0]);
    
    // Mint reward tokens to the farm
    await rewardToken.mint(await farm.getAddress(), ethers.parseEther("1000000"));
    
    // Mint LP tokens to users
    await lpToken1.mint(user1.address, ethers.parseEther("1000"));
    await lpToken1.mint(user2.address, ethers.parseEther("1000"));
    await lpToken1.mint(user3.address, ethers.parseEther("1000"));
    
    await lpToken2.mint(user1.address, ethers.parseEther("1000"));
    await lpToken2.mint(user2.address, ethers.parseEther("1000"));
    await lpToken2.mint(user3.address, ethers.parseEther("1000"));
    
    // Add pools
    await farm.addPool(await lpToken1.getAddress(), 100); // Pool 0 with alloc points 100
    await farm.addPool(await lpToken2.getAddress(), 50);  // Pool 1 with alloc points 50
  });

  describe("Initial Setup", function () {
    it("Should have correct reward token", async function () {
      expect(await farm.rewardToken()).to.equal(await rewardToken.getAddress());
    });

    it("Should have correct reward per second", async function () {
      expect(await farm.rewardPerSecond()).to.equal(ethers.parseEther("1"));
    });

    it("Should have correct start time", async function () {
      expect(await farm.startTime()).to.equal(startTime);
    });

    it("Should have correct pool details", async function () {
      const pool0 = await farm.poolInfo(0);
      const pool1 = await farm.poolInfo(1);
      
      expect(pool0.lpToken).to.equal(await lpToken1.getAddress());
      expect(pool0.allocPoint).to.equal(100);
      
      expect(pool1.lpToken).to.equal(await lpToken2.getAddress());
      expect(pool1.allocPoint).to.equal(50);
    });

    it("Should have correct total allocation points", async function () {
      expect(await farm.totalAllocPoint()).to.equal(150);
    });
  });

  describe("Staking Workflow", function () {
    it("Should allow users to stake LP tokens", async function () {
      // User1 stakes in pool 0
      await lpToken1.connect(user1).approve(await farm.getAddress(), ethers.parseEther("100"));
      await farm.connect(user1).deposit(0, ethers.parseEther("100"));
      
      // User2 stakes in pool 0
      await lpToken1.connect(user2).approve(await farm.getAddress(), ethers.parseEther("200"));
      await farm.connect(user2).deposit(0, ethers.parseEther("200"));
      
      // User3 stakes in pool 1
      await lpToken2.connect(user3).approve(await farm.getAddress(), ethers.parseEther("300"));
      await farm.connect(user3).deposit(1, ethers.parseEther("300"));
      
      // Check balances
      const user1Info = await farm.userInfo(0, user1.address);
      const user2Info = await farm.userInfo(0, user2.address);
      const user3Info = await farm.userInfo(1, user3.address);
      
      expect(user1Info.amount).to.equal(ethers.parseEther("100"));
      expect(user2Info.amount).to.equal(ethers.parseEther("200"));
      expect(user3Info.amount).to.equal(ethers.parseEther("300"));
    });

    it("Should prevent immediate withdrawals due to timelock", async function () {
      await expect(
        farm.connect(user1).withdraw(0, ethers.parseEther("50"))
      ).to.be.revertedWithCustomError(farm, "TokensLocked");
    });

    it("Should accumulate rewards over time", async function () {
      // Fast forward time past the start time and wait for rewards to accumulate
      await ethers.provider.send("evm_increaseTime", [120]); // 2 minutes
      await ethers.provider.send("evm_mine");
      
      // Check pending rewards
      const user1Rewards = await farm.pendingReward(0, user1.address);
      const user2Rewards = await farm.pendingReward(0, user2.address);
      const user3Rewards = await farm.pendingReward(1, user3.address);
      
      // User1 should have 1/3 of pool 0 rewards (100 / 300)
      // User2 should have 2/3 of pool 0 rewards (200 / 300)
      // User3 should have all of pool 1 rewards
      
      // Pool 0 gets 100/150 = 2/3 of total rewards
      // Pool 1 gets 50/150 = 1/3 of total rewards
      
      console.log("User1 rewards:", ethers.formatEther(user1Rewards));
      console.log("User2 rewards:", ethers.formatEther(user2Rewards));
      console.log("User3 rewards:", ethers.formatEther(user3Rewards));
      
      expect(user1Rewards).to.be.gt(0);
      expect(user2Rewards).to.be.gt(0);
      expect(user3Rewards).to.be.gt(0);
      
      // Check reward proportions approximately
      // User2 should have ~2x the rewards of User1
      const ratio = parseFloat(ethers.formatEther(user2Rewards)) / parseFloat(ethers.formatEther(user1Rewards));
      expect(ratio).to.be.closeTo(2, 0.1); // Allow 10% deviation due to block timing
    });

    it("Should allow withdrawals after timelock", async function () {
      // Fast forward time to pass the timelock
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");
      
      // Get initial reward token balance
      const initialBalance = await rewardToken.balanceOf(user1.address);
      
      // User1 withdraws half of their staked tokens
      await farm.connect(user1).withdraw(0, ethers.parseEther("50"));
      
      // Check LP tokens were returned
      const userInfo = await farm.userInfo(0, user1.address);
      expect(userInfo.amount).to.equal(ethers.parseEther("50"));
      
      // Check rewards were paid
      const finalBalance = await rewardToken.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should support the compound feature", async function () {
      // Fast forward time for more rewards
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");
      
      // Get initial staked amount
      const initialStake = (await farm.userInfo(0, user2.address)).amount;
      const initialRewards = await farm.pendingReward(0, user2.address);
      
      console.log("Initial stake:", ethers.formatEther(initialStake));
      console.log("Initial rewards:", ethers.formatEther(initialRewards));
      
      // User2 compounds their rewards
      await farm.connect(user2).compound(0);
      
      // Check new staked amount (should increase)
      const newStake = (await farm.userInfo(0, user2.address)).amount;
      console.log("New stake:", ethers.formatEther(newStake));
      
      expect(newStake).to.be.gt(initialStake);
      
      // Pending rewards should be reset or significantly reduced
      const newRewards = await farm.pendingReward(0, user2.address);
      console.log("New rewards:", ethers.formatEther(newRewards));
      expect(newRewards).to.be.lt(initialRewards);
    });

    it("Should allow users to withdraw all their tokens and claim rewards", async function () {
      // Get initial balances
      const initialLpBalance = await lpToken1.balanceOf(user1.address);
      const initialRewardBalance = await rewardToken.balanceOf(user1.address);
      
      // User1 withdraws remaining tokens
      await farm.connect(user1).withdraw(0, ethers.parseEther("50"));
      
      // Check LP tokens returned
      const finalLpBalance = await lpToken1.balanceOf(user1.address);
      expect(finalLpBalance.sub(initialLpBalance)).to.equal(ethers.parseEther("50"));
      
      // Check rewards paid
      const finalRewardBalance = await rewardToken.balanceOf(user1.address);
      expect(finalRewardBalance).to.be.gt(initialRewardBalance);
      
      // Check user has no stake left
      const userInfo = await farm.userInfo(0, user1.address);
      expect(userInfo.amount).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update allocation points", async function () {
      // Get initial alloc points
      const initialAllocPoint = (await farm.poolInfo(1)).allocPoint;
      expect(initialAllocPoint).to.equal(50);
      
      // Update allocation points
      await farm.setAllocationPoint(1, 75);
      
      // Check new allocation points
      const newAllocPoint = (await farm.poolInfo(1)).allocPoint;
      expect(newAllocPoint).to.equal(75);
      
      // Total alloc points should also be updated
      expect(await farm.totalAllocPoint()).to.equal(175); // 100 + 75
    });

    it("Should prevent non-owners from updating allocation points", async function () {
      await expect(
        farm.connect(user1).setAllocationPoint(0, 200)
      ).to.be.revertedWithCustomError(farm, "OwnableUnauthorizedAccount");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow emergency withdrawals", async function () {
      // Get initial LP balance
      const initialLpBalance = await lpToken2.balanceOf(user3.address);
      
      // User3 performs emergency withdrawal
      await farm.connect(user3).emergencyWithdraw(1);
      
      // Check LP tokens returned
      const finalLpBalance = await lpToken2.balanceOf(user3.address);
      expect(finalLpBalance.sub(initialLpBalance)).to.equal(ethers.parseEther("300"));
      
      // Check user has no stake left
      const userInfo = await farm.userInfo(1, user3.address);
      expect(userInfo.amount).to.equal(0);
    });

    it("Should allow owner to pause the contract", async function () {
      await farm.pause();
      expect(await farm.paused()).to.be.true;
      
      // Deposit should be rejected when paused
      await lpToken1.connect(user2).approve(await farm.getAddress(), ethers.parseEther("100"));
      await expect(
        farm.connect(user2).deposit(0, ethers.parseEther("100"))
      ).to.be.revertedWith("Pausable: paused");
      
      // Unpause
      await farm.unpause();
      expect(await farm.paused()).to.be.false;
    });
  });

  describe("Factory Interaction", function () {
    it("Should allow getting all farms from factory", async function () {
      const farms = await factory.getAllFarms();
      expect(farms.length).to.be.at.least(1);
      expect(farms[0]).to.equal(await farm.getAddress());
    });

    it("Should create a new farm with different parameters", async function () {
      const newStartTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const newRewardPerSecond = ethers.parseEther("0.5"); // 0.5 token per second
      
      const tx = await factory.createFarm(
        await rewardToken.getAddress(),
        newRewardPerSecond,
        newStartTime
      );
      
      await tx.wait();
      
      const farms = await factory.getAllFarms();
      const newFarm = Farm.attach(farms[1]);
      
      expect(await newFarm.rewardPerSecond()).to.equal(newRewardPerSecond);
      expect(await newFarm.startTime()).to.equal(newStartTime);
    });
  });
}); 