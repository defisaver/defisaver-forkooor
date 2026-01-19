const { ethers } = require("hardhat");
const { getSender, executeAction, setBalance, approve } = require("../../utils");
const dfs = require("@defisaver/sdk");
const { getInsertPosition, getTroveInfo, getHintsForAdjust } = require("./view");
const { getAssetInfo } = require("@defisaver/tokens");

const MAX_FEE_PERCENTAGE = ethers.utils.parseUnits("0.05");

/**
 * Function that opens a liquity trove
 * @param {string} eoa eoa of proxy that will own the trove
 * @param {number} collAmount collateral amount in the position in token units (supports decimals, e.g. 1.5)
 * @param {number} debtAmount debt amount in the position in token units (supports decimals, e.g. 2000.25)
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} Obj that contains trove info
 */
async function openTrove(eoa, collAmount, debtAmount, proxyAddr, useSafe = true) {
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);

    // lusd vault coll and debt assets are both 18 decimals
    const collAmountInWei = ethers.utils.parseUnits(collAmount.toString(), 18);
    const debtAmountInWei = ethers.utils.parseUnits(debtAmount.toString(), 18);
    const { upperHint, lowerHint } = await getInsertPosition(
        collAmountInWei,
        debtAmountInWei
    );

    await setBalance(getAssetInfo("WETH").address, senderAcc.address, collAmount);
    await approve(getAssetInfo("WETH").address, proxy.address, senderAcc.address);

    const liquityOpenAction = new dfs.actions.liquity.LiquityOpenAction(
        MAX_FEE_PERCENTAGE,
        collAmountInWei,
        debtAmountInWei,
        senderAcc.address,
        senderAcc.address,
        upperHint,
        lowerHint
    );

    const functionData = liquityOpenAction.encodeForDsProxyCall()[1];

    await executeAction("LiquityOpen", functionData, proxy);
    return getTroveInfo(proxy.address);
}

/**
 * Function that adjusts a liquity trove
 * @param {string} eoa eoa of proxy that owns the trove
 * @param {string} collAction "supply" | "withdraw"
 * @param {number} collAmount amount of collateral to supply/withdraw in token units (supports decimals, e.g. 1.5)
 * @param {string} debtAction "payback" | "borrow"
 * @param {number} debtAmount amount of debt to payback/borrow in token units (supports decimals, e.g. 2000.25)
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} Obj that contains trove info
 */
async function adjustTrove(eoa, collAction, collAmount, debtAction, debtAmount, proxyAddr, useSafe = true) {
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);

    // lusd vault coll and debt assets are both 18 decimals
    const collAmountInWei = ethers.utils.parseUnits(collAmount.toString(), 18);
    const debtAmountInWei = ethers.utils.parseUnits(debtAmount.toString(), 18);
    const { upperHint, lowerHint } = await getHintsForAdjust(
        proxy.address,
        collAction,
        collAmountInWei,
        debtAction,
        debtAmountInWei
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
        collAmountInWei,
        debtAmountInWei,
        collActionId,
        debtActionId,
        senderAcc.address,
        senderAcc.address,
        upperHint,
        lowerHint
    );

    const functionData = liquityAdjustAction.encodeForDsProxyCall()[1];

    await executeAction("LiquityAdjust", functionData, proxy);
    return getTroveInfo(proxy.address);
}

module.exports = {
    openTrove,
    adjustTrove
};
