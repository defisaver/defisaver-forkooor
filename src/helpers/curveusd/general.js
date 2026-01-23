const hre = require("hardhat");
const dfs = require("@defisaver/sdk");
const { getAssetInfoByAddress } = require("@defisaver/tokens");
const { getSender, setBalance, approve, executeAction } = require("../../utils");
const { curveusdControllerAbi } = require("../../abi/curveusd/abis");
const { getUserData } = require("./view");

/**
 * Create a CurveUSD position for sender on his proxy (created if he doesn't have one)
 * @param {string} controller CurveUSD controller address
 * @param {number} collAmount amount of collateral to be supplied in token units (supports decimals, e.g. 2.5)
 * @param {number} debtAmount amount of crvUSD debt to be generated in token units (supports decimals, e.g. 2000.25)
 * @param {string} eoa the EOA which will be sending transactions and own the newly created wallet if proxyAddr is not provided
 * @param {number} numberOfBands number of bands for creating a new CurveUSD position
 * @param {string} proxyAddr the address of the wallet that will be used for the position, if not provided a new wallet will be created
 * @param {boolean} useSafe whether to use Safe as smart wallet or dsproxy if proxyAddr is not provided
 * @returns {Object} object that has users position data in it
 */
async function createCurveUsdPosition(controller, collAmount, debtAmount, eoa, numberOfBands, proxyAddr, useSafe = true) {
    const [senderAcc, proxy] = await getSender(eoa, proxyAddr, useSafe);
    const controllerContract = new hre.ethers.Contract(controller, curveusdControllerAbi, senderAcc);
    const collateralTokenAddress = await controllerContract.collateral_token();

    // set coll balance for the user
    await setBalance(collateralTokenAddress, eoa, collAmount);

    // approve coll asset for proxy to pull
    await approve(collateralTokenAddress, proxy.address, eoa);
    const collTokenInfo = getAssetInfoByAddress(collateralTokenAddress);
    const amountColl = hre.ethers.utils.parseUnits(collAmount.toString(), collTokenInfo.decimals);
    const amountDebt = hre.ethers.utils.parseUnits(debtAmount.toString(), 18);
    const createPositionRecipe = new dfs.Recipe("CreateCurveUsdPosition", [
        new dfs.actions.curveusd.CurveUsdCreateAction(controller, eoa, eoa, amountColl, amountDebt, numberOfBands)
    ]);
    const functionData = createPositionRecipe.encodeForDsProxyCall()[1];

    await executeAction("RecipeExecutor", functionData, proxy);
    return await getUserData(controller, proxy.address);
}


module.exports = {
    createCurveUsdPosition
};
