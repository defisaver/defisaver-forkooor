const { subToStrategy, getSender, subToLiquityLeverageManagementAutomation } = require("../../utils");
const automationSdk = require("@defisaver/automation-sdk");


/**
 * Function that subscribes user to liquity dsr payback strategy
 * @param {string} eoa eoa of proxy that owns the trove
 * @param {number} triggerRatio ratio below which the sub will be triggered
 * @param {number} targetRatio ratio to payback the trove to
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} Obj that contains subId and strategySub
 */
async function subLiquityDsrPaybackStrategy(eoa, triggerRatio, targetRatio, proxyAddr, useSafe = true) {
    const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const strategySub = automationSdk.strategySubService.liquityEncode.dsrPayback(
        proxy.address, triggerRatio, targetRatio
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Function that subscribes user to liquity dsr supply strategy
 * @param {string} eoa eoa of proxy that owns the trove
 * @param {number} triggerRatio ratio below which the sub will be triggered
 * @param {number} targetRatio ratio to supply the trove to
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} Obj that contains subId and strategySub
 */
async function subLiquityDsrSupplyStrategy(eoa, triggerRatio, targetRatio, proxyAddr, useSafe = true) {
    const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const strategySub = automationSdk.strategySubService.liquityEncode.dsrSupply(
        proxy.address, triggerRatio, targetRatio
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Function that subscribes user to liquity debt in front repay strategy
 * @param {string} eoa eoa of proxy that owns the trove
 * @param {number} debtInFront minimum amount of debt in front where if below that amount we repay
 * @param {number} targetRatioIncrease percentage to increase the current ratio by
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} Obj that contains subId and strategySub
 */
async function subLiquityDebtInFrontRepayStrategy(eoa, debtInFront, targetRatioIncrease, proxyAddr, useSafe = true) {
    const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const strategySub = automationSdk.strategySubService.liquityEncode.debtInFrontRepay(
        proxy.address, debtInFront, targetRatioIncrease
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Function that subscribes user to Liquity trove leverage management strategies
 * @param {string} eoa eoa of proxy that owns the trove
 * @param {number} minRatio ratio below which the sub will be triggered, for repay strategy
 * @param {number} maxRatio ratio above which the sub will be triggered, for boost strategy
 * @param {number} targetRatioRepay ratio to repay the trove to
 * @param {number} targetRatioBoost ratio to boost the trove to
 * @param {boolean} boostEnabled is boost strategy enabled
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} Obj that contains subId and strategySub
 */
async function subLiquityLeverageManagementStrategies(eoa, minRatio, maxRatio, targetRatioRepay, targetRatioBoost, boostEnabled, proxyAddr, useSafe = true) {
    const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
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
