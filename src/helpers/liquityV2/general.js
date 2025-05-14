const hre = require("hardhat");

const { addressRegistryAbi, borrowOperationsAbi } = require("../../abi/liquityV2/abis");
const { setBalance, approve } = require("../../utils");
const { getLiquityV2Hints, LIQUITY_V2_MARKETS, getLiquityV2MaxUpfrontFee, ETH_GAS_COMPENSATION, getTroveInfo } = require("./view");
const { getAssetInfo } = require("@defisaver/tokens");

/**
 * Function that opens a liquityV2 trove
 * @param {string} sender eoa if eoa position or proxy owner
 * @param {string} troveOwner eoa if eoa position or proxy address
 * @param {number} troveOwnerIndex index used for the trove owner. This allows multiple troves to be opened by the same address
 * @param {string} market LiquityV2 market symbol. e.g WETH
 * @param {number} collAmount collateral amount
 * @param {number} boldAmount bold debt amount
 * @param {string} interestRate interest rate of the trove. e.g 5.5
 * @param {string} interestBatchManager address of the interest batch manager if this trove should be part of a batch. Defaults to address zero
 * @returns {Object} Obj that contains trove info
 */
async function openTroveV2(
    sender,
    troveOwner,
    troveOwnerIndex,
    market,
    collAmount,
    boldAmount,
    interestRate,
    interestBatchManager = hre.ethers.constants.AddressZero
) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const marketAddr = LIQUITY_V2_MARKETS[market];
    const marketContract = await hre.ethers.getContractAt(addressRegistryAbi, marketAddr);
    const borrowerOperationsAddr = await marketContract.borrowerOperations();
    let borrowerOperationsContract = await hre.ethers.getContractAt(borrowOperationsAbi, borrowerOperationsAddr);

    const collAmountFormatted = hre.ethers.utils.parseUnits(collAmount.toString(), 18);
    const boldAmountFormatted = hre.ethers.utils.parseUnits(boldAmount.toString(), 18);
    const annualInterestRateFormatted = hre.ethers.utils.parseUnits(interestRate.toString(), 16);
    const collTokenData = getAssetInfo(market, chainId);
    const wethTokenData = getAssetInfo("WETH", chainId);

    const { upperHint, lowerHint } = await getLiquityV2Hints(market, annualInterestRateFormatted);
    const maxUpfrontFee = await getLiquityV2MaxUpfrontFee(
        market, boldAmountFormatted, annualInterestRateFormatted, interestBatchManager
    );

    const senderAcc = await hre.ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    const ethGasCompensation = hre.ethers.utils.parseUnits(ETH_GAS_COMPENSATION, "ether");

    const collTokenAddress = collTokenData.addresses[chainId];
    const wethTokenAddress = wethTokenData.addresses[chainId];

    if (collTokenData.symbol === "WETH") {
        await setBalance(collTokenAddress, senderAcc.address, collAmountFormatted.add(ethGasCompensation));
        await approve(collTokenAddress, borrowerOperationsAddr, senderAcc.address);
    } else {
        await setBalance(collTokenAddress, senderAcc.address, collAmountFormatted);
        await approve(collTokenAddress, borrowerOperationsAddr, senderAcc.address);
        await setBalance(wethTokenAddress, senderAcc.address, ethGasCompensation);
        await approve(wethTokenAddress, borrowerOperationsAddr, senderAcc.address);
    }

    borrowerOperationsContract = borrowerOperationsContract.connect(senderAcc);

    if (interestBatchManager !== hre.ethers.constants.AddressZero) {
        const tx = await borrowerOperationsContract.openTroveAndJoinInterestBatchManager({
            owner: troveOwner,
            ownerIndex: troveOwnerIndex,
            collAmount: collAmountFormatted,
            boldAmount: boldAmountFormatted,
            upperHint,
            lowerHint,
            interestBatchManager,
            maxUpfrontFee,
            addManager: hre.ethers.constants.AddressZero,
            removeManager: hre.ethers.constants.AddressZero,
            receiver: hre.ethers.constants.AddressZero
        });

        await tx.wait();
    } else {
        const tx = await borrowerOperationsContract.openTrove(
            troveOwner,
            troveOwnerIndex,
            collAmountFormatted,
            boldAmountFormatted,
            upperHint,
            lowerHint,
            annualInterestRateFormatted,
            maxUpfrontFee,
            hre.ethers.constants.AddressZero,
            hre.ethers.constants.AddressZero,
            hre.ethers.constants.AddressZero
        );

        await tx.wait();
    }
    const encodedData = hre.ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "uint256"],
        [troveOwner, troveOwner, troveOwnerIndex]
    );
    const troveId = hre.ethers.utils.keccak256(encodedData);
    const troveInfo = await getTroveInfo(market, troveId);

    return troveInfo;
}

module.exports = {
    openTroveV2
};
