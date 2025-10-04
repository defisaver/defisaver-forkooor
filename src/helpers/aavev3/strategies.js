const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToStrategy, subToAaveV3Automation, addresses, approve } = require("../../utils");
const { getFullTokensInfo, getLoanData } = require("./view");
const { getAssetInfo } = require("@defisaver/tokens");
const { IPoolAddressesProviderAbi, IPoolV3Abi, IL2PoolV3Abi, IDebtTokenAbi } = require("../../abi/aaveV3/abis");

/**
 * Give all necessary approvals from EOA to Smart Wallet for Aave V3 positions
 * @param {string} market address of the Aave market
 * @param {string} user address of the user (EOA)
 * @param {string} proxyAddress address of the smart wallet proxy
 * @param {Object} senderAcc signer account
 * @returns {void}
 */
async function giveApprovalsFromEOAToSmartWallet(market, user, proxyAddress, senderAcc) {

    // Get user position data to identify all tokens in position
    const userLoanData = await getLoanData(market, user);

    // Get market contract and pool address for getting reserve data
    const aaveMarketContract = new hre.ethers.Contract(market, IPoolAddressesProviderAbi, senderAcc);
    const poolAddress = await aaveMarketContract.getPool();

    // Use the appropriate interface based on network
    const network = hre.network.name;
    const poolAbi = network !== "mainnet" ? IL2PoolV3Abi : IPoolV3Abi;
    const poolContract = new hre.ethers.Contract(poolAddress, poolAbi, senderAcc);

    // Get all collateral token addresses with non-zero balances
    const collTokens = userLoanData.collAddr.filter((addr, index) =>
        userLoanData.collAmounts[index] !== "0");

    // Get all collateral aToken approvals for MAX_UINT
    for (let i = 0; i < collTokens.length; i++) {
        const collTokenAddr = collTokens[i];
        const reserveData = await poolContract.getReserveData(collTokenAddr);

        // Approve aToken for MAX_UINT
        await approve(reserveData.aTokenAddress, proxyAddress, user);
        console.log(`aToken ${reserveData.aTokenAddress} approved from EOA to Smart Wallet`);
    }

    // Get all debt token addresses with non-zero balances
    const debtTokens = userLoanData.borrowAddr.filter((addr, index) =>
        userLoanData.borrowVariableAmounts[index] !== "0");

    // Get delegation approvals for all debt tokens
    for (let i = 0; i < debtTokens.length; i++) {
        const debtTokenAddr = debtTokens[i];
        const reserveData = await poolContract.getReserveData(debtTokenAddr);

        // Approve debt token delegation for MAX_UINT
        const debtTokenContract = new hre.ethers.Contract(reserveData.variableDebtTokenAddress, IDebtTokenAbi, senderAcc);

        await debtTokenContract.approveDelegation(proxyAddress, hre.ethers.constants.MaxUint256);
        console.log(`Debt token ${reserveData.variableDebtTokenAddress} approved for delegation to proxy`);
    }
}

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
 * Subscribes to Aave V3 Generic Automation strategy. Supports EOA and SW subbing
 * @param {string} owner proxy owner
 * @param {uint} bundleId bundle ID
 * @param {string} market address of the market
 * @param {boolean} isEOA if it is EOA or SW strategy
 * @param {uint} ratioState if it is boost or repay. 0 for boost, 1 for repay
 * @param {uint} targetRatio target ratio
 * @param {uint} triggerRatio trigger ratio
 * @param {boolean} isGeneric if it is new type of subbing that supports EOA strategies
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the Safe as smart wallet or DSProxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV3GenericAutomationStrategy(owner, bundleId, market, isEOA, ratioState, targetRatio, triggerRatio, isGeneric, proxyAddr, useSafe = true) {

    try {
        const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

        // Determine user field based on isEOA parameter
        const user = isEOA ? owner : proxy.address;

        const strategySub = automationSdk.strategySubService.aaveV3Encode.leverageManagementWithoutSubProxy(
            bundleId, market, user, ratioState, targetRatio, triggerRatio, isGeneric
        );

        if (isEOA) {
            await giveApprovalsFromEOAToSmartWallet(market, owner, proxy.address, senderAcc);
        }

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Subscribes to Aave V3 Leverage Management On Price Generic strategy. Supports EOA and SW subbing
 * @param {string} owner proxy owner
 * @param {uint} bundleId bundle ID
 * @param {string} market address of the market
 * @param {boolean} isEOA if it is EOA or SW strategy
 * @param {string} collAssetSymbol collateral asset symbol
 * @param {string} debtAssetSymbol debt asset symbol
 * @param {uint} triggerPrice trigger price
 * @param {uint} priceState price state (0 for under, 1 for over)
 * @param {uint} targetRatio target ratio
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV3LeverageManagementOnPriceGeneric(
    owner,
    bundleId,
    market,
    isEOA,
    collAssetSymbol,
    debtAssetSymbol,
    triggerPrice,
    priceState,
    targetRatio,
    proxyAddr,
    useSafe = true
) {
    try {
        const { chainId } = await hre.ethers.provider.getNetwork();
        const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

        // Determine user field based on isEOA parameter
        const user = isEOA ? owner : proxy.address;

        // Get asset info
        const collAssetData = getAssetInfo(collAssetSymbol === "ETH" ? "WETH" : collAssetSymbol, chainId);
        const debtAssetData = getAssetInfo(debtAssetSymbol === "ETH" ? "WETH" : debtAssetSymbol, chainId);

        // Get full tokens info for asset IDs
        const infos = await getFullTokensInfo(market, [collAssetData.address, debtAssetData.address]);
        const collAssetInfo = infos[0];
        const debtAssetInfo = infos[1];

        if (isEOA) {
            await giveApprovalsFromEOAToSmartWallet(market, owner, proxy.address, senderAcc);
        }

        const strategySub = automationSdk.strategySubService.aaveV3Encode.leverageManagementOnPriceGeneric(
            bundleId,
            triggerPrice,
            priceState,
            collAssetData.address,
            collAssetInfo.assetId,
            debtAssetData.address,
            debtAssetInfo.assetId,
            market,
            targetRatio,
            user
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Subscribes to Aave V3 Close On Price Generic strategy. Supports EOA and SW subbing
 * @param {string} owner proxy owner
 * @param {uint} bundleId bundle ID
 * @param {string} market address of the market
 * @param {boolean} isEOA if it is EOA or SW strategy
 * @param {string} collAssetSymbol collateral asset symbol
 * @param {string} debtAssetSymbol debt asset symbol
 * @param {uint} stopLossPrice stop loss price (0 if not used)
 * @param {uint} stopLossType stop loss type (0 for debt, 1 for collateral)
 * @param {uint} takeProfitPrice take profit price (0 if not used)
 * @param {uint} takeProfitType take profit type (0 for debt, 1 for collateral)
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the Safe as smart wallet or DSProxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV3CloseOnPriceGeneric(
    owner,
    bundleId,
    market,
    isEOA,
    collAssetSymbol,
    debtAssetSymbol,
    stopLossPrice,
    stopLossType,
    takeProfitPrice,
    takeProfitType,
    proxyAddr,
    useSafe = true
) {
    try {
        const { chainId } = await hre.ethers.provider.getNetwork();
        const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

        // Determine user field based on isEOA parameter
        const user = isEOA ? owner : proxy.address;

        // Get asset info
        const collAssetData = getAssetInfo(collAssetSymbol === "ETH" ? "WETH" : collAssetSymbol, chainId);
        const debtAssetData = getAssetInfo(debtAssetSymbol === "ETH" ? "WETH" : debtAssetSymbol, chainId);

        // Get full tokens info for asset IDs
        const infos = await getFullTokensInfo(market, [collAssetData.address, debtAssetData.address]);
        const collAssetInfo = infos[0];
        const debtAssetInfo = infos[1];

        if (isEOA) {
            await giveApprovalsFromEOAToSmartWallet(market, owner, proxy.address, senderAcc);
        }

        const strategySub = automationSdk.strategySubService.aaveV3Encode.closeOnPriceGeneric(
            bundleId,
            collAssetData.address,
            collAssetInfo.assetId,
            debtAssetData.address,
            debtAssetInfo.assetId,
            market,
            user,
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

        const strategySub = automationSdk.strategySubService.aaveV3Encode.leverageManagementOnPrice(
            bundleId,
            true,
            {
                baseTokenAddress: collTokenData.address,
                quoteTokenAddress: debtTokenData.address,
                price: triggerPrice,
                state: (triggerState.toString().toLowerCase() === "under") ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER
            },
            {
                collAsset: collTokenData.address,
                collAssetId: aaveCollInfo.assetId,
                debtAsset: debtTokenData.address,
                debtAssetId: aaveDebtInfo.assetId,
                marketAddr: marketAddress,
                targetRatio,
                useOnBehalf: false
            }
        );

        const subId = await subToStrategy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Subscribes to Aave V3 Repay on price strategy bundle
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
async function subAaveV3RepayOnPrice(
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

        const strategySub = automationSdk.strategySubService.aaveV3Encode.leverageManagementOnPrice(
            bundleId,
            true,
            {
                baseTokenAddress: collTokenData.address,
                quoteTokenAddress: debtTokenData.address,
                price: triggerPrice,
                state: (triggerState.toString().toLowerCase() === "under") ? automationSdk.enums.RatioState.UNDER : automationSdk.enums.RatioState.OVER
            },
            {
                collAsset: collTokenData.address,
                collAssetId: aaveCollInfo.assetId,
                debtAsset: debtTokenData.address,
                debtAssetId: aaveDebtInfo.assetId,
                marketAddr: marketAddress,
                targetRatio,
                useOnBehalf: false
            }
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
    subAaveV3OpenOrderFromCollateral,
    subAaveV3RepayOnPrice,
    subAaveV3GenericAutomationStrategy,
    subAaveV3LeverageManagementOnPriceGeneric,
    subAaveV3CloseOnPriceGeneric
};
