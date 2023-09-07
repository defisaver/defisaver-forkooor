const automationSdk = require("@defisaver/automation-sdk");
const {getSender, subToStrategy} = require("../../utils");

async function subAaveV3CloseWithMaximumGasPriceStrategy(
    owner,
    strategyOrBundleId,
    triggerBaseTokenAddress, triggerQuoteTokenAddress, triggerPrice, triggerMaximumGasPrice, triggerRatioState,
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
            maximumGasPrice: triggerMaximumGasPrice,
            ratioState: triggerRatioState,
        },
        {
            collateralAsset: subCollAsset,
            collateralAssetId: subCollAssetId,
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
