const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToSparkStrategy} = require("../../utils");

/**
 * Subscribes to DfsAutomation strategy
 * @param {string} owner Owner of Spark position
 * @param {number} minRatio Minimum ratio of Spark position (decimal number)
 * @param {number} maxRatio Maximum ratio of Spark position (decimal number)
 * @param {number} targetRepayRatio Target ratio for repay feature (decimal number)
 * @param {number} targetBoostRatio Target ratio for boost feature (decimal number)
 * @param {boolean} boostEnabled Is boost feature enabled
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subSparkDfsAutomationStrategy(owner, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled) {
    const [, proxy] = await getSender(owner);

    try {
        const strategySub = automationSdk.strategySubService.sparkEncode.leverageManagement(
            minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled
        );
        const subId = await subToSparkStrategy(proxy, strategySub);

        return { strategySub, boostSubId: subId, repaySubId: (subId - 1).toString() };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    subSparkDfsAutomationStrategy
};
