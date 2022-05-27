// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AaveFlashLoanReceiver is FlashLoanSimpleReceiverBase {
    constructor(IPoolAddressesProvider _provider)
        FlashLoanSimpleReceiverBase(_provider)
    {}

    /**
    @notice This function starts a flash loan sequence
    @dev Caller must approve required interest before calling this
    @param _tokenContractAddr Address of the ERC20 token contract to borrow tokens from
    @param _tokenAmtToBorrow Amount of tokens (atomic) to borrow
    @param _rateOfInterestMax Max rate of interest; e.g, pass 1 for 0.01%; this number is divided by 10000 at the time of use
     */
    function startFlashLoan(
        address _tokenContractAddr,
        uint256 _tokenAmtToBorrow,
        uint16 _rateOfInterestMax
    ) external {
        // Max premium
        uint256 maxPremium = ((_tokenAmtToBorrow * _rateOfInterestMax) / 10000);

        // Transfer premium from caller
        IERC20(_tokenContractAddr).transferFrom(
            msg.sender,
            address(this),
            maxPremium
        );

        // Get flash loan
        POOL.flashLoanSimple(
            address(this),
            _tokenContractAddr,
            _tokenAmtToBorrow,
            abi.encode(msg.sender, maxPremium),
            0
        );
    }

    /**
     * @notice Executes an operation after receiving the flash-borrowed asset
     * @dev Ensure that the contract can return the debt + premium, e.g., has
     *      enough funds to repay and has approved the Pool to pull the total amount
     * @param asset The address of the flash-borrowed asset
     * @param amount The amount of the flash-borrowed asset
     * @param premium The fee of the flash-borrowed asset
     * @param params Params from the `startFlashLoan` function
     * @return True if the execution of the operation succeeds, false otherwise
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address,
        bytes calldata params
    ) external returns (bool) {
        // Asset contract
        IERC20 assetContract = IERC20(asset);

        // Get address of borrower and premium amount
        (address borrower, uint256 maxPremium) = abi.decode(
            params,
            (address, uint256)
        );

        // Check if contract has enough balance to repay loan
        require(maxPremium >= premium, "INSUFFICIENT BALANCE TO REPAY LOAN");

        // Repay the debt by alllowing pool to transfer to itself the borrowed tokens + interest
        assetContract.approve(address(POOL), amount + premium);

        // Refund remaining tokens that was provided for premium
        uint256 refundAmt = maxPremium - premium;
        if (refundAmt > 0) {
            assetContract.transfer(borrower, refundAmt);
        }

        // Return
        return true;
    }

    /**
    @notice To receive eth from outside
     */
    receive() external payable {}
}
