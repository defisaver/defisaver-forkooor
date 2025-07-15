const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, addresses, getLatestSubId, executeActionFromProxy, subToStrategy, validateTriggerPricesForCloseStrategyType } = require("../../utils");
const { compoundV3SubProxyAbi } = require("../../abi/compoundV3/abis");
const { compoundV3SubProxyL2Abi } = require("../../abi/compoundV3/abis");
const { COMP_V3_MARKETS } = require("./view");
const { getAssetInfo } = require("@defisaver/tokens");

/**
 * Helper method for getting compound sub proxy contract
 * @returns {Object} subProxyAddr and subProxy
 */
async function getSubProxyContract() {
    const { chainId } = await hre.ethers.provider.getNetwork();
    const [singer] = await hre.ethers.getSigners();
    const subProxyAddr = addresses[chainId].COMP_V3_SUB_PROXY;
    const subProxyAbi = chainId === 1 ? compoundV3SubProxyAbi : compoundV3SubProxyL2Abi;

    return {
        subProxyAddr,
        subProxy: new hre.ethers.Contract(subProxyAddr, subProxyAbi, singer)
    };
}

/**
 * Subscribes to Compound V3 Automation strategy
 * @param {Object} proxy owner's proxy
 * @param {string} strategySub strategySub properly encoded
 * @returns {string} ID of the subscription
 */
async function _subToCompoundV3Automation(proxy, strategySub) {
    const { subProxyAddr, subProxy } = await getSubProxyContract();

    const functionData = subProxy.interface.encodeFunctionData(
        "subToCompV3Automation",
        [strategySub]
    );

    await executeActionFromProxy(proxy, subProxyAddr, functionData);

    const latestSubId = await getLatestSubId();

    return latestSubId;
}

/**
 * Subscribes to Compound V3 Automation strategy
 * @param {string} owner proxy owner
 * @param {string} market compoundV3 market address
 * @param {string} baseToken market base token address
 * @param {int} minRatio ratio under which the strategy will trigger
 * @param {int} maxRatio ratio over which the strategy will trigger
 * @param {int} targetRepayRatio wanted ratio after repay
 * @param {int} targetBoostRatio wanted ratio after boost
 * @param {boolean} boostEnabled enable boost
 * @param {boolean} isEOA is EOA subscription
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCompoundV3AutomationStrategy(
    owner,
    market,
    baseToken,
    minRatio,
    maxRatio,
    targetRepayRatio,
    targetBoostRatio,
    boostEnabled,
    isEOA,
    proxyAddr,
    useSafe = true
) {

    try {
        const [, proxy] = await getSender(owner, proxyAddr, useSafe);

        const { chainId } = await hre.ethers.provider.getNetwork();

        let strategySub;

        if (chainId === 1) {
            strategySub = automationSdk.strategySubService.compoundV3Encode.leverageManagement(
                market, baseToken, minRatio, maxRatio, targetBoostRatio, targetRepayRatio, boostEnabled, isEOA
            );
        } else {
            strategySub = automationSdk.strategySubService.compoundV3L2Encode.leverageManagement(
                market, baseToken, minRatio, maxRatio, targetBoostRatio, targetRepayRatio, boostEnabled
            );
        }

        const subId = await _subToCompoundV3Automation(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Subscribes to Compound V3 leverage management on price strategy
 * @param {string} bundleId bundleId
 * @param {string} debtTokenSymbol symbol of the debt token
 * @param {string} collTokenSymbol symbol of the collateral token
 * @param {number} targetRatio target ratio
 * @param {number} price price
 * @param {string} priceState price state
 * @param {string} eoa EOA address
 * @param {string} proxyAddr proxy address
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCompoundV3LeverageManagementOnPrice(
    bundleId,
    debtTokenSymbol,
    collTokenSymbol,
    targetRatio,
    price,
    priceState,
    eoa,
    proxyAddr
) {
    try {
        const [, proxy] = await getSender(eoa, proxyAddr, true);

        const { chainId } = await hre.ethers.provider.getNetwork();

        const market = COMP_V3_MARKETS[chainId][debtTokenSymbol === "ETH" ? "WETH" : debtTokenSymbol];

        const collTokenData = getAssetInfo(collTokenSymbol === "ETH" ? "WETH" : collTokenSymbol, chainId);
        const debtTokenData = getAssetInfo(debtTokenSymbol === "ETH" ? "WETH" : debtTokenSymbol, chainId);

        const strategySub = automationSdk.strategySubService.compoundV3Encode.leverageManagementOnPrice(
            bundleId,
            market,
            collTokenData.address,
            debtTokenData.address,
            targetRatio,
            price,
            priceState.toString().toLowerCase() === "under" ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Subscribes to Compound V3 close on price strategy
 * @param {string} bundleId Bundle ID
 * @param {string} debtTokenSymbol symbol of the debt token
 * @param {string} collTokenSymbol symbol of the collateral token
 * @param {number} stopLossPrice trigger price for stop loss
 * @param {number} takeProfitPrice rigger price for take profit
 * @param {number} closeStrategyType Type of close strategy. See automationSdk.enums.CloseStrategyType
 * @param {string} eoa EOA address
 * @param {string} proxyAddr proxy address
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCompoundV3CloseOnPrice(
    bundleId,
    debtTokenSymbol,
    collTokenSymbol,
    stopLossPrice,
    takeProfitPrice,
    closeStrategyType,
    eoa,
    proxyAddr
) {
    try {
        const [, proxy] = await getSender(eoa, proxyAddr, true);

        const { chainId } = await hre.ethers.provider.getNetwork();

        const market = COMP_V3_MARKETS[chainId][debtTokenSymbol === "ETH" ? "WETH" : debtTokenSymbol];

        const collTokenData = getAssetInfo(collTokenSymbol === "ETH" ? "WETH" : collTokenSymbol, chainId);
        const debtTokenData = getAssetInfo(debtTokenSymbol === "ETH" ? "WETH" : debtTokenSymbol, chainId);

        const {
            stopLossType,
            takeProfitType
        } = validateTriggerPricesForCloseStrategyType(closeStrategyType, stopLossPrice, takeProfitPrice);

        const strategySub = automationSdk.strategySubService.compoundV3Encode.closeOnPrice(
            bundleId,
            market,
            collTokenData.address,
            debtTokenData.address,
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
    subCompoundV3AutomationStrategy,
    subCompoundV3LeverageManagementOnPrice,
    subCompoundV3CloseOnPrice
};
