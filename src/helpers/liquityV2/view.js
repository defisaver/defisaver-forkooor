const hre = require("hardhat");

const { liquityV2ViewAbi, addressRegistryAbi, sortedTrovesAbi, hintHelpersAbi } = require("../../abi/liquityV2/abis");
const { addresses } = require("../../utils");

const LIQUITY_V2_MARKETS = {
    WETH: "0xde524be191de806011e98c8d36d50d7a88391a3e",
    wstETH: "0x1649ccb966c90ff524a15231bc177d77a275fda1",
    rETH: "0x6809ac46fa55e4d86be368c589427684616f91c2"
};

const BOLD_TOKEN = "0xbfe297dacb7a2b16df0c9d2b942d127dfb26fd59";

const COLL_INDEX_BY_MARKET = {
    WETH: 0,
    wstETH: 1,
    rETH: 2
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
    const troveInfo = await liquityView.callStatic.getTroveInfo(marketAddr, troveId);

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
