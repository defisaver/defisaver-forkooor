const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToStrategy, subToAaveV3Automation, addresses } = require("../../utils");
const { getFullTokensInfo } = require("./view");
const { getAssetInfo } = require("@defisaver/tokens");

/**
 * Subscribes to Aave V3 Close With Maximum Gas Price strategy
 * @param {string} owner wallet owner
 * @param {number} strategyOrBundleId strategy or bundle ID
 * @param {string} triggerBaseTokenAddress base token address
 * @param {string} triggerQuoteTokenAddress quote token address
 * @param {string} triggerPrice trigger price
 * @param {number} triggerRatioState trigger ratio state
 * @param {string} triggerMaximumGasPrice trigger maximum gas price
 * @param {string} subCollAsset collateral asset
 * @param {number} subCollAssetId collateral asset ID
 * @param {string} subDebtAsset debt asset
 * @param {number} subDebtAssetId debt asset ID
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV3CloseWithMaximumGasPriceStrategy(
    owner,
    strategyOrBundleId,
    triggerBaseTokenAddress, triggerQuoteTokenAddress, triggerPrice, triggerRatioState, triggerMaximumGasPrice,
    subCollAsset, subCollAssetId, subDebtAsset, subDebtAssetId,
    proxyAddr,
    useSafe = true
) {
    const [, proxy] = await getSender(owner, proxyAddr, useSafe);

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
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {boolean} StrategySub object and ID of the subscription
 */
async function subAaveAutomationStrategy(owner, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled, proxyAddr, useSafe = true) {

    try {
        const [, proxy] = await getSender(owner, proxyAddr, useSafe);

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
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
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
    debtAssetSymbol,
    proxyAddr,
    useSafe = true
) {
    try {
        const { chainId } = await hre.ethers.provider.getNetwork();
        const [, proxy] = await getSender(owner, proxyAddr, useSafe);

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

/**
 * Subscribes to Aave V3 Close To Coll strategy bundle
 * @param {boolean} useDefaultMarket whether to use the default market or not
 * @param {string} market aaveV3 market address
 * @param {string} owner proxy owner
 * @param {number} bundleId bundle ID
 * @param {number} triggerPrice trigger price
 * @param {string} triggerState 'under' or 'over'
 * @param {string} collAssetSymbol symbol of the collateral asset
 * @param {string} debtAssetSymbol symbol of the debt asset
 * @param {number} targetRatio target ratio
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV3OpenOrderFromCollateral(
    useDefaultMarket,
    market,
    owner,
    bundleId,
    triggerPrice,
    triggerState,
    collAssetSymbol,
    debtAssetSymbol,
    targetRatio,
    proxyAddr,
    useSafe = true
) {
    try {
        const { chainId } = await hre.ethers.provider.getNetwork();
        const [, proxy] = await getSender(owner, proxyAddr, useSafe);

        const marketAddress = useDefaultMarket ? addresses[chainId].AAVE_V3_MARKET : market;
        const collTokenData = getAssetInfo(collAssetSymbol === "ETH" ? "WETH" : collAssetSymbol, chainId);
        const debtTokenData = getAssetInfo(debtAssetSymbol === "ETH" ? "WETH" : debtAssetSymbol, chainId);

        const infos = await getFullTokensInfo(marketAddress, [collTokenData.address, debtTokenData.address]);
        const aaveCollInfo = infos[0];
        const aaveDebtInfo = infos[1];

        const strategySub = automationSdk.strategySubService.aaveV3Encode.openOrder(
            bundleId,
            true,
            {
                baseTokenAddress: collTokenData.address,
                quoteTokenAddress: debtTokenData.address,
                price: triggerPrice,
                state: (triggerState.toString().toLowerCase() === "under") ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER,
            },
            {
                collAsset: collTokenData.address,
                collAssetId: aaveCollInfo.assetId,
                debtAsset: debtTokenData.address,
                debtAssetId: aaveDebtInfo.assetId,
                marketAddr: marketAddress,
                targetRatio,
                useOnBehalf: false,
            },
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
    subAaveCloseToCollStrategy,
    subAaveV3OpenOrderFromCollateral
};
