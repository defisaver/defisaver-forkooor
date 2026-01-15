const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToSparkStrategy, subToStrategy, getTokenInfo, getSparkMarketAddress } = require("../../utils");
const { getFullTokensInfo } = require("./view");

/**
 * Subscribes to DfsAutomation strategy
 * @param {string} eoa EOA address used as tx sender
 * @param {number} minRatio Minimum ratio of Spark position (decimal number)
 * @param {number} maxRatio Maximum ratio of Spark position (decimal number)
 * @param {number} targetRepayRatio Target ratio for repay feature (decimal number)
 * @param {number} targetBoostRatio Target ratio for boost feature (decimal number)
 * @param {boolean} boostEnabled Is boost feature enabled
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subSparkDfsAutomationStrategy(eoa, minRatio, maxRatio, targetRepayRatio, targetBoostRatio, boostEnabled, proxyAddr, useSafe = true) {
    try {
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

        const strategySub = automationSdk.strategySubService.sparkEncode.leverageManagement(
            minRatio, maxRatio, targetBoostRatio, targetRepayRatio, boostEnabled
        );
        const subId = await subToSparkStrategy(proxy, strategySub);

        return { strategySub, boostSubId: boostEnabled ? subId : "0", repaySubId: boostEnabled ? (subId - 1).toString() : subId };
    } catch (err) {
        console.error(err);
        throw err;
    }
}

/**
 * Subscribes to Spark Close On Price Generic strategy
 * @param {string} eoa EOA address used as tx sender
 * @param {string} market market address (optional, will use default market if not provided)
 * @param {string} collSymbol collateral asset symbol
 * @param {string} debtSymbol debt asset symbol
 * @param {number} stopLossPrice stop loss price (0 if not used)
 * @param {number} stopLossType stop loss type (0 for collateral, 1 for debt)
 * @param {number} takeProfitPrice take profit price (0 if not used)
 * @param {number} takeProfitType take profit type (0 for collateral, 1 for debt)
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the Safe as smart wallet or DSProxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subSparkCloseOnPriceGeneric(
    eoa,
    market,
    collSymbol,
    debtSymbol,
    stopLossPrice,
    stopLossType,
    takeProfitPrice,
    takeProfitType,
    proxyAddr,
    useSafe = true
) {
    try {
        const marketAddress = await getSparkMarketAddress(market);
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
        const user = proxy.address;

        const collAssetData = await getTokenInfo(collSymbol);
        const debtAssetData = await getTokenInfo(debtSymbol);

        const infos = await getFullTokensInfo(marketAddress, [collAssetData.address, debtAssetData.address]);
        const collAssetInfo = infos[0];
        const debtAssetInfo = infos[1];

        const { chainId } = await hre.ethers.provider.getNetwork();
        let bundleId;

        if (chainId === 1) {
            bundleId = automationSdk.enums.Bundles.MainnetIds.SPARK_CLOSE;
        } else {
            throw new Error(`Spark close-on-price bundle not available for chainId=${chainId}`);
        }

        const strategySub = automationSdk.strategySubService.sparkEncode.closeOnPriceGeneric(
            bundleId,
            collAssetData.address,
            collAssetInfo.assetId,
            debtAssetData.address,
            debtAssetInfo.assetId,
            marketAddress,
            user,
            stopLossPrice,
            stopLossType,
            takeProfitPrice,
            takeProfitType
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports = {
    subSparkDfsAutomationStrategy,
    subSparkCloseOnPriceGeneric
};
