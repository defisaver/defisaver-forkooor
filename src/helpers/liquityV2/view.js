const hre = require("hardhat");

const { liquityV2ViewAbi, addressRegistryAbi, sortedTrovesAbi, hintHelpersAbi } = require("../../abi/liquityV2/abis");
const { addresses } = require("../../utils");

const LIQUITY_V2_MARKETS = {
    WETH: "0x7d2d2c79ec89c7f1d718ae1586363ad2c56ded9d",
    wstETH: "0x83b74f12a2894fcf7a4864eff6090d7d8a060c6b"
};

const BOLD_TOKEN = "0x4167ec9e6676876bcbcd1849d04220113bfbaa98";

const COLL_INDEX_BY_MARKET = {
    WETH: 0,
    wstETH: 1
};

const ETH_GAS_COMPENSATION = "0.0375";

/**
 * Function that fetches trove data from liquityV2
 * @param {string} market LiquityV2 market symbol
 * @param {string} troveId Id of the trove
 * @returns {Object} has trove position data
 */
async function getTroveInfo(market, troveId) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const liquityView = await hre.ethers.getContractAt(liquityV2ViewAbi, addresses[chainId].LIQUITY_V2_VIEW);
    const marketAddr = LIQUITY_V2_MARKETS[market];
    const troveInfo = await liquityView.getTroveInfo(marketAddr, troveId);

    return {
        troveId: troveInfo.troveId.toString(),
        owner: troveInfo.owner,
        collToken: troveInfo.collToken,
        status: troveInfo.status,
        collAmount: troveInfo.collAmount.toString(),
        debtAmount: troveInfo.debtAmount.toString(),
        collPrice: troveInfo.collPrice.toString(),
        TCRatio: troveInfo.TCRatio.toString(),
        annualInterestRate: troveInfo.annualInterestRate.toString(),
        interestBatchManager: troveInfo.interestBatchManager,
        batchDebtShares: troveInfo.batchDebtShares.toString()
    };
}

/**
 * Function that finds insertion hints based on interest rate
 * @param {string} market LiquityV2 market symbol
 * @param {string} interestRate Interest rate of the trove
 * @returns {{ upperHint: string, lowerHint: string}} Obj that contains insertion hints
 */
async function getLiquityV2Hints(market, interestRate) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const marketAddr = LIQUITY_V2_MARKETS[market];
    const marketContract = await hre.ethers.getContractAt(addressRegistryAbi, marketAddr);
    const sortedTrovesAddr = await marketContract.sortedTroves();
    const sortedTrovesContract = await hre.ethers.getContractAt(sortedTrovesAbi, sortedTrovesAddr);
    const trovesSize = await sortedTrovesContract.getSize();

    if (trovesSize <= 2) {
        return { upperHint: 0, lowerHint: 0 };
    }
    const numTrials = Math.floor(15 * Math.sqrt(trovesSize));
    const seed = 42;

    const liquityV2View = await hre.ethers.getContractAt(liquityV2ViewAbi, addresses[chainId].LIQUITY_V2_VIEW);

    const hints = await liquityV2View.getInsertPosition(
        marketAddr,
        COLL_INDEX_BY_MARKET[market],
        interestRate,
        numTrials,
        seed
    );

    const upperHint = hints[0];
    const lowerHint = hints[1];

    return { upperHint, lowerHint };
}

/**
 * Function that returns the max upfront fee for opening a trove
 * @param {string} market LiquityV2 market symbol
 * @param {string} borrowAmount borrow amount
 * @param {string} interestRate interest rate
 * @param {string} batchManager batch manager address if opening trove with batch. Defaults to address(0)
 * @returns {string} max upfront fee
 */
async function getLiquityV2MaxUpfrontFee(
    market,
    borrowAmount,
    interestRate,
    batchManager = hre.ethers.constants.AddressZero
) {
    const marketAddr = LIQUITY_V2_MARKETS[market];
    const marketContract = await hre.ethers.getContractAt(addressRegistryAbi, marketAddr);
    const hintHelpersAddr = await marketContract.hintHelpers();
    const hintHelpersContract = await hre.ethers.getContractAt(hintHelpersAbi, hintHelpersAddr);
    const collIndex = COLL_INDEX_BY_MARKET[market];

    if (batchManager !== hre.ethers.constants.AddressZero) {
        const fee = await hintHelpersContract.predictOpenTroveAndJoinBatchUpfrontFee(
            collIndex,
            borrowAmount,
            batchManager
        );

        return fee;
    }
    const fee = await hintHelpersContract.predictOpenTroveUpfrontFee(
        collIndex,
        borrowAmount,
        interestRate
    );

    return fee;
}


module.exports = {
    getTroveInfo,
    getLiquityV2Hints,
    getLiquityV2MaxUpfrontFee,
    LIQUITY_V2_MARKETS,
    COLL_INDEX_BY_MARKET,
    ETH_GAS_COMPENSATION,
    BOLD_TOKEN
};
