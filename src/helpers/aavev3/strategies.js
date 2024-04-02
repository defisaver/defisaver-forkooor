const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToStrategy, subToAaveV3Automation } = require("../../utils");
const { getFullTokensInfo } = require("./view");
const { getAssetInfo } = require("@defisaver/tokens");

/**
 *
 * @param owner
 * @param strategyOrBundleId
 * @param triggerBaseTokenAddress
 * @param triggerQuoteTokenAddress
 * @param triggerPrice
 * @param triggerRatioState
 * @param triggerMaximumGasPrice
 * @param subCollAsset
 * @param subCollAssetId
 * @param subDebtAsset
 * @param subDebtAssetId
 */
async function subAaveV3CloseWithMaximumGasPriceStrategy(
    owner,
    strategyOrBundleId,
    triggerBaseTokenAddress, triggerQuoteTokenAddress, triggerPrice, triggerRatioState, triggerMaximumGasPrice,
    subCollAsset, subCollAssetId, subDebtAsset, subDebtAssetId
) {
    const [, proxy] = await getSender(owner);

    const strategySub = automationSdk.strategySubService.aaveV3Encode.closeToAssetWithMaximumGasPrice(
        strategyOrBundleId,
        true,
        {
            baseTokenAddress: triggerBaseTokenAddress,
            quoteTokenAddress: triggerQuoteTokenAddress,
            price: triggerPrice,
            ratioState: triggerRatioState,
            maximumGasPrice: triggerMaximumGasPrice
        },
        {
            collAsset: subCollAsset,
            collAssetId: subCollAssetId,
            debtAsset: subDebtAsset,
            debtAssetId: subDebtAssetId
        }
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { strategySub, subId };
}

/**
 * Subscribes to Aave V3 Automation strategy
 * @param {string} owner proxy owner
 * @param {int} minRatio ratio under which the strategy will trigger
 * @param {int} maxRatio ratio over which the strategy will trigger
 * @param {int} targetRepayRatio wanted ratio after repay
 * @param {int} targetBoostRatio wanted ratio after boost
 * @param {boolean} boostEnabled enable boost
 * @returns {boolean} StrategySub object and ID of the subscription
 */
async function subAaveAutomationStrategy(owner, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled) {

    try {
        const [, proxy] = await getSender(owner);

        const strategySub = automationSdk.strategySubService.aaveV3Encode.leverageManagement(
            minRatio, maxRatio, targetBoostRatio, targetRepayRatio, boostEnabled
        );

        const subId = await subToAaveV3Automation(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Subscribes to Aave V3 Close To Coll strategy
 * @param {string} market aaveV3 market address
 * @param {string} owner proxy owner
 * @param {number} bundleId bundle id
 * @param {string} triggerBaseAsset trigger base asset
 * @param {string} triggerQuoteAsset trigger quote asset
 * @param {number} targetPrice trigger price
 * @param {number} priceState 1 for UNDER, 0 for OVER
 * @param {string} collAssetSymbol symbol of the collateral asset
 * @param {string} debtAssetSymbol symbol of the debt asset
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveCloseToCollStrategy(
    market,
    owner,
    bundleId,
    triggerBaseAsset,
    triggerQuoteAsset,
    targetPrice,
    priceState,
    collAssetSymbol,
    debtAssetSymbol
) {
    try {
        const [, proxy] = await getSender(owner);

        const triggerData = {
            baseTokenAddress: triggerBaseAsset,
            quoteTokenAddress: triggerQuoteAsset,
            price: targetPrice,
            ratioState: (priceState === 1) ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER
        };

        const collTokenData = getAssetInfo(collAssetSymbol === "ETH" ? "WETH" : collAssetSymbol);
        const debtTokenData = getAssetInfo(debtAssetSymbol === "ETH" ? "WETH" : debtAssetSymbol);

        const infos = await getFullTokensInfo(market, [collTokenData.address, debtTokenData.address]);
        const aaveCollInfo = infos[0];
        const aaveDebtInfo = infos[1];

        const subData = {
            collAsset: collTokenData.address,
            collAssetId: aaveCollInfo.assetId,
            debtAsset: debtTokenData.address,
            debtAssetId: aaveDebtInfo.assetId
        };

        const strategySub = automationSdk.strategySubService.aaveV3Encode.closeToAsset(
            bundleId,
            true,
            triggerData,
            subData
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    subAaveV3CloseWithMaximumGasPriceStrategy,
    subAaveAutomationStrategy,
    subAaveCloseToCollStrategy
};
