const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getAssetInfo } = require("@defisaver/tokens");
const { getSender, approve, executeAction, setBalance, addresses } = require("../../utils");
const { getFullTokensInfo, getLoanData } = require("./view");

/**
 * Create a Aave position for sender on his proxy (created if he doesn't have one)
 * @param {boolean} useDefaultMarket whether to use the default market or not
 * @param {string} market market address
 * @param {string} collToken collateral token symbol
 * @param {string} debtToken debt token symbol
 * @param {number} rateMode type of borrow debt [Stable: 1, Variable: 2]
 * @param {number} collAmount amount of collateral to be supplied (whole number)
 * @param {number} debtAmount amount of debt to be generated (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function createAaveV3Position(useDefaultMarket, market, collToken, debtToken, rateMode, collAmount, debtAmount, owner, proxyAddr, useSafe = true) {
    const { chainId } = await hre.ethers.provider.getNetwork();

    let marketAddress = market;

    if (useDefaultMarket) {
        marketAddress = addresses[chainId].AAVE_V3_MARKET;
    }

    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

    const collTokenData = getAssetInfo(collToken === "ETH" ? "WETH" : collToken, chainId);
    const debtTokenData = getAssetInfo(debtToken === "ETH" ? "WETH" : debtToken, chainId);

    // set coll balance for the user
    await setBalance(collTokenData.address, owner, collAmount);

    // approve coll asset for proxy to pull
    await approve(collTokenData.address, proxy.address, owner);

    const amountColl = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenData.decimals);
    const amountDebt = hre.ethers.utils.parseUnits(debtAmount.toString(), debtTokenData.decimals);

    const infos = await getFullTokensInfo(marketAddress, [collTokenData.address, debtTokenData.address]);
    const aaveCollInfo = infos[0];
    const aaveDebtInfo = infos[1];

    const supplyAction = new dfs.actions.aaveV3.AaveV3SupplyAction(
        false,
        marketAddress,
        amountColl.toString(),
        senderAcc._address,
        collTokenData.address,
        aaveCollInfo.assetId,
        true,
        false,
        proxy.address
    );

    const borrowAction = new dfs.actions.aaveV3.AaveV3BorrowAction(
        false,
        marketAddress,
        amountDebt.toString(),
        senderAcc._address,
        rateMode.toString(),
        aaveDebtInfo.assetId,
        false,
        proxy.address
    );

    const createPositionRecipe = new dfs.Recipe("CreateAaveV3PositionRecipe", [
        supplyAction,
        borrowAction
    ]);

    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    await executeAction("RecipeExecutor", functionData, proxy);

    return await getLoanData(marketAddress, proxy.address);
}

/**
 * Supplies token to a Aave position on user wallet
 * @param {string} market market address
 * @param {string} collToken collateral token symbol
 * @param {number} amount amount of collateral to be supplied (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if proxyAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Supply(market, collToken, amount, owner, proxyAddr = hre.ethers.constants.AddressZero, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

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
 * Withdraw token from a Aave position on user wallet
 * @param {string} market market address
 * @param {string} collToken collateral token symbol
 * @param {number} amount amount of collateral to be withdrawnw (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Withdraw(market, collToken, amount, owner, proxyAddr = hre.ethers.constants.AddressZero, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

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
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Borrow(market, debtToken, rateMode, amount, owner, proxyAddr = hre.ethers.constants.AddressZero, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

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
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Payback(market, debtToken, rateMode, amount, owner, proxyAddr = hre.ethers.constants.AddressZero, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

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
