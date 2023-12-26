const { ethers } = require("hardhat");
const { subToStrategy, getProxy, subToLiquityLeverageManagementAutomation } = require("../../utils");
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
 * @param {number} params.debtInFront minimum amount of debt in front where if below that amount we repay
 * @param {number} params.targetRatioIncrease percentage to increase the current ratio by
 * @returns {Object} Obj that contains subId and strategySub
 */
async function subLiquityDebtInFrontRepayStrategy({
    sender, debtInFront, targetRatioIncrease
}) {
    const senderAcc = await ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);
    const strategySub = automationSdk.strategySubService.liquityEncode.debtInFrontRepay(
        proxy.address, debtInFront, targetRatioIncrease
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Function that subscribes user to Liquity trove leverage management strategies
 * @param {Object} params function parameters with keys
 * @param {string} params.sender eoa of proxy that owns the trove
 * @param {number} params.minRatio ratio below which the sub will be triggered, for repay strategy
 * @param {number} params.maxRatio ratio above which the sub will be triggered, for boost strategy
 * @param {number} params.targetRatioRepay ratio to repay the trove to
 * @param {number} params.targetRatioBoost ratio to boost the trove to
 * @param {number} params.boostEnabled is boost strategy enabled
 * @returns {Object} Obj that contains subId and strategySub
 */
async function subLiquityLeverageManagementStrategies({
    sender, minRatio, maxRatio, targetRatioRepay, targetRatioBoost, boostEnabled
}) {
    const senderAcc = await ethers.provider.getSigner(sender.toString());

    senderAcc.address = senderAcc._address;

    const proxy = await getProxy(senderAcc.address);
    const strategySub = automationSdk.strategySubService.liquityEncode.leverageManagement(
        minRatio, maxRatio, targetRatioBoost, targetRatioRepay, boostEnabled
    );
    const subId = await subToLiquityLeverageManagementAutomation(proxy, strategySub);

    return { subId, strategySub };
}

module.exports = {
    subLiquityDsrPaybackStrategy,
    subLiquityDsrSupplyStrategy,
    subLiquityDebtInFrontRepayStrategy,
    subLiquityLeverageManagementStrategies
};
