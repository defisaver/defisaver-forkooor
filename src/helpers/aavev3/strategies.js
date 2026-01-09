const hre = require("hardhat");
const automationSdk = require("@defisaver/automation-sdk");
const { getSender, subToStrategy, subToAaveV3LeverageManagementWithSubProxy, approve, getTokenInfo, getAaveV3MarketAddress } = require("../../utils");
const { getFullTokensInfo, getLoanData } = require("./view");
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
    const marketAddress = await getAaveV3MarketAddress(market);

    // Get user position data to identify all tokens in position
    const userLoanData = await getLoanData(marketAddress, user);

    // Get market contract and pool address for getting reserve data
    const aaveMarketContract = new hre.ethers.Contract(marketAddress, IPoolAddressesProviderAbi, senderAcc);
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
 * @param {boolean} isCloseToColl true if closing to collateral, false if closing to debt
 * @param {string} market aaveV3 market address (optional, will use default market if not provided)
 * @param {string} triggerBaseTokenSymbol base token symbol
 * @param {string} triggerQuoteTokenSymbol quote token symbol
 * @param {string} triggerPrice trigger price
 * @param {number} triggerRatioState trigger ratio state
 * @param {string} triggerMaximumGasPrice trigger maximum gas price
 * @param {string} subCollSymbol collateral asset symbol
 * @param {string} subDebtSymbol debt asset symbol
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV3CloseWithMaximumGasPriceStrategy(
    owner,
    isCloseToColl,
    market,
    triggerBaseTokenSymbol, triggerQuoteTokenSymbol, triggerPrice, triggerRatioState, triggerMaximumGasPrice,
    subCollSymbol, subDebtSymbol,
    proxyAddr,
    useSafe = true
) {
    const marketAddress = await getAaveV3MarketAddress(market);
    const [, proxy] = await getSender(owner, proxyAddr, useSafe);

    const collAssetData = await getTokenInfo(subCollSymbol);
    const debtAssetData = await getTokenInfo(subDebtSymbol);
    const triggerBaseTokenData = await getTokenInfo(triggerBaseTokenSymbol);
    const triggerQuoteTokenData = await getTokenInfo(triggerQuoteTokenSymbol);

    // Get full tokens info for asset IDs
    const infos = await getFullTokensInfo(marketAddress, [collAssetData.address, debtAssetData.address]);
    const aaveCollInfo = infos[0];
    const aaveDebtInfo = infos[1];

    // only supported on mainnet
    const strategyOrBundleId = isCloseToColl
        ? automationSdk.enums.Bundles.MainnetIds.AAVE_V3_CLOSE_TO_COLLATERAL_WITH_GAS_PRICE
        : automationSdk.enums.Bundles.MainnetIds.AAVE_V3_CLOSE_TO_DEBT_WITH_GAS_PRICE;


    const strategySub = automationSdk.strategySubService.aaveV3Encode.closeToAssetWithMaximumGasPrice(
        strategyOrBundleId,
        true,
        {
            baseTokenAddress: triggerBaseTokenData.address,
            quoteTokenAddress: triggerQuoteTokenData.address,
            price: triggerPrice,
            ratioState: triggerRatioState,
            maximumGasPrice: triggerMaximumGasPrice
        },
        {
            collAsset: collAssetData.address,
            collAssetId: aaveCollInfo.assetId,
            debtAsset: debtAssetData.address,
            debtAssetId: aaveDebtInfo.assetId
        }
    );
    const subId = await subToStrategy(proxy, strategySub);

    return { strategySub, subId };
}

/**
 * Subscribes to Aave V3 Automation strategy
 * @param {string} eoa EOA address
 * @param {int} minRatio ratio under which the strategy will trigger
 * @param {int} maxRatio ratio over which the strategy will trigger
 * @param {int} targetRepayRatio wanted ratio after repay
 * @param {int} targetBoostRatio wanted ratio after boost
 * @param {boolean} boostEnabled enable boost
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {boolean} StrategySub object and ID of the subscription
 */
async function subAaveV3LeverageManagementWithSubProxyStrategy(
    eoa,
    minRatio,
    maxRatio,
    targetRepayRatio,
    targetBoostRatio,
    boostEnabled,
    proxyAddr,
    useSafe = true
) {
    try {
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

        const strategySub =
        automationSdk.strategySubService.aaveV3Encode.leverageManagement(
            minRatio,
            maxRatio,
            targetBoostRatio,
            targetRepayRatio,
            boostEnabled
        );

        const subId = await subToAaveV3LeverageManagementWithSubProxy(proxy, strategySub);

        return { subId, strategySub };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * Subscribes to Aave V3 Generic Automation strategy. Supports EOA and SW subbing
 * @param {string} eoa EOA address
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
async function subAaveV3GenericAutomationStrategy(eoa, market, isEOA, ratioState, targetRatio, triggerRatio, isGeneric, proxyAddr, useSafe = true) {

    try {
        const marketAddress = await getAaveV3MarketAddress(market);
        const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);

        // Determine user field based on isEOA parameter
        const user = isEOA ? eoa : proxy.address;

        const { chainId } = await hre.ethers.provider.getNetwork();
        let bundleId;

        if (chainId === 42161) {

            // Arbitrum
            bundleId =
            ratioState === 1
                ? automationSdk.enums.Bundles.ArbitrumIds.AAVE_V3_EOA_REPAY
                : automationSdk.enums.Bundles.ArbitrumIds.AAVE_V3_EOA_BOOST;
        } else if (chainId === 10) {

            // Optimism
            bundleId =
            ratioState === 1
                ? automationSdk.enums.Bundles.OptimismIds.AAVE_V3_EOA_REPAY
                : automationSdk.enums.Bundles.OptimismIds.AAVE_V3_EOA_BOOST;
        } else if (chainId === 8453) {

            // Base
            bundleId =
            ratioState === 1
                ? automationSdk.enums.Bundles.BaseIds.AAVE_V3_EOA_REPAY
                : automationSdk.enums.Bundles.BaseIds.AAVE_V3_EOA_BOOST;
        } else {

            // Mainnet (default)
            bundleId =
            ratioState === 1
                ? automationSdk.enums.Bundles.MainnetIds.AAVE_V3_EOA_REPAY
                : automationSdk.enums.Bundles.MainnetIds.AAVE_V3_EOA_BOOST;
        }

        const strategySub = automationSdk.strategySubService.aaveV3Encode.leverageManagementWithoutSubProxy(
            bundleId, marketAddress, user, ratioState, targetRatio, triggerRatio, isGeneric
        );

        if (isEOA) {
            await giveApprovalsFromEOAToSmartWallet(marketAddress, eoa, proxy.address, senderAcc);
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
 * @param {string} eoa EOA address
 * @param {string} market address of the market
 * @param {boolean} isEOA if it is EOA or SW strategy
 * @param {boolean} isBoost true for boost strategy, false for repay strategy
 * @param {string} collSymbol collateral asset symbol
 * @param {string} debtSymbol debt asset symbol
 * @param {uint} triggerPrice trigger price
 * @param {uint} priceState price state (0 for under, 1 for over)
 * @param {uint} targetRatio target ratio
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV3LeverageManagementOnPriceGeneric(
    eoa,
    market,
    isEOA,
    isBoost,
    collSymbol,
    debtSymbol,
    triggerPrice,
    priceState,
    targetRatio,
    proxyAddr,
    useSafe = true
) {
    try {
        const marketAddress = await getAaveV3MarketAddress(market);
        const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);

        // Determine user field based on isEOA parameter
        const user = isEOA ? eoa : proxy.address;

        // Get asset info
        const collAssetData = await getTokenInfo(collSymbol);
        const debtAssetData = await getTokenInfo(debtSymbol);

        // Get full tokens info for asset IDs
        const infos = await getFullTokensInfo(marketAddress, [collAssetData.address, debtAssetData.address]);
        const collAssetInfo = infos[0];
        const debtAssetInfo = infos[1];

        if (isEOA) {
            await giveApprovalsFromEOAToSmartWallet(marketAddress, eoa, proxy.address, senderAcc);
        }

        const { chainId } = await hre.ethers.provider.getNetwork();
        let bundleId;

        if (chainId === 42161) {

            // Arbitrum
            bundleId = isBoost
                ? automationSdk.enums.Bundles.ArbitrumIds.AAVE_V3_EOA_BOOST_ON_PRICE
                : automationSdk.enums.Bundles.ArbitrumIds.AAVE_V3_EOA_REPAY_ON_PRICE;
        } else if (chainId === 10) {

            // Optimism
            bundleId = isBoost
                ? automationSdk.enums.Bundles.OptimismIds.AAVE_V3_EOA_BOOST_ON_PRICE
                : automationSdk.enums.Bundles.OptimismIds.AAVE_V3_EOA_REPAY_ON_PRICE;
        } else if (chainId === 8453) {

            // Base
            bundleId = isBoost
                ? automationSdk.enums.Bundles.BaseIds.AAVE_V3_EOA_BOOST_ON_PRICE
                : automationSdk.enums.Bundles.BaseIds.AAVE_V3_EOA_REPAY_ON_PRICE;
        } else {

            // Mainnet (default)
            bundleId = isBoost
                ? automationSdk.enums.Bundles.MainnetIds.AAVE_V3_EOA_BOOST_ON_PRICE
                : automationSdk.enums.Bundles.MainnetIds.AAVE_V3_EOA_REPAY_ON_PRICE;
        }

        const strategySub = automationSdk.strategySubService.aaveV3Encode.leverageManagementOnPriceGeneric(
            bundleId,
            triggerPrice,
            priceState,
            collAssetData.address,
            collAssetInfo.assetId,
            debtAssetData.address,
            debtAssetInfo.assetId,
            marketAddress,
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
 * @param {string} eoa EOA address
 * @param {string} market address of the market
 * @param {boolean} isEOA if it is EOA or SW strategy
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
async function subAaveV3CloseOnPriceGeneric(
    eoa,
    market,
    isEOA,
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
        const marketAddress = await getAaveV3MarketAddress(market);
        const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);

        // Determine user field based on isEOA parameter
        const user = isEOA ? eoa : proxy.address;

        // Get asset info
        const collAssetData = await getTokenInfo(collSymbol);
        const debtAssetData = await getTokenInfo(debtSymbol);

        // Get full tokens info for asset IDs
        const infos = await getFullTokensInfo(marketAddress, [collAssetData.address, debtAssetData.address]);
        const collAssetInfo = infos[0];
        const debtAssetInfo = infos[1];

        if (isEOA) {
            await giveApprovalsFromEOAToSmartWallet(marketAddress, eoa, proxy.address, senderAcc);
        }

        const { chainId } = await hre.ethers.provider.getNetwork();
        let bundleId;

        if (chainId === 42161) {

            // Arbitrum
            // Arbitrum
            bundleId = automationSdk.enums.Bundles.ArbitrumIds.AAVE_V3_EOA_CLOSE;
        } else if (chainId === 10) {

            // Optimism
            bundleId = automationSdk.enums.Bundles.OptimismIds.AAVE_V3_EOA_CLOSE;
        } else if (chainId === 8453) {

            // Base
            bundleId = automationSdk.enums.Bundles.BaseIds.AAVE_V3_EOA_CLOSE;
        } else {

            // Mainnet (default)
            bundleId = automationSdk.enums.Bundles.MainnetIds.AAVE_V3_EOA_CLOSE;
        }

        const strategySub = automationSdk.strategySubService.aaveV3Encode.closeOnPriceGeneric(
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
        console.log(err);
        throw err;
    }
}

/**
 * Subscribes to Aave V3 Close To Coll strategy
 * @param {string} market aaveV3 market address (optional, will use default market if not provided)
 * @param {string} eoa EOA address
 * @param {string} triggerBaseAssetSymbol trigger base asset symbol
 * @param {string} triggerQuoteAssetSymbol trigger quote asset symbol
 * @param {number} targetPrice trigger price
 * @param {number} priceState 'under' or 'over'
 * @param {string} collSymbol symbol of the collateral asset
 * @param {string} debtSymbol symbol of the debt asset
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveCloseToCollStrategy(
    market,
    eoa,
    triggerBaseAssetSymbol,
    triggerQuoteAssetSymbol,
    targetPrice,
    priceState,
    collSymbol,
    debtSymbol,
    proxyAddr,
    useSafe = true
) {
    try {
        const marketAddress = await getAaveV3MarketAddress(market);
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);

        const collTokenData = await getTokenInfo(collSymbol);
        const debtTokenData = await getTokenInfo(debtSymbol);
        const triggerBaseAssetData = await getTokenInfo(triggerBaseAssetSymbol);
        const triggerQuoteAssetData = await getTokenInfo(triggerQuoteAssetSymbol);

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

        const { chainId } = await hre.ethers.provider.getNetwork();
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
 * Subscribes to Aave V3 Open Order From Collateral strategy bundle
 * @param {string} market aaveV3 market address (optional, will use default market if not provided)
 * @param {string} eoa EOA address
 * @param {number} triggerPrice trigger price
 * @param {string} triggerState 'under' or 'over'
 * @param {string} collSymbol symbol of the collateral asset
 * @param {string} debtSymbol symbol of the debt asset
 * @param {number} targetRatio target ratio
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV3OpenOrderFromCollateral(
    market,
    eoa,
    triggerPrice,
    triggerState,
    collSymbol,
    debtSymbol,
    targetRatio,
    proxyAddr,
    useSafe = true
) {
    try {
        const marketAddress = await getAaveV3MarketAddress(market);
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
        const collTokenData = await getTokenInfo(collSymbol);
        const debtTokenData = await getTokenInfo(debtSymbol);

        const infos = await getFullTokensInfo(marketAddress, [collTokenData.address, debtTokenData.address]);
        const aaveCollInfo = infos[0];
        const aaveDebtInfo = infos[1];

        const { chainId } = await hre.ethers.provider.getNetwork();
        let bundleId;

        if (chainId === 42161) {

            // Arbitrum
            bundleId = automationSdk.enums.Bundles.ArbitrumIds.AAVE_V3_OPEN_ORDER_FROM_COLLATERAL;
        } else if (chainId === 10) {

            // Optimism
            bundleId = automationSdk.enums.Bundles.OptimismIds.AAVE_V3_OPEN_ORDER_FROM_COLLATERAL;
        } else if (chainId === 8453) {

            // Base
            bundleId = automationSdk.enums.Bundles.BaseIds.AAVE_V3_OPEN_ORDER_FROM_COLLATERAL;
        } else {

            // Mainnet (default)
            bundleId = automationSdk.enums.Bundles.MainnetIds.AAVE_V3_OPEN_ORDER_FROM_COLLATERAL;
        }

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
 * @param {string} market aaveV3 market address (optional, will use default market if not provided)
 * @param {string} eoa EOA address
 * @param {number} triggerPrice trigger price
 * @param {string} triggerState 'under' or 'over'
 * @param {string} collSymbol symbol of the collateral asset
 * @param {string} debtSymbol symbol of the debt asset
 * @param {number} targetRatio target ratio
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV3RepayOnPrice(
    market,
    eoa,
    triggerPrice,
    triggerState,
    collSymbol,
    debtSymbol,
    targetRatio,
    proxyAddr,
    useSafe = true
) {
    try {
        const marketAddress = await getAaveV3MarketAddress(market);
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
        const collTokenData = await getTokenInfo(collSymbol);
        const debtTokenData = await getTokenInfo(debtSymbol);

        const infos = await getFullTokensInfo(marketAddress, [collTokenData.address, debtTokenData.address]);
        const aaveCollInfo = infos[0];
        const aaveDebtInfo = infos[1];

        const { chainId } = await hre.ethers.provider.getNetwork();
        let bundleId;

        if (chainId === 42161) {

            // Arbitrum
            bundleId = automationSdk.enums.Bundles.ArbitrumIds.AAVE_V3_REPAY_ON_PRICE;
        } else if (chainId === 10) {

            // Optimism
            bundleId = automationSdk.enums.Bundles.OptimismIds.AAVE_V3_REPAY_ON_PRICE;
        } else if (chainId === 8453) {

            // Base
            bundleId = automationSdk.enums.Bundles.BaseIds.AAVE_V3_REPAY_ON_PRICE;
        } else {

            // Mainnet (default)
            bundleId = automationSdk.enums.Bundles.MainnetIds.AAVE_V3_REPAY_ON_PRICE;
        }

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
 * Subscribes to Aave V3 Collateral Switch strategy
 * @param {string} eoa EOA address
 * @param {string} market aaveV3 market address (optional, will use default market if not provided)
 * @param {string} fromAssetSymbol symbol of the collateral asset to switch from
 * @param {string} toAssetSymbol symbol of the collateral asset to switch to
 * @param {number} amountToSwitch amount of collateral to switch (ignored if isMaxUintSwitch is true)
 * @param {boolean} isMaxUintSwitch if true, use MaxUint256 instead of amountToSwitch
 * @param {number} triggerPrice trigger price
 * @param {string} triggerState 'under' or 'over'
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} StrategySub object and ID of the subscription
 */
async function subAaveV3CollateralSwitch(
    eoa,
    market,
    fromAssetSymbol,
    toAssetSymbol,
    amountToSwitch,
    isMaxUintSwitch,
    triggerPrice,
    triggerState,
    proxyAddr,
    useSafe = true
) {
    try {
        const marketAddress = await getAaveV3MarketAddress(market);
        const [, proxy] = await getSender(eoa, proxyAddr, useSafe);
        const fromTokenData = await getTokenInfo(fromAssetSymbol);
        const toTokenData = await getTokenInfo(toAssetSymbol);
        const fromAddr = fromTokenData.address;
        const toAddr = toTokenData.address;

        const infos = await getFullTokensInfo(marketAddress, [fromAddr, toAddr]);
        const fromId = infos[0].assetId;
        const toId = infos[1].assetId;

        const amountToSwitchFormatted = isMaxUintSwitch
            ? hre.ethers.constants.MaxUint256
            : hre.ethers.utils.parseUnits(amountToSwitch.toString(), fromTokenData.decimals);

        const { chainId } = await hre.ethers.provider.getNetwork();
        let strategyId;

        if (chainId === 42161) {

            // Arbitrum
            strategyId = automationSdk.enums.Strategies.ArbitrumIds.AAVE_V3_COLLATERAL_SWITCH;
        } else if (chainId === 10) {

            // Optimism
            strategyId = automationSdk.enums.Strategies.OptimismIds.AAVE_V3_COLLATERAL_SWITCH;
        } else if (chainId === 8453) {

            // Base
            strategyId = automationSdk.enums.Strategies.BaseIds.AAVE_V3_COLLATERAL_SWITCH;
        } else {

            // Mainnet (default)
            strategyId = automationSdk.enums.Strategies.MainnetIds.AAVE_V3_COLLATERAL_SWITCH;
        }

        const strategySub = automationSdk.strategySubService.aaveV3Encode.collateralSwitch(
            strategyId,
            fromAddr,
            fromId,
            toAddr,
            toId,
            marketAddress,
            amountToSwitchFormatted,
            fromAddr,
            toAddr,
            triggerPrice,
            (triggerState.toString().toLowerCase() === "under")
                ? automationSdk.enums.RatioState.UNDER
                : automationSdk.enums.RatioState.OVER
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
    subAaveV3LeverageManagementWithSubProxyStrategy,
    subAaveCloseToCollStrategy,
    subAaveV3OpenOrderFromCollateral,
    subAaveV3RepayOnPrice,
    subAaveV3GenericAutomationStrategy,
    subAaveV3LeverageManagementOnPriceGeneric,
    subAaveV3CloseOnPriceGeneric,
    subAaveV3CollateralSwitch
};
