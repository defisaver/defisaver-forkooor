const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getAssetInfo } = require("@defisaver/tokens");
const { getSender, approve, executeAction, setBalance } = require("../../utils");
const { getFullTokensInfo, getLoanData } = require("./view");

/**
 * Create a Aave position for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address
 * @param {string} collToken collateral token symbol
 * @param {string} debtToken debt token symbol
 * @param {number} rateMode type of borrow debt [Stable: 1, Variable: 2]
 * @param {number} coll amount of collateral to be supplied (whole number)
 * @param {number} debt amount of debt to be generated (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created dsproxy
 * @returns {Object} object that has users position data in it
 */
async function createAaveV3Position(market, collToken, debtToken, rateMode, coll, debt, owner) {
    const [senderAcc, proxy] = await getSender(owner);

    const collTokenData = getAssetInfo(collToken === "ETH" ? "WETH" : collToken);
    const debtTokenData = getAssetInfo(debtToken === "ETH" ? "WETH" : debtToken);

    // set coll balance for the user
    await setBalance(collTokenData.address, owner, coll);

    // approve coll asset for proxy to pull
    await approve(collTokenData.address, proxy.address, owner);

    const amountColl = hre.ethers.utils.parseUnits(coll.toString(), collTokenData.decimals);
    const amountDebt = hre.ethers.utils.parseUnits(debt.toString(), debtTokenData.decimals);

    const infos = await getFullTokensInfo(market, [collTokenData.address, debtTokenData.address]);
    const aaveCollInfo = infos[0];
    const aaveDebtInfo = infos[1];

    const nullAddr = "0x0000000000000000000000000000000000000000";
    const createPositionRecipe = new dfs.Recipe("CreateAaveV3PositionRecipe", [
        // eslint-disable-next-line max-len
        new dfs.actions.spark.SparkSupplyAction(false, market, amountColl.toString(), senderAcc._address, collTokenData.address, aaveCollInfo.assetId, true, false, nullAddr),
        // eslint-disable-next-line max-len
        new dfs.actions.spark.SparkBorrowAction(false, market, amountDebt.toString(), senderAcc._address, rateMode.toString(), aaveDebtInfo.assetId, false, nullAddr)
    ]);
    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    await executeAction("RecipeExecutor", functionData, proxy);

    return await getLoanData(market, proxy.address);
}

/**
 * Supplies token to a Aave position on DSProxy
 * @param {string} market market address
 * @param {string} collToken collateral token symbol
 * @param {number} amount amount of collateral to be supplied (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created dsproxy
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Supply(market, collToken, amount, owner) {
    const [senderAcc, proxy] = await getSender(owner);

    const collTokenData = getAssetInfo(collToken === "ETH" ? "WETH" : collToken);

    // set coll balance for the user
    await setBalance(collTokenData.address, owner, amount);

    // approve coll asset for proxy to pull
    await approve(collTokenData.address, proxy.address, owner);

    const amountColl = hre.ethers.utils.parseUnits(amount.toString(), collTokenData.decimals);

    const infos = await getFullTokensInfo(market, [collTokenData.address]);
    const aaveCollInfo = infos[0];

    const nullAddr = "0x0000000000000000000000000000000000000000";
    // eslint-disable-next-line max-len
    const action = new dfs.actions.aaveV3.AaveV3SupplyAction(false, market, amountColl.toString(), senderAcc._address, collTokenData.address, aaveCollInfo.assetId, true, false, nullAddr);

    await executeAction("AaveV3Supply", action.encodeForDsProxyCall()[1], proxy);

    return await getLoanData(market, proxy.address);
}

/**
 * Withdraw token from a Aave position on DSProxy
 * @param {string} market market address
 * @param {string} collToken collateral token symbol
 * @param {number} amount amount of collateral to be withdrawnw (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created dsproxy
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Withdraw(market, collToken, amount, owner) {
    const [senderAcc, proxy] = await getSender(owner);

    const collTokenData = getAssetInfo(collToken === "ETH" ? "WETH" : collToken);
    const amountColl = hre.ethers.utils.parseUnits(amount.toString(), collTokenData.decimals);

    const infos = await getFullTokensInfo(market, [collTokenData.address]);
    const aaveCollInfo = infos[0];

    // eslint-disable-next-line max-len
    const action = new dfs.actions.aaveV3.AaveV3WithdrawAction(false, market, amountColl.toString(), senderAcc._address, aaveCollInfo.assetId);

    await executeAction("AaveV3Withdraw", action.encodeForDsProxyCall()[1], proxy);

    return await getLoanData(market, proxy.address);
}

/**
 * Borrows a token from Aave
 * @param {string} market market address
 * @param {string} debtToken debt token symbol
 * @param {number} rateMode type of borrow debt [Stable: 1, Variable: 2]
 * @param {number} amount amount of debt to be generated (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created dsproxy
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Borrow(market, debtToken, rateMode, amount, owner) {
    const [senderAcc, proxy] = await getSender(owner);

    const debtTokenData = getAssetInfo(debtToken === "ETH" ? "WETH" : debtToken);

    const amountDebt = hre.ethers.utils.parseUnits(amount.toString(), debtTokenData.decimals);

    const infos = await getFullTokensInfo(market, [debtTokenData.address]);
    const aaveDebtInfo = infos[0];

    const nullAddr = "0x0000000000000000000000000000000000000000";
    // eslint-disable-next-line max-len
    const action = new dfs.actions.aaveV3.AaveV3BorrowAction(false, market, amountDebt.toString(), senderAcc._address, rateMode.toString(), aaveDebtInfo.assetId, false, nullAddr);

    await executeAction("AaveV3Borrow", action.encodeForDsProxyCall()[1], proxy);

    return await getLoanData(market, proxy.address);
}

/**
 * Payback a token to Aave
 * @param {string} market market address
 * @param {string} debtToken debt token symbol
 * @param {number} rateMode type of borrow debt [Stable: 1, Variable: 2]
 * @param {number} amount amount of debt to be payed back (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created dsproxy
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Payback(market, debtToken, rateMode, amount, owner) {
    const [senderAcc, proxy] = await getSender(owner);

    const debtTokenData = getAssetInfo(debtToken === "ETH" ? "WETH" : debtToken);

    const amountDebt = hre.ethers.utils.parseUnits(amount.toString(), debtTokenData.decimals);

    // set coll balance for the user
    await setBalance(debtTokenData.address, owner, amount);

    // approve coll asset for proxy to pull
    await approve(debtTokenData.address, proxy.address, owner);

    const infos = await getFullTokensInfo(market, [debtTokenData.address]);
    const aaveDebtInfo = infos[0];

    const nullAddr = "0x0000000000000000000000000000000000000000";
    // eslint-disable-next-line max-len
    const action = new dfs.actions.aaveV3.AaveV3PaybackAction(false, market, amountDebt.toString(), senderAcc._address, rateMode.toString(), debtTokenData.address, aaveDebtInfo.assetId, false, nullAddr);

    await executeAction("AaveV3Payback", action.encodeForDsProxyCall()[1], proxy);

    return await getLoanData(market, proxy.address);
}

module.exports = {
    createAaveV3Position,
    aaveV3Supply,
    aaveV3Withdraw,
    aaveV3Borrow,
    aaveV3Payback
};
