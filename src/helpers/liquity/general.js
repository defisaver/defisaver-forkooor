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
 * @param {number} params.collAmount collateral amount in the position
 * @param {number} params.debtAmount debt amount in the position
 * @param {string} params.proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} params.useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} Obj that contains trove info
 */
async function openTrove({ sender, collAmount, debtAmount, proxyAddr, useSafe = true }) {
    const senderAcc = ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    // lusd vault coll and debt assets are both 18 decimals
    const collAmountInWei = ethers.utils.parseUnits(collAmount.toString());
    const debtAmountInWei = ethers.utils.parseUnits(debtAmount.toString());

    const proxy = await getProxy(senderAcc.address, proxyAddr, useSafe);
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
 * @param {Object} params function parameters with keys
 * @param {string} params.sender eoa of proxy that owns the trove
 * @param {string} params.collAction "supply" | "withdraw"
 * @param {number} params.collAmount amount of collateral to supply/withdraw
 * @param {string} params.debtAction "payback" | "borrow"
 * @param {number} params.debtAmount amount of debt to payback/borrow
 * @param {string} params.proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} params.useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} Obj that contains trove info
 */
async function adjustTrove({ sender, collAction, collAmount, debtAction, debtAmount, proxyAddr, useSafe = true }) {
    const senderAcc = await ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    // lusd vault coll and debt assets are both 18 decimals
    const collAmountInWei = ethers.utils.parseUnits(collAmount.toString());
    const debtAmountInWei = ethers.utils.parseUnits(debtAmount.toString());

    const proxy = await getProxy(senderAcc.address, proxyAddr, useSafe);
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
