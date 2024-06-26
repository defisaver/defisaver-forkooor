const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToStrategy, subToAaveV3Automation, addresses } = require("../../utils");
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
 * @param {boolean} useDefaultMarket whether to use the default market or not
 * @param {string} market aaveV3 market address
 * @param {string} owner proxy owner
 * @param {string} triggerBaseAssetSymbol trigger base asset symbol
 * @param {string} triggerQuoteAssetSymbol trigger quote asset symbol
 * @param {number} targetPrice trigger price
 * @param {number} priceState 'under' or 'over'
 * @param {string} collAssetSymbol symbol of the collateral asset
 * @param {string} debtAssetSymbol symbol of the debt asset
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveCloseToCollStrategy(
    useDefaultMarket,
    market,
    owner,
    triggerBaseAssetSymbol,
    triggerQuoteAssetSymbol,
    targetPrice,
    priceState,
    collAssetSymbol,
    debtAssetSymbol
) {
    try {
        const { chainId } = await hre.ethers.provider.getNetwork();
        const [, proxy] = await getSender(owner);

        let marketAddress = market;

        if (useDefaultMarket) {
            marketAddress = addresses[chainId].AAVE_V3_MARKET;
        }

        const collTokenData = getAssetInfo(collAssetSymbol === "ETH" ? "WETH" : collAssetSymbol, chainId);
        const debtTokenData = getAssetInfo(debtAssetSymbol === "ETH" ? "WETH" : debtAssetSymbol, chainId);
        const triggerBaseAssetData = getAssetInfo(triggerBaseAssetSymbol === "ETH" ? "WETH" : triggerBaseAssetSymbol, chainId);
        const triggerQuoteAssetData = getAssetInfo(triggerQuoteAssetSymbol === "ETH" ? "WETH" : triggerQuoteAssetSymbol, chainId);

        const triggerData = {
            baseTokenAddress: triggerBaseAssetData.address,
            quoteTokenAddress: triggerQuoteAssetData.address,
            price: targetPrice,
            ratioState: (priceState.toString().toLowerCase() === "under") ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER
        };

        const infos = await getFullTokensInfo(marketAddress, [collTokenData.address, debtTokenData.address]);
        const aaveCollInfo = infos[0];
        const aaveDebtInfo = infos[1];

        const subData = {
            collAsset: collTokenData.address,
            collAssetId: aaveCollInfo.assetId,
            debtAsset: debtTokenData.address,
            debtAssetId: aaveDebtInfo.assetId
        };

        let bundleId = automationSdk.enums.Bundles.MainnetIds.AAVE_V3_CLOSE_TO_COLLATERAL;

        if (chainId === 42161) {
            bundleId = automationSdk.enums.Bundles.ArbitrumIds.AAVE_V3_CLOSE_TO_COLLATERAL;
        } else if (chainId === 10) {
            bundleId = automationSdk.enums.Bundles.OptimismIds.AAVE_V3_CLOSE_TO_COLLATERAL;
        }

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
