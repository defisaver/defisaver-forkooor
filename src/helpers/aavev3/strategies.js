const automationSdk = require("@defisaver/automation-sdk");
const {getSender, subToStrategy} = require("../../utils");

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
            maximumGasPrice: triggerMaximumGasPrice,
        },
        {
            collAsset: subCollAsset,
            collAssetId: subCollAssetId,
            debtAsset: subDebtAsset,
            debtAssetId: subDebtAssetId,
        }
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { strategySub, subId };
}

module.exports = {
    subAaveV3CloseWithMaximumGasPriceStrategy,
};
