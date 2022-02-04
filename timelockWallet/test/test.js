const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("TimeLock Wallet", function () {

  let Timelock;
  let timelock;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Timelock = await ethers.getContractFactory("TimeLock");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contract, we just have to call Timelock.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    timelock = await Timelock.deploy();
  });

  describe("Deployment", function() {
    it("Should deploy to the right owner", async function(){

      expect(await timelock.owner()).to.equal(owner.address);
    });
  });

  describe("Sending funds", function() {
    it("Should send funds to the wallet", async function(){
      let txn = await timelock.deposit({
        value: ethers.utils.parseEther("5")
      });
      await txn.wait();
      txn = await timelock.deposit({
        value: ethers.utils.parseEther("10")
      });
      await txn.wait();
      const bal = await timelock.balances(owner.address);
      expect(ethers.utils.formatEther(bal)).to.be.equal('15.0');
    });

    it("Should send funds to the respective addresses", async function () {
      let txn = await timelock.deposit({
        value: ethers.utils.parseEther("5")
      });
      await txn.wait();
      txn = await timelock.connect(addr1).deposit({
        value: ethers.utils.parseEther("10")
      });
      await txn.wait();
      const bal = await timelock.balances(owner.address);
      const bal1 = await timelock.balances(addr1.address);
      expect(ethers.utils.formatEther(bal) == 5);
      expect(ethers.utils.formatEther(bal) == 10);     
    });
  });

  describe("Withdrawal", function () {
    it("Should not be able to withraw till 5 minutes", async function() {
      let txn = await timelock.deposit({
        value: ethers.utils.parseEther("50")
      });
      await txn.wait();
      const bal = await timelock.balances(owner.address);
      expect(timelock.withdraw()).to.be.revertedWith("Lock time not expired");
    });

    it("Should be able to withraw after 5 minutes", async function() {
      let txn = await timelock.deposit({
        value: ethers.utils.parseEther("50")
      });
      await txn.wait();
      await network.provider.send("evm_increaseTime", [300]);
      await network.provider.send("evm_mine");
      let withdraw = await timelock.withdraw();
      await withdraw.wait();
      const bal = await timelock.balances(owner.address);
      expect(ethers.utils.formatEther(bal)).to.equal("0.0");

    });

    it("Should be able to withraw after it's respective locktime", async function() {
      let txn = await timelock.deposit({
        value: ethers.utils.parseEther("50")
      });
      await txn.wait();
      txn = await timelock.connect(addr1).deposit({
        value: ethers.utils.parseEther("30")
      });
      await txn.wait();
      await timelock.connect(addr1).increaseLockTime(400);
      await network.provider.send("evm_increaseTime", [300]);
      await network.provider.send("evm_mine");
      let withdraw = await timelock.withdraw();
      await withdraw.wait();
      const bal = await timelock.balances(owner.address);
      const bal1 = await timelock.balances(addr1.address);
      console.log(ethers.utils.formatEther(bal1));
      expect(ethers.utils.formatEther(bal)).to.equal("0.0");
      //expect(timelock.connect(addr1).withdraw()).to.be.revertedWith("Lock time not expired");
      await network.provider.send("evm_increaseTime", [400]);
      await network.provider.send("evm_mine");
      let withdraw1 = await timelock.connect(addr1).withdraw();
      await withdraw1.wait();
      const bal2 = await timelock.balances(addr1.address);
      console.log(ethers.utils.formatEther(bal2));
      expect(ethers.utils.formatEther(bal2)).to.equal("0.0");
    });

  });

});
