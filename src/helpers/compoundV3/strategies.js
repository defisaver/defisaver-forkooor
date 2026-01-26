const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, addresses, getLatestSubId, executeActionFromProxy, subToStrategy, validateTriggerPricesForCloseStrategyType } = require("../../utils");
const { compoundV3SubProxyAbi } = require("../../abi/compoundV3/abis");
const { compoundV3SubProxyL2Abi } = require("../../abi/compoundV3/abis");
const { COMP_V3_MARKETS } = require("./view");
const { getTokenInfo } = require("../../utils");

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
 * @param {string|null} marketSymbol Optional. Market symbol (e.g. USDC, WETH). If not provided, derived from debtSymbol.
 * @param {string} eoa EOA which will be sending transactions and own the wallet
 * @param {string} debtSymbol Debt (base) token symbol. ETH → WETH.
 * @param {number} minRatio ratio under which the strategy will trigger
 * @param {number} maxRatio ratio over which the strategy will trigger
 * @param {number} targetRepayRatio wanted ratio after repay
 * @param {number} targetBoostRatio wanted ratio after boost
 * @param {boolean} boostEnabled enable boost
 * @param {boolean} isEOA is EOA subscription
 * @param {string} proxyAddr the address of the wallet for the position, or AddressZero to create one
 * @param {boolean} useSafe whether to use Safe or dsproxy if proxyAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCompoundV3AutomationStrategy(
    marketSymbol,
    eoa,
    debtSymbol,
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
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

        const { chainId } = await hre.ethers.provider.getNetwork();

        // Resolve market address from symbol (use debtSymbol if marketSymbol not provided)
        const resolvedMarketSymbol = marketSymbol || debtSymbol;

        if (!COMP_V3_MARKETS[chainId]) {
            throw new Error(`Chain ${chainId} is not supported`);
        }

        const market = COMP_V3_MARKETS[chainId][resolvedMarketSymbol === "ETH" ? "WETH" : resolvedMarketSymbol];

        if (!market) {
            throw new Error(`Market not found for symbol ${resolvedMarketSymbol} on chain ${chainId}`);
        }

        const baseToken = (await getTokenInfo(debtSymbol)).address;
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
 * Subscribes to Compound V3 leverage management
 * @param {string|null} marketSymbol Optional. Market symbol (e.g. USDC, WETH). If not provided, derived from debtSymbol.
 * @param {string} eoa EOA address
 * @param {string} debtSymbol Debt (base) token symbol. ETH → WETH.
 * @param {number} triggerRatio trigger ratio
 * @param {number} targetRatio target ratio
 * @param {string} ratioState "under" or "over"
 * @param {boolean} isEOA whether the subscription is for an EOA
 * @param {string} proxyAddr wallet address, or AddressZero to create one
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCompoundV3LeverageManagement(
    marketSymbol,
    eoa,
    debtSymbol,
    triggerRatio,
    targetRatio,
    ratioState,
    isEOA,
    proxyAddr
) {
    try {
        const [, proxy] = await getSender(eoa, proxyAddr, true);

        const { chainId } = await hre.ethers.provider.getNetwork();

        // Resolve market address from symbol (use debtSymbol if marketSymbol not provided)
        const resolvedMarketSymbol = marketSymbol || debtSymbol;

        if (!COMP_V3_MARKETS[chainId]) {
            throw new Error(`Chain ${chainId} is not supported`);
        }

        const market = COMP_V3_MARKETS[chainId][resolvedMarketSymbol === "ETH" ? "WETH" : resolvedMarketSymbol];

        if (!market) {
            throw new Error(`Market not found for symbol ${resolvedMarketSymbol} on chain ${chainId}`);
        }

        const debtTokenData = await getTokenInfo(debtSymbol);

        // Resolve bundleId from automation-sdk (ratioState: under=repay, over=boost)
        const isRepay = ratioState.toLowerCase() === "under";

        let bundleId;

        const M = automationSdk.enums.Bundles.MainnetIds;
        const A = automationSdk.enums.Bundles.ArbitrumIds;
        const B = automationSdk.enums.Bundles.BaseIds;

        if (chainId === 1) {
            if (isEOA) {
                bundleId = isRepay ? M.COMP_V3_EOA_REPAY_V2_BUNDLE : M.COMP_V3_EOA_BOOST_V2_BUNDLE;
            } else {
                bundleId = isRepay ? M.COMP_V3_SW_REPAY_V2_BUNDLE : M.COMP_V3_SW_BOOST_V2_BUNDLE;
            }
        } else if (chainId === 42161) {
            if (isEOA) {
                bundleId = isRepay ? A.COMP_V3_EOA_REPAY : A.COMP_V3_EOA_BOOST;
            } else {
                bundleId = isRepay ? A.COMP_V3_SW_REPAY_BUNDLE : A.COMP_V3_SW_BOOST_BUNDLE;
            }
        } else if (chainId === 8453) {
            if (isEOA) {
                bundleId = isRepay ? B.COMP_V3_EOA_REPAY : B.COMP_V3_EOA_BOOST;
            } else {
                bundleId = isRepay ? B.COMP_V3_SW_REPAY_BUNDLE : B.COMP_V3_SW_BOOST_BUNDLE;
            }
        } else {
            throw new Error(`Chain ${chainId} is not supported for Compound V3 leverage management`);
        }

        // --------------------ENCODE SUB DATA---------------------
        // @dev We don't want to use the automation sdk here to simplify encoding and differentiate between repay and boost

        const abiCoder = new hre.ethers.utils.AbiCoder();

        const targetRatioFormatted = hre.ethers.utils.parseUnits(targetRatio.toString(), 16);
        const triggerRatioFormatted = hre.ethers.utils.parseUnits(triggerRatio.toString(), 16);
        const ratioStateFormatted = isRepay ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER;
        const user = isEOA ? eoa : proxy.address;
        const isBundle = true;

        const triggerDataEncoded = abiCoder.encode(
            ["address", "address", "uint256", "uint8"],
            [user, market, triggerRatioFormatted, ratioStateFormatted]
        );

        const subDataEncoded = [
            abiCoder.encode(["address"], [market]),
            abiCoder.encode(["address"], [debtTokenData.address]),
            abiCoder.encode(["uint8"], [ratioStateFormatted]),
            abiCoder.encode(["uint256"], [targetRatioFormatted])
        ];

        const strategySub = [bundleId, isBundle, [triggerDataEncoded], subDataEncoded];

        // --------------------FINISH ENCODING---------------------

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Subscribes to Compound V3 leverage management on price strategy
 * @param {string|null} marketSymbol Optional. Market symbol (e.g. USDC, WETH). If not provided, derived from debtSymbol.
 * @param {string} eoa EOA address
 * @param {boolean} isEOA whether the subscription is for an EOA position or not
 * @param {string} collSymbol symbol of the collateral token
 * @param {string} debtSymbol symbol of the debt token
 * @param {number} targetRatio target ratio
 * @param {number} price price
 * @param {string} priceState price state
 * @param {string} ratioState ratio state
 * @param {string} proxyAddr proxy address
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCompoundV3LeverageManagementOnPrice(
    marketSymbol,
    eoa,
    isEOA,
    collSymbol,
    debtSymbol,
    targetRatio,
    price,
    priceState,
    ratioState,
    proxyAddr
) {
    try {
        const [, proxy] = await getSender(eoa, proxyAddr, true);

        const { chainId } = await hre.ethers.provider.getNetwork();

        // Resolve market address from symbol (use debtSymbol if marketSymbol not provided)
        const resolvedMarketSymbol = marketSymbol || debtSymbol;

        if (!COMP_V3_MARKETS[chainId]) {
            throw new Error(`Chain ${chainId} is not supported`);
        }

        const market = COMP_V3_MARKETS[chainId][resolvedMarketSymbol === "ETH" ? "WETH" : resolvedMarketSymbol];

        if (!market) {
            throw new Error(`Market not found for symbol ${resolvedMarketSymbol} on chain ${chainId}`);
        }

        // Resolve bundleId from automation-sdk (ratioState: under=repay, over=boost)
        const isRepay = ratioState.toLowerCase() === "under";

        let bundleId;

        const M = automationSdk.enums.Bundles.MainnetIds;
        const A = automationSdk.enums.Bundles.ArbitrumIds;
        const B = automationSdk.enums.Bundles.BaseIds;

        if (chainId === 1) {
            if (isEOA) {
                bundleId = isRepay ? M.COMP_V3_EOA_REPAY_ON_PRICE : M.COMP_V3_EOA_BOOST_ON_PRICE;
            } else {
                bundleId = isRepay ? M.COMP_V3_SW_REPAY_ON_PRICE : M.COMP_V3_SW_BOOST_ON_PRICE;
            }
        } else if (chainId === 42161) {
            if (isEOA) {
                bundleId = isRepay ? A.COMP_V3_EOA_REPAY_ON_PRICE : A.COMP_V3_EOA_BOOST_ON_PRICE;
            } else {
                bundleId = isRepay ? A.COMP_V3_SW_REPAY_ON_PRICE : A.COMP_V3_SW_BOOST_ON_PRICE;
            }
        } else if (chainId === 8453) {
            if (isEOA) {
                bundleId = isRepay ? B.COMP_V3_EOA_REPAY_ON_PRICE : B.COMP_V3_EOA_BOOST_ON_PRICE;
            } else {
                bundleId = isRepay ? B.COMP_V3_SW_REPAY_ON_PRICE : B.COMP_V3_SW_BOOST_ON_PRICE;
            }
        } else {
            throw new Error(`Chain ${chainId} is not supported for Compound V3 leverage management on price`);
        }

        const collTokenData = await getTokenInfo(collSymbol);
        const debtTokenData = await getTokenInfo(debtSymbol);

        const strategySub = automationSdk.strategySubService.compoundV3Encode.leverageManagementOnPrice(
            bundleId,
            market,
            collTokenData.address,
            debtTokenData.address,
            targetRatio,
            price,
            priceState.toString().toLowerCase() === "under" ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER,
            ratioState.toString().toLowerCase() === "under" ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER,
            isEOA ? eoa : proxy.address
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
 * @param {string|null} marketSymbol Optional. Market symbol (e.g. USDC, WETH). If not provided, derived from debtSymbol.
 * @param {string} eoa EOA address
 * @param {boolean} isEOA whether the subscription is for an EOA position or not
 * @param {string} collSymbol symbol of the collateral token
 * @param {string} debtSymbol symbol of the debt token
 * @param {number} stopLossPrice trigger price for stop loss
 * @param {number} takeProfitPrice trigger price for take profit
 * @param {number} closeStrategyType Type of close strategy. See automationSdk.enums.CloseStrategyType
 * @param {string} proxyAddr proxy address
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subCompoundV3CloseOnPrice(
    marketSymbol,
    eoa,
    isEOA,
    collSymbol,
    debtSymbol,
    stopLossPrice,
    takeProfitPrice,
    closeStrategyType,
    proxyAddr
) {
    try {
        const [, proxy] = await getSender(eoa, proxyAddr, true);

        const { chainId } = await hre.ethers.provider.getNetwork();

        // Resolve market address from symbol (use debtSymbol if marketSymbol not provided)
        const resolvedMarketSymbol = marketSymbol || debtSymbol;

        if (!COMP_V3_MARKETS[chainId]) {
            throw new Error(`Chain ${chainId} is not supported`);
        }

        const market = COMP_V3_MARKETS[chainId][resolvedMarketSymbol === "ETH" ? "WETH" : resolvedMarketSymbol];

        if (!market) {
            throw new Error(`Market not found for symbol ${resolvedMarketSymbol} on chain ${chainId}`);
        }

        // Resolve bundleId from automation-sdk

        let bundleId;

        if (chainId === 1) {
            bundleId = isEOA ? automationSdk.enums.Bundles.MainnetIds.COMP_V3_EOA_CLOSE : automationSdk.enums.Bundles.MainnetIds.COMP_V3_SW_CLOSE;
        } else if (chainId === 42161) {
            bundleId = isEOA ? automationSdk.enums.Bundles.ArbitrumIds.COMP_V3_EOA_CLOSE : automationSdk.enums.Bundles.ArbitrumIds.COMP_V3_SW_CLOSE;
        } else if (chainId === 8453) {
            bundleId = isEOA ? automationSdk.enums.Bundles.BaseIds.COMP_V3_EOA_CLOSE : automationSdk.enums.Bundles.BaseIds.COMP_V3_SW_CLOSE;
        } else {
            throw new Error(`Chain ${chainId} is not supported for Compound V3 close on price`);
        }

        const collTokenData = await getTokenInfo(collSymbol);
        const debtTokenData = await getTokenInfo(debtSymbol);

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
            takeProfitType,
            isEOA ? eoa : proxy.address
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
    subCompoundV3LeverageManagement,
    subCompoundV3LeverageManagementOnPrice,
    subCompoundV3CloseOnPrice
};
