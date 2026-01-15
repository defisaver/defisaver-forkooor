const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getSender, approve, executeAction, setBalance, getTokenInfo } = require("../../utils");
const { getFullTokensInfo, getLoanData } = require("./view");

/**
 * Create a Spark position for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address
 * @param {string} collSymbol collateral token symbol
 * @param {string} debtSymbol debt token symbol
 * @param {number} rateMode type of borrow debt [Stable: 1, Variable: 2]
 * @param {number} coll amount of collateral to be supplied (whole number)
 * @param {number} debt amount of debt to be generated (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function createSparkPosition(market, collSymbol, debtSymbol, rateMode, coll, debt, owner, proxyAddr, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);
    const collTokenData = await getTokenInfo(collSymbol);
    const debtTokenData = await getTokenInfo(debtSymbol);

    // set coll balance for the user
    await setBalance(collTokenData.address, owner, coll);

    // approve coll asset for proxy to pull
    await approve(collTokenData.address, proxy.address, owner);

    const amountColl = hre.ethers.utils.parseUnits(coll.toString(), collTokenData.decimals);
    const amountDebt = hre.ethers.utils.parseUnits(debt.toString(), debtTokenData.decimals);

    const infos = await getFullTokensInfo(market, [collTokenData.address, debtTokenData.address]);
    const aaveCollInfo = infos[0];
    const aaveDebtInfo = infos[1];

    const nullAddr = hre.ethers.constants.AddressZero;
    const createPositionRecipe = new dfs.Recipe("CreateSparkPositionRecipe", [
        new dfs.actions.spark.SparkSupplyAction(
            false, market, amountColl.toString(), senderAcc._address, collTokenData.address, aaveCollInfo.assetId, true, false, nullAddr
        ),
        new dfs.actions.spark.SparkBorrowAction(
            false, market, amountDebt.toString(), senderAcc._address, rateMode.toString(), aaveDebtInfo.assetId, false, nullAddr
        )
    ]);
    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    try {
        await executeAction("RecipeExecutor", functionData, proxy);
    } catch (err) {
        throw new Error(`CreateSparkPositionRecipe = ${err}`);
    }

    return await getLoanData(market, proxy.address);
}

/**
 * Supply collateral for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address
 * @param {string} collSymbol collateral token symbol
 * @param {number} amount amount of collateral to be supplied (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function sparkSupply(market, collSymbol, amount, owner, proxyAddr, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);
    const collTokenData = await getTokenInfo(collSymbol);

    // set coll balance for the user
    await setBalance(collTokenData.address, owner, amount);

    // approve coll asset for proxy to pull
    await approve(collTokenData.address, proxy.address, owner);

    const amountColl = hre.ethers.utils.parseUnits(amount.toString(), collTokenData.decimals);

    const infos = await getFullTokensInfo(market, [collTokenData.address]);
    const aaveCollInfo = infos[0];

    const nullAddr = hre.ethers.constants.AddressZero;
    const action = new dfs.actions.spark.SparkSupplyAction(
        false, market, amountColl.toString(), senderAcc._address, collTokenData.address, aaveCollInfo.assetId, true, false, nullAddr
    );

    try {
        await executeAction("SparkSupply", action.encodeForDsProxyCall()[1], proxy);
    } catch (err) {
        throw new Error(`SparkSupply = ${err}`);
    }

    return await getLoanData(market, proxy.address);
}

/**
 * Withdraw collateral for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address
 * @param {string} collSymbol collateral token symbol
 * @param {number} amount amount of collateral to be supplied (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function sparkWithdraw(market, collSymbol, amount, owner, proxyAddr, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);
    const collTokenData = await getTokenInfo(collSymbol);
    const amountColl = hre.ethers.utils.parseUnits(amount.toString(), collTokenData.decimals);

    const infos = await getFullTokensInfo(market, [collTokenData.address]);
    const aaveCollInfo = infos[0];

    const action = new dfs.actions.spark.SparkWithdrawAction(
        false, market, amountColl.toString(), senderAcc._address, aaveCollInfo.assetId
    );

    try {
        await executeAction("SparkWithdraw", action.encodeForDsProxyCall()[1], proxy);
    } catch (err) {
        throw new Error(`SparkWithdraw = ${err}`);
    }

    return await getLoanData(market, proxy.address);
}

/**
 * Borrow debt for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address
 * @param {string} debtSymbol debt token symbol
 * @param {number} rateMode type of borrow debt [Stable: 1, Variable: 2]
 * @param {number} amount amount of debt to be generated (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function sparkBorrow(market, debtSymbol, rateMode, amount, owner, proxyAddr, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);
    const debtTokenData = await getTokenInfo(debtSymbol);

    const amountDebt = hre.ethers.utils.parseUnits(amount.toString(), debtTokenData.decimals);

    const infos = await getFullTokensInfo(market, [debtTokenData.address]);
    const aaveDebtInfo = infos[0];

    const nullAddr = hre.ethers.constants.AddressZero;
    const action = new dfs.actions.spark.SparkBorrowAction(
        false, market, amountDebt.toString(), senderAcc._address, rateMode.toString(), aaveDebtInfo.assetId, false, nullAddr
    );

    try {
        await executeAction("SparkBorrow", action.encodeForDsProxyCall()[1], proxy);
    } catch (err) {
        throw new Error(`SparkBorrow = ${err}`);
    }

    return await getLoanData(market, proxy.address);
}

/**
 * Payback debt for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address
 * @param {string} debtSymbol debt token symbol
 * @param {number} rateMode type of borrow debt [Stable: 1, Variable: 2]
 * @param {number} amount amount of debt to be generated (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function sparkPayback(market, debtSymbol, rateMode, amount, owner, proxyAddr, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);
    const debtTokenData = await getTokenInfo(debtSymbol);

    const amountDebt = hre.ethers.utils.parseUnits(amount.toString(), debtTokenData.decimals);

    // set coll balance for the user
    await setBalance(debtTokenData.address, owner, amount);

    // approve coll asset for proxy to pull
    await approve(debtTokenData.address, proxy.address, owner);

    const infos = await getFullTokensInfo(market, [debtTokenData.address]);
    const aaveDebtInfo = infos[0];

    const nullAddr = hre.ethers.constants.AddressZero;
    const action = new dfs.actions.spark.SparkPaybackAction(
        false, market, amountDebt.toString(), senderAcc._address, rateMode.toString(), debtTokenData.address, aaveDebtInfo.assetId, false, nullAddr
    );

    try {
        await executeAction("SparkPayback", action.encodeForDsProxyCall()[1], proxy);
    } catch (err) {
        throw new Error(`SparkPayback = ${err}`);
    }

    return await getLoanData(market, proxy.address);
}

module.exports = {
    createSparkPosition,
    sparkSupply,
    sparkWithdraw,
    sparkBorrow,
    sparkPayback
};
