const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToSparkStrategy } = require("../../utils");

/**
 * Subscribes to DfsAutomation strategy
 * @param {string} owner Owner of Spark position
 * @param {number} minRatio Minimum ratio of Spark position (decimal number)
 * @param {number} maxRatio Maximum ratio of Spark position (decimal number)
 * @param {number} targetRepayRatio Target ratio for repay feature (decimal number)
 * @param {number} targetBoostRatio Target ratio for boost feature (decimal number)
 * @param {boolean} boostEnabled Is boost feature enabled
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subSparkDfsAutomationStrategy(owner, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled, proxyAddr, useSafe = true) {
    const [, proxy] = await getSender(owner, proxyAddr, useSafe);

    try {
        const strategySub = automationSdk.strategySubService.sparkEncode.leverageManagement(
            minRatio, maxRatio, targetBoostRatio, targetRepayRatio, boostEnabled
        );
        const subId = await subToSparkStrategy(proxy, strategySub);

        return { strategySub, boostSubId: boostEnabled ? subId : "0", repaySubId: boostEnabled ? (subId - 1).toString() : subId };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    subSparkDfsAutomationStrategy
};
