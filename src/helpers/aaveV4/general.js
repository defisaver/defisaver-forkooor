const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getSender, approve, executeAction, setBalance, getTokenInfo, getAaveV4SpokeAddress } = require("../../utils");
const { getReserveInfoForTokens, getLoanData } = require("./view");

/**
 * Create an Aave V4 position for sender on his proxy (created if he doesn't have one)
 * @param {string} spoke spoke address (optional, will use default spoke if not provided)
 * @param {string} collSymbol collateral token symbol
 * @param {string} debtSymbol debt token symbol
 * @param {number} collAmount amount of collateral to be supplied (whole number)
 * @param {number} debtAmount amount of debt to be generated (whole number), can be 0 for no debt
 * @param {string} eoa the EOA which will be sending transactions and own the newly created wallet if walletAddr is not provided
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use the safe as smart wallet or dsproxy if walletAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function createAaveV4Position(spoke, collSymbol, debtSymbol, collAmount, debtAmount, eoa, proxyAddr, useSafe = true) {
    const spokeAddress = await getAaveV4SpokeAddress(spoke);

    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);

    const user = proxy.address;

    const collTokenData = await getTokenInfo(collSymbol);
    const debtTokenData = await getTokenInfo(debtSymbol);

    // set coll balance for the user
    await setBalance(collTokenData.address, eoa, collAmount);

    // approve coll asset for proxy to pull
    await approve(collTokenData.address, proxy.address, eoa);

    // Get reserve info for collateral and debt tokens
    const reserveInfos = await getReserveInfoForTokens(spokeAddress, [collTokenData.address, debtTokenData.address]);
    const collReserveInfo = reserveInfos[0];
    const debtReserveInfo = reserveInfos[1];

    const amountColl = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenData.decimals);
    const amountDebt = hre.ethers.utils.parseUnits(debtAmount.toString(), debtTokenData.decimals);

    const supplyAction = new dfs.actions.aaveV4.AaveV4SupplyAction(
        spokeAddress,
        user, // onBehalf
        senderAcc._address, // from
        collReserveInfo.reserveId.toString(),
        amountColl.toString(),
        true, // useAsCollateral
        collTokenData.address // tokenAddress for approval
    );

    let createPositionRecipe = new dfs.Recipe("CreateAaveV4PositionRecipe", [
        supplyAction
    ]);

    if (debtAmount !== 0) {
        const borrowAction = new dfs.actions.aaveV4.AaveV4BorrowAction(
            spokeAddress,
            user, // onBehalf
            senderAcc._address, // to
            debtReserveInfo.reserveId.toString(),
            amountDebt.toString()
        );

        createPositionRecipe = new dfs.Recipe("CreateAaveV4PositionRecipe", [
            supplyAction,
            borrowAction
        ]);
    }

    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    await executeAction("RecipeExecutor", functionData, proxy);

    return {
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        ...(await getLoanData(spokeAddress, user)),
        proxy: proxy.address
    };
}

module.exports = {
    createAaveV4Position
};
