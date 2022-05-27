import { assert } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { AaveFlashLoanReceiver } from "../typechain";
import { DAI_CONTRACT_ADDR, POOL_ADDR_PROVIDER, DAI_CONTRACT_ABI } from "./constants";

describe("AaveFlashLoanReceiver", function () {

  ////////////////////
  // VARIABLES
  ////////////////////

  let aaveFlashLoanReceiver: AaveFlashLoanReceiver;
  let signers: Array<Signer>;

  ////////////////////
  // BEFORE HOOKS
  ////////////////////
  beforeEach(async () => {
    signers = await ethers.getSigners();

    const aaveFlashLoanReceiverFactory = await ethers.getContractFactory("AaveFlashLoanReceiver");
    aaveFlashLoanReceiver = await aaveFlashLoanReceiverFactory.deploy(POOL_ADDR_PROVIDER);
    await aaveFlashLoanReceiver.deployed();
  });

  ////////////////////
  // TESTS
  ////////////////////

  it("Flashloans should work correctly", async function () {
    const borrower = signers[4];
    const maxInterestPerc = 10;
    const daiAmtToBorrow = ethers.utils.parseUnits("100", 18);
    const daiContract = await ethers.getContractAt(DAI_CONTRACT_ABI, DAI_CONTRACT_ADDR, borrower) as any;
    const daiPremiumMaxAmt = daiAmtToBorrow.mul(maxInterestPerc).div(100);

    // Mint enough DAI for testing, and get balance
    borrower.sendTransaction({
      
    })
    await daiContract["mint(uint256)"](daiPremiumMaxAmt);
    const daiBalanceBefore = await daiContract.balanceOf(await borrower.getAddress()) as BigNumber;

    // Approve DAI transfer for premium
    await daiContract.approve(aaveFlashLoanReceiver.address, daiPremiumMaxAmt);

    // Take and repay flash loan
    await aaveFlashLoanReceiver.connect(borrower).startFlashLoan(DAI_CONTRACT_ADDR, daiAmtToBorrow, maxInterestPerc * 100);

    // Test
    const daiBalanceAfter = await daiContract.balanceOf(await borrower.getAddress()) as BigNumber;
    assert.isTrue(daiBalanceBefore.gt(daiBalanceAfter), "Flash loan did not work!");
  });

});
