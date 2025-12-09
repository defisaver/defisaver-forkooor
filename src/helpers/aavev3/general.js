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
 * @param {string} eoa the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} isEOA Whether to create an EOA or SW position
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function createAaveV3Position(market, collSymbol, debtSymbol, collAmount, debtAmount, eoa, proxyAddr, isEOA, useSafe = true) {
    const marketAddress = await getAaveV3MarketAddress(market);

    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);

    // Determine user field based on isEOA parameter
    const user = isEOA ? eoa : proxy.address;

    const collTokenData = await getTokenInfo(collSymbol);
    const debtTokenData = await getTokenInfo(debtSymbol);

    // set coll balance for the user
    await setBalance(collTokenData.address, eoa, collAmount);

    // approve coll asset for proxy to pull
    await approve(collTokenData.address, proxy.address, eoa);

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
        await approve(collReserveData.aTokenAddress, proxy.address, eoa);
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


module.exports = {
    createAaveV3Position
};
