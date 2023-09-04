const { ethers } = require("hardhat");
const { getProxy, executeAction, setBalance, approve } = require("../../utils");
const dfs = require("@defisaver/sdk");
const { getInsertPosition, getTroveInfo, getHintsForAdjust } = require("./view");
const { getAssetInfo } = require("@defisaver/tokens");

const MAX_FEE_PERCENTAGE = ethers.utils.parseUnits("0.05");

/**
 * Function that opens a liquity trove
 * @param {Object} params function parameters with keys
 * @param {string} params.sender eoa of proxy that will own the trove
 * @param {string} params.collAmount collateral amount in the position
 * @param {string} params.debtAmount debt amount in the position
 * @returns {Object} Obj that contains trove info
 */
async function openTrove({ sender, collAmount, debtAmount }) {
    const senderAcc = ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);
    const { upperHint, lowerHint } = await getInsertPosition(
        collAmount,
        debtAmount
    );

    await setBalance(getAssetInfo("WETH").address, senderAcc.address, collAmount);
    await approve(getAssetInfo("WETH").address, proxy.address, senderAcc.address);

    const liquityOpenAction = new dfs.actions.liquity.LiquityOpenAction(
        MAX_FEE_PERCENTAGE,
        collAmount,
        debtAmount,
        senderAcc.address,
        senderAcc.address,
        upperHint,
        lowerHint
    );

    const functionData = liquityOpenAction.encodeForDsProxyCall()[1];

    await executeAction("LiquityOpen", functionData, proxy);
    return getTroveInfo(sender);
}

/**
 * Function that adjusts a liquity trove
 * @param {Object} params function parameters with keys
 * @param {string} params.sender eoa of proxy that owns the trove
 * @param {string} params.collAction "supply" | "withdraw"
 * @param {string} params.collAmount amount of collateral to supply/withdraw
 * @param {string} params.debtAction "payback" | "borrow"
 * @param {string} params.debtAmount amount of debt to payback/borrow
 * @returns {Object} Obj that contains trove info
 */
async function adjustTrove({ sender, collAction, collAmount, debtAction, debtAmount }) {
    const senderAcc = await ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);
    const { upperHint, lowerHint } = await getHintsForAdjust(
        proxy.address,
        collAction,
        collAmount,
        debtAction,
        debtAmount
    );

    let collActionId;
    let debtActionId;

    if (collAction === "supply") {
        await setBalance(getAssetInfo("WETH").address, senderAcc.address, collAmount);
        await approve(getAssetInfo("WETH").address, proxy.address, senderAcc.address);
        collActionId = 0;
    } else {
        collActionId = 1;
    }
    if (debtAction === "payback") {
        await setBalance(getAssetInfo("LUSD").address, senderAcc.address, debtAmount);
        await approve(getAssetInfo("LUSD").address, proxy.address, senderAcc.address);
        debtActionId = 0;
    } else {
        debtActionId = 1;
    }

    const liquityAdjustAction = new dfs.actions.liquity.LiquityAdjustAction(
        MAX_FEE_PERCENTAGE,
        collAmount,
        debtAmount,
        collActionId,
        debtActionId,
        senderAcc.address,
        senderAcc.address,
        upperHint,
        lowerHint
    );

    const functionData = liquityAdjustAction.encodeForDsProxyCall()[1];

    await executeAction("LiquityAdjust", functionData, proxy);
    return getTroveInfo(sender);
}

module.exports = {
    openTrove,
    adjustTrove
};
