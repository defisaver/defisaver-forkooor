const { getSender, validateTriggerPricesForCloseStrategyType } = require("../../utils");
const { subToStrategy } = require("../../utils");
const automationSdk = require("@defisaver/automation-sdk");
const { LIQUITY_V2_MARKETS, BOLD_TOKEN } = require("./view");
const { getAssetInfo } = require("@defisaver/tokens");

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

        const collToken = getAssetInfo(market).address;
        const marketAddr = LIQUITY_V2_MARKETS[market];

        const strategySub = automationSdk.strategySubService.liquityV2Encode.leverageManagement(
            marketAddr,
            troveId,
            collToken,
            BOLD_TOKEN,
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

/**
 * Subscribes to Liquity V2 leverage management strategy
 * @param {string} owner proxy owner
 * @param {string} market LiquityV2 market symbol. e.g WETH
 * @param {string} troveId ID of the trove
 * @param {number} price Threshold for price
 * @param {number} state 0 for OVER / 1 for UNDER
 * @param {number} targetRatio Target ratio
 * @param {number} isRepayOnPrice true for REPAY ON PRICE / false for BOOST ON PRICE
 * @param {number} bundleId Bundle ID (42 REPAY ON PRICE / 43 BOOST ON PRICE)
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {boolean} StrategySub object and ID of the subscription
 */
async function subLiquityV2LeverageManagementOnPrice(
    owner, market, troveId, price, state, targetRatio, isRepayOnPrice, bundleId, proxyAddr, useSafe
) {
    try {
        const [, proxy] = await getSender(owner, proxyAddr, useSafe);
        const collToken = getAssetInfo(market).address;
        const marketAddr = LIQUITY_V2_MARKETS[market];
        const strategySub = automationSdk.strategySubService.liquityV2Encode.leverageManagementOnPrice(
            bundleId,
            marketAddr,
            price,
            state,
            troveId,
            collToken,
            BOLD_TOKEN,
            targetRatio,
            isRepayOnPrice
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}


/**
 * Subscribes to Liquity V2 Close to Price strategy
 * @param {string} owner proxy owner
 * @param {string} market LiquityV2 market symbol. e.g WETH
 * @param {string} troveId ID of the trove
 * @param {number} stopLossPrice trigger price for stop loss
 * @param {number} takeProfitPrice trigger price for take profit
 * @param {number} closeStrategyType Type of close strategy. See automationSdk.enums.CloseStrategyType
 * @param {number} bundleId Bundle ID
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {boolean} StrategySub object and ID of the subscription
 */
async function subLiquityV2CloseToPrice(
    owner,
    market,
    troveId,
    stopLossPrice,
    takeProfitPrice,
    closeStrategyType,
    bundleId,
    proxyAddr,
    useSafe = true
) {
    try {
        const [, proxy] = await getSender(owner, proxyAddr, useSafe);

        const collToken = getAssetInfo(market).address;
        const marketAddr = LIQUITY_V2_MARKETS[market];

        const {
            stopLossType,
            takeProfitType
        } = validateTriggerPricesForCloseStrategyType(closeStrategyType, stopLossPrice, takeProfitPrice);

        const strategySub = automationSdk.strategySubService.liquityV2Encode.closeOnPrice(
            bundleId,
            marketAddr,
            troveId,
            collToken,
            BOLD_TOKEN,
            stopLossPrice,
            stopLossType,
            takeProfitPrice,
            takeProfitType
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    subLiquityV2LeverageManagement,
    subLiquityV2CloseToPrice,
    subLiquityV2LeverageManagementOnPrice
};
