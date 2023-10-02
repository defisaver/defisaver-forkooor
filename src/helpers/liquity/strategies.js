const { ethers } = require("hardhat");
const { subToStrategy, getProxy } = require("../../utils");
const automationSdk = require("@defisaver/automation-sdk");


/**
 * Function that subscribes user to liquity dsr payback strategy
 * @param {Object} params function parameters with keys
 * @param {string} params.sender eoa of proxy that owns the trove
 * @param {number} params.triggerRatio ratio below which the sub will be triggered
 * @param {number} params.targetRatio ratio to payback the trove to
 * @returns {Object} Obj that contains subId and strategySub
 */
async function subLiqutityDsrPaybackStrategy({
    sender, triggerRatio, targetRatio
}) {
    const senderAcc = await ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);
    const strategySub = automationSdk.strategySubService.liquityEncode.dsrPayback(
        proxy.address, triggerRatio, targetRatio
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Function that subscribes user to liquity dsr supply strategy
 * @param {Object} params function parameters with keys
 * @param {string} params.sender eoa of proxy that owns the trove
 * @param {number} params.triggerRatio ratio below which the sub will be triggered
 * @param {number} params.targetRatio ratio to supply the trove to
 * @returns {Object} Obj that contains subId and strategySub
 */
async function subLiqutityDsrSupplyStrategy({
    sender, triggerRatio, targetRatio
}) {
    const senderAcc = await ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);
    const strategySub = automationSdk.strategySubService.liquityEncode.dsrSupply(
        proxy.address, triggerRatio, targetRatio
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

module.exports = {
    subLiqutityDsrPaybackStrategy,
    subLiqutityDsrSupplyStrategy
};
