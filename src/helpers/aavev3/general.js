const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getSender, approve, executeAction, setBalance, getTokenInfo, getAaveV3MarketAddress } = require("../../utils");
const { getFullTokensInfo, getLoanData } = require("./view");
const { IPoolAddressesProviderAbi, IPoolV3Abi, IL2PoolV3Abi, IDebtTokenAbi } = require("../../abi/aaveV3/abis");

/**
 * Create a Aave position for sender on his proxy (created if he doesn't have one)
 * @param {string} market market address (optional, will use default market if not provided)
 * @param {string} collSymbol collateral token symbol
 * @param {string} debtSymbol debt token symbol
 * @param {number} collAmount amount of collateral to be supplied (whole number)
 * @param {number} debtAmount amount of debt to be generated (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} isEOA Whether to create an EOA or SW position
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function createAaveV3Position(market, collSymbol, debtSymbol, collAmount, debtAmount, owner, proxyAddr, isEOA, useSafe = true) {
    const marketAddress = await getAaveV3MarketAddress(market);

    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);

    // Determine user field based on isEOA parameter
    const user = isEOA ? owner : proxy.address;

    const collTokenData = await getTokenInfo(collSymbol);
    const debtTokenData = await getTokenInfo(debtSymbol);

    // set coll balance for the user
    await setBalance(collTokenData.address, owner, collAmount);

    // approve coll asset for proxy to pull
    await approve(collTokenData.address, proxy.address, owner);

    // Get market contract and pool address for EOA debt delegation
    const aaveMarketContract = new hre.ethers.Contract(
        marketAddress,
        IPoolAddressesProviderAbi,
        senderAcc
    );
    const poolAddress = await aaveMarketContract.getPool();

    // If EOA position, give proxy additional permissions - debt delegation
    if (isEOA) {

        // Use the appropriate interface based on network
        const network = hre.network.name;
        const poolAbi = network !== "mainnet" ? IL2PoolV3Abi : IPoolV3Abi;
        const poolContract = new hre.ethers.Contract(poolAddress, poolAbi, senderAcc);
        const collReserveData = await poolContract.getReserveData(collTokenData.address);

        // Approve aCollToken from EOA to Smart Wallet
        await approve(collReserveData.aTokenAddress, proxy.address, owner);
        console.log("aCollToken approved from EOA to Smart Wallet");

        const debtReserveData = await poolContract.getReserveData(debtTokenData.address);

        // Approve variable debt token delegation to proxy
        const debtTokenContract = new hre.ethers.Contract(debtReserveData.variableDebtTokenAddress, IDebtTokenAbi, senderAcc);
        const amountDebt = hre.ethers.utils.parseUnits(debtAmount.toString(), debtTokenData.decimals);

        await debtTokenContract.approveDelegation(proxy.address, amountDebt);
        console.log("Debt token approved for delegation to proxy");
    }

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
        true,
        user
    );

    const borrowAction = new dfs.actions.aaveV3.AaveV3BorrowAction(
        false,
        marketAddress,
        amountDebt.toString(),
        senderAcc._address,
        "2", // variable rate mode
        aaveDebtInfo.assetId,
        true,
        user
    );

    let createPositionRecipe = new dfs.Recipe("CreateAaveV3PositionRecipe", [
        supplyAction
    ]);

    if (debtAmount !== 0) {
        createPositionRecipe = new dfs.Recipe("CreateAaveV3PositionRecipe", [
            supplyAction,
            borrowAction
        ]);
    }

    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    await executeAction("RecipeExecutor", functionData, proxy);

    return {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        ...(await getLoanData(marketAddress, user)),
        proxy: proxy.address
    };
}

/**
 * Supplies token to a Aave position on user wallet
 * @param {string} market market address
 * @param {string} collSymbol collateral token symbol
 * @param {number} amount amount of collateral to be supplied (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet if proxyAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Supply(market, collSymbol, amount, owner, proxyAddr = hre.ethers.constants.AddressZero, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);
    const marketAddress = await getAaveV3MarketAddress(market);

    const collTokenData = await getTokenInfo(collSymbol);

    // set coll balance for the user
    await setBalance(collTokenData.address, owner, amount);

    // approve coll asset for proxy to pull
    await approve(collTokenData.address, proxy.address, owner);

    const amountColl = hre.ethers.utils.parseUnits(amount.toString(), collTokenData.decimals);

    const infos = await getFullTokensInfo(marketAddress, [collTokenData.address]);
    const aaveCollInfo = infos[0];

    const nullAddr = "0x0000000000000000000000000000000000000000";
    // eslint-disable-next-line max-len
    const action = new dfs.actions.aaveV3.AaveV3SupplyAction(false, marketAddress, amountColl.toString(), senderAcc._address, collTokenData.address, aaveCollInfo.assetId, true, false, nullAddr);

    await executeAction("AaveV3Supply", action.encodeForDsProxyCall()[1], proxy);

    return await getLoanData(marketAddress, proxy.address);
}

/**
 * Withdraw token from a Aave position on user wallet
 * @param {string} market market address
 * @param {string} collSymbol collateral token symbol
 * @param {number} amount amount of collateral to be withdrawnw (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Withdraw(market, collSymbol, amount, owner, proxyAddr = hre.ethers.constants.AddressZero, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);
    const marketAddress = await getAaveV3MarketAddress(market);

    const collTokenData = await getTokenInfo(collSymbol);
    const amountColl = hre.ethers.utils.parseUnits(amount.toString(), collTokenData.decimals);

    const infos = await getFullTokensInfo(marketAddress, [collTokenData.address]);
    const aaveCollInfo = infos[0];

    // eslint-disable-next-line max-len
    const action = new dfs.actions.aaveV3.AaveV3WithdrawAction(false, marketAddress, amountColl.toString(), senderAcc._address, aaveCollInfo.assetId);

    await executeAction("AaveV3Withdraw", action.encodeForDsProxyCall()[1], proxy);

    return await getLoanData(marketAddress, proxy.address);
}

/**
 * Borrows a token from Aave
 * @param {string} market market address (optional, will use default market if not provided)
 * @param {string} debtSymbol debt token symbol
 * @param {number} amount amount of debt to be generated (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Borrow(market, debtSymbol, amount, owner, proxyAddr = hre.ethers.constants.AddressZero, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);
    const marketAddress = await getAaveV3MarketAddress(market);

    const debtTokenData = await getTokenInfo(debtSymbol);

    const amountDebt = hre.ethers.utils.parseUnits(amount.toString(), debtTokenData.decimals);

    const infos = await getFullTokensInfo(marketAddress, [debtTokenData.address]);
    const aaveDebtInfo = infos[0];

    const nullAddr = "0x0000000000000000000000000000000000000000";
    // eslint-disable-next-line max-len
    const action = new dfs.actions.aaveV3.AaveV3BorrowAction(false, marketAddress, amountDebt.toString(), senderAcc._address, "2", aaveDebtInfo.assetId, false, nullAddr);

    await executeAction("AaveV3Borrow", action.encodeForDsProxyCall()[1], proxy);

    return await getLoanData(marketAddress, proxy.address);
}

/**
 * Payback a token to Aave
 * @param {string} market market address (optional, will use default market if not provided)
 * @param {string} debtSymbol debt token symbol
 * @param {number} amount amount of debt to be payed back (whole number)
 * @param {string} owner the EOA which will be sending transactions and own the newly created wallet
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function aaveV3Payback(market, debtSymbol, amount, owner, proxyAddr = hre.ethers.constants.AddressZero, useSafe = true) {
    const [senderAcc, proxy] = await getSender(owner, proxyAddr, useSafe);
    const marketAddress = await getAaveV3MarketAddress(market);

    const debtTokenData = await getTokenInfo(debtSymbol);

    const amountDebt = hre.ethers.utils.parseUnits(amount.toString(), debtTokenData.decimals);

    // set coll balance for the user
    await setBalance(debtTokenData.address, owner, amount);

    // approve coll asset for proxy to pull
    await approve(debtTokenData.address, proxy.address, owner);

    const infos = await getFullTokensInfo(marketAddress, [debtTokenData.address]);
    const aaveDebtInfo = infos[0];

    const nullAddr = "0x0000000000000000000000000000000000000000";
    // eslint-disable-next-line max-len
    const action = new dfs.actions.aaveV3.AaveV3PaybackAction(false, marketAddress, amountDebt.toString(), senderAcc._address, "2", debtTokenData.address, aaveDebtInfo.assetId, false, nullAddr);

    await executeAction("AaveV3Payback", action.encodeForDsProxyCall()[1], proxy);

    return await getLoanData(marketAddress, proxy.address);
}

module.exports = {
    createAaveV3Position,
    aaveV3Supply,
    aaveV3Withdraw,
    aaveV3Borrow,
    aaveV3Payback
};
