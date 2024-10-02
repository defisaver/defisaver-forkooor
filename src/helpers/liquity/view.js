const { ethers } = require("hardhat");
const { liquityViewAbi } = require("../../abi/liquity/abis");

const LIQUITY_VIEW = "0xb760e60Dff6263E8Ab31B04ee5Cc010beA47e2Df";
const numOfTrials = 20;
const randomSeed = 42;

/**
 * Format trove data
 * @param {Object} toveData has trove position data
 * @returns {Object} has trove position data with key names
 */
async function convertToJson(toveData) {
    return {
        troveStatus: toveData.troveStatus.toNumber(),
        collAmount: toveData.collAmount.toString(),
        debtAmount: toveData.debtAmount.toString(),
        collPrice: toveData.collPrice.toString(),
        TCRatio: toveData.TCRatio.toString(),
        borrowingFeeWithDecay: toveData.borrowingFeeWithDecay.toString(),
        recoveryMode: toveData.recoveryMode
    };
}

/**
 * Function that fetches trove data from liquity
 * @param {string} owner Address that owns the trove
 * @returns {Object} has trove position data
 */
async function getTroveInfo(owner) {
    const liquityView = new ethers.Contract(LIQUITY_VIEW, liquityViewAbi);

    return liquityView.getTroveInfo(owner).then(r => convertToJson(r));
}

/**
 * Function that finds insertion hints based on CR
 * @param {string} collAmount collateral amount in the position
 * @param {string} debtAmount debt amount in the position
 * @returns {{ upperHint: string, lowerHint: string}} Obj that contains insertion hints
 */
async function getInsertPosition(collAmount, debtAmount) {
    const [signer] = await ethers.getSigners();
    const liquityView = new ethers.Contract(LIQUITY_VIEW, liquityViewAbi, signer);

    const { upperHint, lowerHint } = await liquityView.getInsertPosition(collAmount, debtAmount, numOfTrials, randomSeed);

    return { upperHint, lowerHint };
}

/**
 * Function that finds insertion hints based on the position and adjust action params
 * @param {string} owner Address that owns the trove
 * @param {string} collAction "supply" | "withdraw"
 * @param {string} collAmount collateral amount change
 * @param {string} debtAction "payback" | "borrow"
 * @param {string} debtAmount debt amount change
 * @returns {{ upperHint: string, lowerHint: string}} Obj that contains insertion hints
 */
async function getHintsForAdjust(owner, collAction, collAmount, debtAction, debtAmount) {
    const collActionId = collAction === "supply" ? 0 : 1;
    const debtActionId = debtAction === "payback" ? 0 : 1;
    const [signer] = await ethers.getSigners();
    const liquityView = new ethers.Contract(LIQUITY_VIEW, liquityViewAbi, signer);

    const NICR = await liquityView.predictNICRForAdjust(owner, collActionId, debtActionId, owner, collAmount, debtAmount);

    const { hintAddress: approxHint } = await liquityView.getApproxHint(NICR, numOfTrials, randomSeed);

    return liquityView.findInsertPosition(NICR, approxHint, approxHint);
}

module.exports = {
    getTroveInfo,
    getInsertPosition,
    getHintsForAdjust
};
