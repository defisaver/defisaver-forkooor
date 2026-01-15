const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getSender, approve, executeAction, setBalance, getTokenInfo, getSparkMarketAddress } = require("../../utils");
const { getFullTokensInfo, getLoanData } = require("./view");

/**
 * Create a Spark position for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address (optional, will use default market if not provided)
 * @param {string} collSymbol collateral token symbol
 * @param {string} debtSymbol debt token symbol
 * @param {number} collAmount amount of collateral to be supplied in token units (supports decimals, e.g. 1.5)
 * @param {number} debtAmount amount of debt to be generated in token units (supports decimals, e.g. 2000.25)
 * @param {string} eoa the EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use Safe as smart wallet or DSProxy if smartWallet is not provided
 * @returns {Object} object that has users position data in it
 */
async function createSparkPosition(market, collSymbol, debtSymbol, collAmount, debtAmount, eoa, proxyAddr, useSafe = true) {
    const marketAddress = await getSparkMarketAddress(market);
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const collTokenData = await getTokenInfo(collSymbol);

    await setBalance(collTokenData.address, eoa, collAmount);
    await approve(collTokenData.address, proxy.address, eoa);

    const amountColl = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenData.decimals);
    const infos = await getFullTokensInfo(marketAddress, [collTokenData.address]);
    const aaveCollInfo = infos[0];

    const nullAddr = hre.ethers.constants.AddressZero;
    const supplyAction = new dfs.actions.spark.SparkSupplyAction(
        false, marketAddress, amountColl.toString(), senderAcc._address, collTokenData.address, aaveCollInfo.assetId, true, false, nullAddr
    );

    let createPositionRecipe = new dfs.Recipe("CreateSparkPositionRecipe", [
        supplyAction
    ]);

    if (Number(debtAmount) > 0) {
        const debtTokenData = await getTokenInfo(debtSymbol);
        const amountDebt = hre.ethers.utils.parseUnits(debtAmount.toString(), debtTokenData.decimals);
        const debtInfos = await getFullTokensInfo(marketAddress, [debtTokenData.address]);
        const aaveDebtInfo = debtInfos[0];

        const rateMode = "2"; // variable rate mode

        createPositionRecipe = new dfs.Recipe("CreateSparkPositionRecipe", [
            supplyAction,
            new dfs.actions.spark.SparkBorrowAction(
                false, marketAddress, amountDebt.toString(), senderAcc._address, rateMode, aaveDebtInfo.assetId, false, nullAddr
            )
        ]);
    }
    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    await executeAction("RecipeExecutor", functionData, proxy);

    return {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        ...(await getLoanData(marketAddress, proxy.address)),
        proxy: proxy.address
    };
}

/**
 * Supply collateral for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address (optional, will use default market if not provided)
 * @param {string} collSymbol collateral token symbol
 * @param {number} collAmount amount of collateral to be supplied in token units (supports decimals, e.g. 1.5)
 * @param {string} eoa the EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use Safe as smart wallet or DSProxy if smartWallet is not provided
 * @returns {Object} object that has users position data in it
 */
async function sparkSupply(market, collSymbol, collAmount, eoa, proxyAddr, useSafe = true) {
    const marketAddress = await getSparkMarketAddress(market);
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const collTokenData = await getTokenInfo(collSymbol);

    await setBalance(collTokenData.address, eoa, collAmount);
    await approve(collTokenData.address, proxy.address, eoa);

    const amountColl = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenData.decimals);

    const infos = await getFullTokensInfo(marketAddress, [collTokenData.address]);
    const aaveCollInfo = infos[0];

    const nullAddr = hre.ethers.constants.AddressZero;
    const action = new dfs.actions.spark.SparkSupplyAction(
        false, marketAddress, amountColl.toString(), senderAcc._address, collTokenData.address, aaveCollInfo.assetId, true, false, nullAddr
    );

    await executeAction("SparkSupply", action.encodeForDsProxyCall()[1], proxy);

    return {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        ...(await getLoanData(marketAddress, proxy.address)),
        proxy: proxy.address
    };
}

/**
 * Withdraw collateral for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address (optional, will use default market if not provided)
 * @param {string} collSymbol collateral token symbol
 * @param {number} collAmount amount of collateral to be supplied in token units (supports decimals, e.g. 1.5)
 * @param {string} eoa the EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use Safe as smart wallet or DSProxy if smartWallet is not provided
 * @returns {Object} object that has users position data in it
 */
async function sparkWithdraw(market, collSymbol, collAmount, eoa, proxyAddr, useSafe = true) {
    const marketAddress = await getSparkMarketAddress(market);
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const collTokenData = await getTokenInfo(collSymbol);
    const amountColl = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenData.decimals);

    const infos = await getFullTokensInfo(marketAddress, [collTokenData.address]);
    const aaveCollInfo = infos[0];
    const action = new dfs.actions.spark.SparkWithdrawAction(
        false, marketAddress, amountColl.toString(), senderAcc._address, aaveCollInfo.assetId
    );

    await executeAction("SparkWithdraw", action.encodeForDsProxyCall()[1], proxy);

    return {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        ...(await getLoanData(marketAddress, proxy.address)),
        proxy: proxy.address
    };
}

/**
 * Borrow debt for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address (optional, will use default market if not provided)
 * @param {string} debtSymbol debt token symbol
 * @param {number} debtAmount amount of debt to be generated in token units (supports decimals, e.g. 2000.25)
 * @param {string} eoa the EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use Safe as smart wallet or DSProxy if smartWallet is not provided
 * @returns {Object} object that has users position data in it
 */
async function sparkBorrow(market, debtSymbol, debtAmount, eoa, proxyAddr, useSafe = true) {
    const marketAddress = await getSparkMarketAddress(market);
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const debtTokenData = await getTokenInfo(debtSymbol);

    const amountDebt = hre.ethers.utils.parseUnits(debtAmount.toString(), debtTokenData.decimals);

    const infos = await getFullTokensInfo(marketAddress, [debtTokenData.address]);
    const aaveDebtInfo = infos[0];

    const nullAddr = hre.ethers.constants.AddressZero;
    const rateMode = "2"; // variable rate mode
    const action = new dfs.actions.spark.SparkBorrowAction(
        false, marketAddress, amountDebt.toString(), senderAcc._address, rateMode, aaveDebtInfo.assetId, false, nullAddr
    );

    await executeAction("SparkBorrow", action.encodeForDsProxyCall()[1], proxy);

    return {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        ...(await getLoanData(marketAddress, proxy.address)),
        proxy: proxy.address
    };
}

/**
 * Payback debt for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address (optional, will use default market if not provided)
 * @param {string} debtSymbol debt token symbol
 * @param {number} debtAmount amount of debt to be generated in token units (supports decimals, e.g. 2000.25)
 * @param {string} eoa the EOA which will be sending transactions and own the newly created wallet if smartWallet is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use Safe as smart wallet or DSProxy if smartWallet is not provided
 * @returns {Object} object that has users position data in it
 */
async function sparkPayback(market, debtSymbol, debtAmount, eoa, proxyAddr, useSafe = true) {
    const marketAddress = await getSparkMarketAddress(market);
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const debtTokenData = await getTokenInfo(debtSymbol);

    const amountDebt = hre.ethers.utils.parseUnits(debtAmount.toString(), debtTokenData.decimals);

    await setBalance(debtTokenData.address, eoa, debtAmount);
    await approve(debtTokenData.address, proxy.address, eoa);

    const infos = await getFullTokensInfo(marketAddress, [debtTokenData.address]);
    const aaveDebtInfo = infos[0];

    const nullAddr = hre.ethers.constants.AddressZero;
    const rateMode = "2"; // variable rate mode
    const action = new dfs.actions.spark.SparkPaybackAction(
        false, marketAddress, amountDebt.toString(), senderAcc._address, rateMode, debtTokenData.address, aaveDebtInfo.assetId, false, nullAddr
    );

    await executeAction("SparkPayback", action.encodeForDsProxyCall()[1], proxy);

    return {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        ...(await getLoanData(marketAddress, proxy.address)),
        proxy: proxy.address
    };
}

module.exports = {
    createSparkPosition,
    sparkSupply,
    sparkWithdraw,
    sparkBorrow,
    sparkPayback
};
