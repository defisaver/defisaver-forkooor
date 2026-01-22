const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToStrategy, getTokenInfoForAaveV4, getAaveV4SpokeAddress } = require("../../utils");
const { getReserveInfoForTokens } = require("./view");

/**
 * Subscribes to Aave V4 Leverage Management strategy (proxy only)
 * @param {string} eoa EOA address
 * @param {string} spoke spoke address (optional, will use default spoke if not provided)
 * @param {number} ratioState 0 for boost, 1 for repay
 * @param {number} targetRatio target ratio
 * @param {number} triggerRatio trigger ratio
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the Safe as smart wallet or DSProxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV4LeverageManagement(eoa, spoke, ratioState, targetRatio, triggerRatio, proxyAddr, useSafe = true) {
    try {
        const spokeAddress = await getAaveV4SpokeAddress(spoke);
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

        const bundleId = ratioState === 1
            ? automationSdk.enums.Bundles.MainnetIds.AAVE_V4_REPAY
            : automationSdk.enums.Bundles.MainnetIds.AAVE_V4_BOOST;

        const strategySub = automationSdk.strategySubService.aaveV4Encode.leverageManagement(
            bundleId,
            proxy.address, // owner
            spokeAddress,
            ratioState,
            targetRatio,
            triggerRatio
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Subscribes to Aave V4 Leverage Management On Price strategy (proxy only)
 * @param {string} eoa EOA address
 * @param {string} spoke spoke address (optional, will use default spoke if not provided)
 * @param {boolean} isBoost true for boost, false for repay
 * @param {string} collSymbol collateral asset symbol
 * @param {string} debtSymbol debt asset symbol
 * @param {number} targetRatio target ratio
 * @param {number} price trigger price
 * @param {number} priceState price state (under/over)
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the Safe as smart wallet or DSProxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV4LeverageManagementOnPrice(
    eoa,
    spoke,
    isBoost,
    collSymbol,
    debtSymbol,
    targetRatio,
    price,
    priceState,
    proxyAddr,
    useSafe = true
) {
    try {
        const spokeAddress = await getAaveV4SpokeAddress(spoke);
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

        const collAssetData = await getTokenInfoForAaveV4(collSymbol);
        const debtAssetData = await getTokenInfoForAaveV4(debtSymbol);

        const reserveInfos = await getReserveInfoForTokens(spokeAddress, [collAssetData.address, debtAssetData.address]);
        const collReserveInfo = reserveInfos[0];
        const debtReserveInfo = reserveInfos[1];

        const bundleId = isBoost
            ? automationSdk.enums.Bundles.MainnetIds.AAVE_V4_BOOST_ON_PRICE
            : automationSdk.enums.Bundles.MainnetIds.AAVE_V4_REPAY_ON_PRICE;

        const strategySub = automationSdk.strategySubService.aaveV4Encode.leverageManagementOnPrice(
            bundleId,
            proxy.address, // owner
            spokeAddress,
            collAssetData.address,
            collReserveInfo.reserveId,
            debtAssetData.address,
            debtReserveInfo.reserveId,
            targetRatio,
            price,
            (priceState.toString().toLowerCase() === "under")
                ? automationSdk.enums.RatioState.UNDER
                : automationSdk.enums.RatioState.OVER,
            isBoost ? automationSdk.enums.RatioState.OVER : automationSdk.enums.RatioState.UNDER
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Subscribes to Aave V4 Close On Price strategy (proxy only)
 * @param {string} eoa EOA address
 * @param {string} spoke spoke address (optional, will use default spoke if not provided)
 * @param {string} collSymbol collateral asset symbol
 * @param {string} debtSymbol debt asset symbol
 * @param {number} stopLossPrice stop loss price (0 if not used)
 * @param {number} stopLossType stop loss type (0 for debt, 1 for collateral)
 * @param {number} takeProfitPrice take profit price (0 if not used)
 * @param {number} takeProfitType take profit type (0 for debt, 1 for collateral)
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the Safe as smart wallet or DSProxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV4CloseOnPrice(
    eoa,
    spoke,
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
        const spokeAddress = await getAaveV4SpokeAddress(spoke);
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

        const collAssetData = await getTokenInfoForAaveV4(collSymbol);
        const debtAssetData = await getTokenInfoForAaveV4(debtSymbol);

        const reserveInfos = await getReserveInfoForTokens(spokeAddress, [collAssetData.address, debtAssetData.address]);
        const collReserveInfo = reserveInfos[0];
        const debtReserveInfo = reserveInfos[1];

        const bundleId = automationSdk.enums.Bundles.MainnetIds.AAVE_V4_CLOSE;

        const strategySub = automationSdk.strategySubService.aaveV4Encode.closeOnPrice(
            bundleId,
            proxy.address, // owner
            spokeAddress,
            collAssetData.address,
            collReserveInfo.reserveId,
            debtAssetData.address,
            debtReserveInfo.reserveId,
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

/**
 * Subscribes to Aave V4 Collateral Switch strategy (proxy only)
 * @param {string} eoa EOA address
 * @param {string} spoke spoke address (optional, will use default spoke if not provided)
 * @param {string} fromAssetSymbol symbol of the collateral asset to switch from
 * @param {string} toAssetSymbol symbol of the collateral asset to switch to
 * @param {number} amountToSwitch amount of collateral to switch (ignored if isMaxUintSwitch is true)
 * @param {boolean} isMaxUintSwitch if true, use MaxUint256 instead of amountToSwitch
 * @param {number} price trigger price
 * @param {string} priceState 'under' or 'over'
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the Safe as smart wallet or DSProxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV4CollateralSwitch(
    eoa,
    spoke,
    fromAssetSymbol,
    toAssetSymbol,
    amountToSwitch,
    isMaxUintSwitch,
    price,
    priceState,
    proxyAddr,
    useSafe = true
) {
    try {
        const spokeAddress = await getAaveV4SpokeAddress(spoke);
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

        const fromTokenData = await getTokenInfoForAaveV4(fromAssetSymbol);
        const toTokenData = await getTokenInfoForAaveV4(toAssetSymbol);

        const reserveInfos = await getReserveInfoForTokens(spokeAddress, [fromTokenData.address, toTokenData.address]);
        const fromReserveInfo = reserveInfos[0];
        const toReserveInfo = reserveInfos[1];

        const amountToSwitchFormatted = isMaxUintSwitch
            ? hre.ethers.constants.MaxUint256.toString()
            : hre.ethers.utils.parseUnits(amountToSwitch.toString(), fromTokenData.decimals).toString();

        const strategyId = automationSdk.enums.Strategies.MainnetIds.AAVE_V4_COLLATERAL_SWITCH;

        const state = (priceState.toString().toLowerCase() === "under")
            ? automationSdk.enums.RatioState.UNDER
            : automationSdk.enums.RatioState.OVER;

        const strategySub = automationSdk.strategySubService.aaveV4Encode.collateralSwitch(
            strategyId,
            proxy.address, // owner
            spokeAddress,
            fromTokenData.address,
            fromReserveInfo.reserveId,
            toTokenData.address,
            toReserveInfo.reserveId,
            amountToSwitchFormatted,
            price,
            state
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    subAaveV4LeverageManagement,
    subAaveV4LeverageManagementOnPrice,
    subAaveV4CloseOnPrice,
    subAaveV4CollateralSwitch
};
