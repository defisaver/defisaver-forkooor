const { getSender } = require("../../utils");
const { subToStrategy } = require("../../utils");
const automationSdk = require("@defisaver/automation-sdk");
const { LIQUITY_V2_MARKETS } = require("./view");

/**
 * Subscribes to Liquity V2 leverage management strategy
 * @param {string} owner proxy owner
 * @param {string} market LiquityV2 market symbol. e.g WETH
 * @param {string} troveId ID of the trove
 * @param {number} ratio Trigger ratio
 * @param {number} targetRatio Target ratio
 * @param {number} ratioState 1 for UNDER/REPAY and 2 for OVER/BOOST
 * @param {number} bundleId Bundle ID
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {boolean} StrategySub object and ID of the subscription
 */
async function subLiquityV2LeverageManagement(
    owner, market, troveId, ratio, targetRatio, ratioState, bundleId, proxyAddr, useSafe = true
) {
    try {
        const [, proxy] = await getSender(owner, proxyAddr, useSafe);

        const marketAddr = LIQUITY_V2_MARKETS[market];

        const strategySub = automationSdk.strategySubService.liquityV2Encode.leverageManagement(
            marketAddr,
            troveId,
            ratioState === 1 ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER,
            targetRatio,
            ratio,
            bundleId
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    subLiquityV2LeverageManagement
};
