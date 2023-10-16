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
async function subLiquityDsrPaybackStrategy({
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
async function subLiquityDsrSupplyStrategy({
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

/**
 * Function that subscribes user to liquity debt in front repay strategy
 * @param {Object} params function parameters with keys
 * @param {string} params.sender eoa of proxy that owns the trove
 * @param {number} params.debtInFrontMin minimum amount of debt in front where if below that amount we repay
 * @param {number} params.targetRatioIncrease percentage to increase the current ratio by
 * @returns {Object} Obj that contains subId and strategySub
 */
async function subLiquityDebtInFrontRepayStrategy({
    sender, debtInFrontMin, targetRatioIncrease
}) {
    const senderAcc = await ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);
    const strategySub = automationSdk.strategySubService.liquityEncode.debtInFrontRepay(
        proxy.address, debtInFrontMin, targetRatioIncrease
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

module.exports = {
    subLiquityDsrPaybackStrategy,
    subLiquityDsrSupplyStrategy,
    subLiquityDebtInFrontRepayStrategy
};
