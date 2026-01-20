const { getSender, validateTriggerPricesForCloseStrategyType, subToStrategy } = require("../../utils");
const automationSdk = require("@defisaver/automation-sdk");
const { LIQUITY_V2_MARKETS, BOLD_TOKEN } = require("./view");
const { getAssetInfo } = require("@defisaver/tokens");

/**
 * Subscribes to Liquity V2 leverage management strategy
 * @param {string} eoa EOA address
 * @param {string} market LiquityV2 market symbol. e.g WETH
 * @param {string} troveId ID of the trove
 * @param {number} triggerRatio Trigger ratio
 * @param {number} targetRatio Target ratio
 * @param {number} ratioState 1 for UNDER/REPAY and 2 for OVER/BOOST
 * @param {string} smartWallet Optional proxy address. If not provided, a new wallet will be created
 * @param {boolean} useSafe Whether to use Safe as smart wallet or dsproxy if smartWallet is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subLiquityV2LeverageManagement(
    eoa, market, troveId, triggerRatio, targetRatio, ratioState, smartWallet, useSafe = true
) {
    const [, proxy] = await getSender(eoa, smartWallet, useSafe);

    // Read bundle ID from automations-sdk (Mainnet only)
    const ratioStateEnum = ratioState === 1 ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER;
    const bundleId = ratioStateEnum === automationSdk.enums.RatioState.UNDER
        ? automationSdk.enums.Bundles.MainnetIds.LIQUITY_V2_REPAY
        : automationSdk.enums.Bundles.MainnetIds.LIQUITY_V2_BOOST;

    const collTokenData = getAssetInfo(market, 1);
    const collToken = collTokenData.addresses[1];
    const marketAddr = LIQUITY_V2_MARKETS[market];

    const strategySub = automationSdk.strategySubService.liquityV2Encode.leverageManagement(
        marketAddr,
        troveId,
        collToken,
        BOLD_TOKEN,
        ratioStateEnum,
        targetRatio,
        triggerRatio,
        bundleId
    );

    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Subscribes to Liquity V2 leverage management on price strategy
 * @param {string} eoa EOA address
 * @param {string} market LiquityV2 market symbol. e.g WETH
 * @param {string} troveId ID of the trove
 * @param {number} triggerPrice Trigger price threshold
 * @param {number} priceState 0 for OVER / 1 for UNDER
 * @param {number} targetRatio Target ratio
 * @param {boolean} isRepayOnPrice true for REPAY ON PRICE / false for BOOST ON PRICE
 * @param {string} smartWallet Optional proxy address. If not provided, a new wallet will be created
 * @param {boolean} useSafe Whether to use Safe as smart wallet or dsproxy if smartWallet is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subLiquityV2LeverageManagementOnPrice(
    eoa, market, troveId, triggerPrice, priceState, targetRatio, isRepayOnPrice, smartWallet, useSafe = true
) {
    const [, proxy] = await getSender(eoa, smartWallet, useSafe);

    // Read bundle ID from automations-sdk (Mainnet only)
    const bundleId = isRepayOnPrice
        ? automationSdk.enums.Bundles.MainnetIds.LIQUITY_V2_REPAY_ON_PRICE
        : automationSdk.enums.Bundles.MainnetIds.LIQUITY_V2_BOOST_ON_PRICE;

    const collTokenData = getAssetInfo(market, 1);
    const collToken = collTokenData.addresses[1];
    const marketAddr = LIQUITY_V2_MARKETS[market];

    const strategySub = automationSdk.strategySubService.liquityV2Encode.leverageManagementOnPrice(
        bundleId,
        marketAddr,
        triggerPrice,
        priceState,
        troveId,
        collToken,
        BOLD_TOKEN,
        targetRatio,
        isRepayOnPrice
    );

    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}


/**
 * Subscribes to Liquity V2 Close to Price strategy
 * @param {string} eoa EOA address
 * @param {string} market LiquityV2 market symbol. e.g WETH
 * @param {string} troveId ID of the trove
 * @param {number} stopLossPrice Trigger price for stop loss (0 if not used)
 * @param {number} takeProfitPrice Trigger price for take profit (0 if not used)
 * @param {number} closeStrategyType Type of close strategy. See automationSdk.enums.CloseStrategyType
 * @param {string} smartWallet Optional proxy address. If not provided, a new wallet will be created
 * @param {boolean} useSafe Whether to use Safe as smart wallet or dsproxy if smartWallet is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subLiquityV2CloseToPrice(
    eoa, market, troveId, stopLossPrice, takeProfitPrice, closeStrategyType, smartWallet, useSafe = true
) {
    const [, proxy] = await getSender(eoa, smartWallet, useSafe);

    // Read bundle ID from automations-sdk (Mainnet only)
    const bundleId = automationSdk.enums.Bundles.MainnetIds.LIQUITY_V2_CLOSE;

    const collTokenData = getAssetInfo(market, 1);
    const collToken = collTokenData.addresses[1];
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
}


/**
 * Subscribes to Liquity V2 payback strategy
 * @param {string} eoa EOA address
 * @param {string} market LiquityV2 market symbol. e.g WETH
 * @param {string} troveId ID of the trove
 * @param {number} triggerRatio Trigger ratio
 * @param {number} targetRatio Target ratio
 * @param {string} smartWallet Optional proxy address. If not provided, a new wallet will be created
 * @param {boolean} useSafe Whether to use Safe as smart wallet or dsproxy if smartWallet is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subLiquityV2Payback(
    eoa, market, troveId, triggerRatio, targetRatio, smartWallet, useSafe = true
) {
    const [, proxy] = await getSender(eoa, smartWallet, useSafe);

    const marketAddr = LIQUITY_V2_MARKETS[market];

    const strategySub = automationSdk.strategySubService.liquityV2Encode.payback(
        marketAddr,
        troveId,
        BOLD_TOKEN,
        targetRatio,
        automationSdk.enums.RatioState.UNDER,
        triggerRatio
    );

    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Subscribes to Liquity V2 interest rate adjustment strategy
 * @param {string} eoa EOA address
 * @param {string} market LiquityV2 market symbol. e.g WETH
 * @param {string} troveId ID of the trove
 * @param {number} criticalDebtInFrontLimit Critical debt in front limit
 * @param {number} nonCriticalDebtInFrontLimit Non-critical debt in front limit
 * @param {number} interestRateChange Interest rate change
 * @param {string} smartWallet Optional proxy address. If not provided, a new wallet will be created
 * @param {boolean} useSafe Whether to use Safe as smart wallet or dsproxy if smartWallet is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subLiquityV2InterestRateAdjustmentBundle(
    eoa, market, troveId, criticalDebtInFrontLimit, nonCriticalDebtInFrontLimit, interestRateChange, smartWallet, useSafe = true
) {
    const [, proxy] = await getSender(eoa, smartWallet, useSafe);

    const marketAddr = LIQUITY_V2_MARKETS[market];

    const strategySub = automationSdk.strategySubService.liquityV2Encode.interestRateAdjustment(
        marketAddr,
        troveId,
        criticalDebtInFrontLimit,
        nonCriticalDebtInFrontLimit,
        interestRateChange
    );

    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

module.exports = {
    subLiquityV2LeverageManagement,
    subLiquityV2CloseToPrice,
    subLiquityV2LeverageManagementOnPrice,
    subLiquityV2Payback,
    subLiquityV2InterestRateAdjustmentBundle
};
