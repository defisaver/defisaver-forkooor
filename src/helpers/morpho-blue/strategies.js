const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { subToStrategy, getSender, getTokenInfo } = require("../../utils");
const { configure } = require("@defisaver/sdk");
const { getMarketId } = require("./view");
const abiCoder = new hre.ethers.utils.AbiCoder();

/**
 * Subscribes to MorphoBlue Repay Bundle
 * @param {string} eoa wallet owner (EOA)
 * @param {string} collSymbol collateral token symbol
 * @param {string} debtSymbol debt token symbol
 * @param {string} oracle oracle address
 * @param {string} irm interest rate model address
 * @param {string} lltv lltv
 * @param {number} minRatio ratio under which the strategy will trigger
 * @param {number} targetRatio target ratio for repay
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} subId and strategySub
 */
async function subMorphoBlueRepayBundle(
    eoa, collSymbol, debtSymbol, oracle, irm, lltv, minRatio, targetRatio, proxyAddr, useSafe = true
) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    let bundleId;

    if (chainId === 42161) {

        // Arbitrum
        bundleId = automationSdk.enums.Bundles.ArbitrumIds.MORPHO_BLUE_REPAY;
    } else if (chainId === 8453) {

        // Base
        bundleId = automationSdk.enums.Bundles.BaseIds.MORPHO_BLUE_REPAY;
    } else {

        // Mainnet (default)
        bundleId = automationSdk.enums.Bundles.MainnetIds.MORPHO_BLUE_REPAY;
    }

    const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const user = proxy.address;

    configure({
        chainId,
        testMode: false
    });

    const loanToken = (await getTokenInfo(debtSymbol)).address;
    const collateralToken = (await getTokenInfo(collSymbol)).address;
    const marketParams = [loanToken, collateralToken, oracle, irm, lltv];
    const marketId = await getMarketId({ loanToken, collateralToken, oracle, irm, lltv });

    const triggerData = abiCoder.encode(["bytes32", "address", "uint256", "uint8"], [marketId, user, hre.ethers.utils.parseUnits(minRatio.toString(), 16).toString(), 1]);
    const loanTokenEncoded = abiCoder.encode(["address"], [marketParams[0]]);
    const collateralTokenEncoded = abiCoder.encode(["address"], [marketParams[1]]);
    const oracleEncoded = abiCoder.encode(["address"], [marketParams[2]]);
    const irmEncoded = abiCoder.encode(["address"], [marketParams[3]]);
    const lltvEncoded = abiCoder.encode(["uint256"], [marketParams[4]]);
    const ratioStateEncoded = abiCoder.encode(["uint8"], [1]);
    const targetRatioEncoded = abiCoder.encode(["uint256"], [hre.ethers.utils.parseUnits(targetRatio.toString(), 16).toString()]);

    const userEncoded = abiCoder.encode(["address"], [user]);
    const strategySub = [bundleId, true, [triggerData],
        [
            loanTokenEncoded,
            collateralTokenEncoded,
            oracleEncoded,
            irmEncoded,
            lltvEncoded,
            ratioStateEncoded,
            targetRatioEncoded,
            userEncoded
        ]
    ];
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Subscribes to MorphoBlue Repay Bundle
 * @param {string} eoa wallet owner (EOA)
 * @param {string} collSymbol collateral token symbol
 * @param {string} debtSymbol debt token symbol
 * @param {string} oracle oracle address
 * @param {string} irm interest rate model address
 * @param {string} lltv lltv
 * @param {number} maxRatio ratio above which the strategy will trigger
 * @param {number} targetRatio target ratio for repay
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} subId and strategySub
 */
async function subMorphoBlueBoostBundle(
    eoa, collSymbol, debtSymbol, oracle, irm, lltv, maxRatio, targetRatio, proxyAddr, useSafe = true
) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    let bundleId;

    if (chainId === 42161) {

        // Arbitrum
        bundleId = automationSdk.enums.Bundles.ArbitrumIds.MORPHO_BLUE_BOOST;
    } else if (chainId === 8453) {

        // Base
        bundleId = automationSdk.enums.Bundles.BaseIds.MORPHO_BLUE_BOOST;
    } else {

        // Mainnet (default)
        bundleId = automationSdk.enums.Bundles.MainnetIds.MORPHO_BLUE_BOOST;
    }

    const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const user = proxy.address;

    configure({
        chainId,
        testMode: false
    });

    const loanToken = (await getTokenInfo(debtSymbol)).address;
    const collateralToken = (await getTokenInfo(collSymbol)).address;
    const marketParams = [loanToken, collateralToken, oracle, irm, lltv];
    const marketId = await getMarketId({ loanToken, collateralToken, oracle, irm, lltv });

    const triggerData = abiCoder.encode(["bytes32", "address", "uint256", "uint8"], [marketId, user, hre.ethers.utils.parseUnits(maxRatio.toString(), 16).toString(), 0]);
    const loanTokenEncoded = abiCoder.encode(["address"], [marketParams[0]]);
    const collateralTokenEncoded = abiCoder.encode(["address"], [marketParams[1]]);
    const oracleEncoded = abiCoder.encode(["address"], [marketParams[2]]);
    const irmEncoded = abiCoder.encode(["address"], [marketParams[3]]);
    const lltvEncoded = abiCoder.encode(["uint256"], [marketParams[4]]);
    const ratioStateEncoded = abiCoder.encode(["uint8"], [0]);
    const targetRatioEncoded = abiCoder.encode(["uint256"], [hre.ethers.utils.parseUnits(targetRatio.toString(), 16).toString()]);

    const userEncoded = abiCoder.encode(["address"], [user]);
    const strategySub = [bundleId, true, [triggerData],
        [
            loanTokenEncoded,
            collateralTokenEncoded,
            oracleEncoded,
            irmEncoded,
            lltvEncoded,
            ratioStateEncoded,
            targetRatioEncoded,
            userEncoded
        ]
    ];
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Subscribes to MorphoBlue Boost On Price Bundle
 * @param {string} eoa wallet owner (EOA)
 * @param {string} collSymbol collateral token symbol
 * @param {string} debtSymbol debt token symbol
 * @param {string} oracle oracle address
 * @param {string} irm interest rate model address
 * @param {string} lltv lltv
 * @param {number} targetRatio target ratio for boost on price
 * @param {number} price price to trigger the strategy
 * @param {string} priceState under or over
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} subId and strategySub
 */
async function subMorphoBlueBoostOnPriceBundle(
    eoa, collSymbol, debtSymbol, oracle, irm, lltv, targetRatio, price, priceState, proxyAddr, useSafe = true
) {
    const { chainId } = await hre.ethers.provider.getNetwork();
    let bundleId;

    if (chainId === 42161) {

        // Arbitrum
        bundleId = automationSdk.enums.Bundles.ArbitrumIds.MORPHO_BLUE_BOOST_ON_PRICE;
    } else if (chainId === 8453) {

        // Base
        bundleId = automationSdk.enums.Bundles.BaseIds.MORPHO_BLUE_BOOST_ON_PRICE;
    } else {

        // Mainnet (default)
        bundleId = automationSdk.enums.Bundles.MainnetIds.MORPHO_BLUE_BOOST_ON_PRICE;
    }

    const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const user = proxy.address;

    configure({
        chainId,
        testMode: false
    });

    const loanToken = (await getTokenInfo(debtSymbol)).address;
    const collateralToken = (await getTokenInfo(collSymbol)).address;
    const marketParams = [loanToken, collateralToken, oracle, irm, lltv];
    const strategySub = automationSdk.strategySubService.morphoBlueEncode.leverageManagementOnPrice(
        bundleId,
        true,
        marketParams[0],
        marketParams[1],
        marketParams[2],
        marketParams[3],
        marketParams[4],
        user,
        targetRatio,
        price,
        priceState.toLowerCase() === "under"
            ? automationSdk.enums.RatioState.UNDER
            : automationSdk.enums.RatioState.OVER
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { subId, strategySub };
}

/**
 * Subscribes to MorphoBlue Close On Price Bundle
 * @param {string} eoa wallet owner (EOA)
 * @param {string} collSymbol collateral token symbol
 * @param {string} debtSymbol debt token symbol
 * @param {string} oracle oracle address
 * @param {string} irm interest rate model address
 * @param {string} lltv lltv
 * @param {number} stopLossPrice stop loss price
 * @param {number} stopLossType stop loss type (0 for debt, 1 for collateral)
 * @param {number} takeProfitPrice take profit price
 * @param {number} takeProfitType take profit type (0 for debt, 1 for collateral)
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} subId and strategySub
 */
async function subMorphoBlueCloseOnPriceBundle(
    eoa,
    collSymbol,
    debtSymbol,
    oracle,
    irm,
    lltv,
    stopLossPrice,
    stopLossType,
    takeProfitPrice,
    takeProfitType,
    proxyAddr,
    useSafe = true
) {
    try {
        const { chainId } = await hre.ethers.provider.getNetwork();
        let bundleId;

        if (chainId === 42161) {

            // Arbitrum
            bundleId = automationSdk.enums.Bundles.ArbitrumIds.MORPHO_BLUE_CLOSE;
        } else if (chainId === 8453) {

            // Base
            bundleId = automationSdk.enums.Bundles.BaseIds.MORPHO_BLUE_CLOSE;
        } else {

            // Mainnet (default)
            bundleId = automationSdk.enums.Bundles.MainnetIds.MORPHO_BLUE_CLOSE;
        }

        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
        const loanToken = (await getTokenInfo(debtSymbol)).address;
        const collateralToken = (await getTokenInfo(collSymbol)).address;
        const marketParams = [loanToken, collateralToken, oracle, irm, lltv];

        const strategySub = automationSdk.strategySubService.morphoBlueEncode.closeOnPrice(
            bundleId,
            marketParams[0],
            marketParams[1],
            marketParams[2],
            marketParams[3],
            marketParams[4],
            proxy.address,
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
    subMorphoBlueRepayBundle,
    subMorphoBlueBoostBundle,
    subMorphoBlueBoostOnPriceBundle,
    subMorphoBlueCloseOnPriceBundle
};
