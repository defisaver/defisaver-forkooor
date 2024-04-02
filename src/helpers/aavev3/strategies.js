const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToStrategy, subToAaveV3Automation } = require("../../utils");

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
 * @param {string} owner proxy owner
 * @param {number} bundleId bundle id
 * @param {string} triggerBaseAsset trigger base asset
 * @param {string} triggerQuoteAsset trigger quote asset
 * @param {number} targetPrice trigger price
 * @param {number} priceState 1 for UNDER, 0 for OVER
 * @param {string} collAddress address of the collateral asset
 * @param {number} collId ID of the collateral asset
 * @param {string} debtAddress address of the debt asset
 * @param {number} debtId ID of the debt asset
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveCloseToCollStrategy(
    owner,
    bundleId,
    triggerBaseAsset,
    triggerQuoteAsset,
    targetPrice,
    priceState,
    collAddress,
    collId,
    debtAddress,
    debtId
) {
    try {
        const [, proxy] = await getSender(owner);

        const triggerData = {
            baseTokenAddress: triggerBaseAsset,
            quoteTokenAddress: triggerQuoteAsset,
            price: targetPrice,
            ratioState: (priceState === 1) ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER
        };

        const subData = {
            collAsset: collAddress,
            collAssetId: collId,
            debtAsset: debtAddress,
            debtAssetId: debtId
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
